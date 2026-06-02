import { unstable_cache as next_unstable_cache } from "next/cache";
import { headers } from "next/headers";

import {
  getNotionClient,
  NotionPage,
  resolveDataSourceIdSafe,
  resolveFAQDatabaseCached,
} from "./notion";
import { resolveFAQPageIdCached } from "./notion-builder";

// Custom cache wrapper with environment-aware revalidation strategy:
// - Development: 1 second → instant page reloads when editing Notion locally.
// - Production:  5 seconds cap → pages are served from cache instantly, but revalidated
//   very frequently in the background, keeping page transitions extremely snappy.
// - Reload Bypass: Detects cache-control/pragma 'no-cache' and fetches directly from Notion.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unstable_cache<T extends (...args: any[]) => Promise<any>>(
  cb: T,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] },
): T {
  const revalVal =
    process.env.NODE_ENV !== "production" ? 1 : (options?.revalidate ?? false);

  const cachedFn = next_unstable_cache(cb, keyParts, {
    ...options,
    revalidate: revalVal,
  });

  return (async (...args: any[]) => {
    try {
      const reqHeaders = await headers();
      const cacheControl = reqHeaders.get("cache-control");
      const pragma = reqHeaders.get("pragma");
      if (cacheControl === "no-cache" || pragma === "no-cache") {
        return cb(...args);
      }
    } catch {
      // Safely ignore during prerendering/static compilation
    }
    return cachedFn(...args);
  }) as unknown as T;
}

type NotionPropertySchema = { type?: string };
type NotionDataSourceClient = {
  dataSources: {
    query: (args: {
      data_source_id: string;
      start_cursor?: string;
    }) => Promise<{
      results: NotionPage[];
      has_more?: boolean;
      next_cursor?: string | null;
    }>;
    retrieve: (args: {
      data_source_id: string;
    }) => Promise<{ properties?: Record<string, NotionPropertySchema> }>;
  };
};

export type FAQEntry = {
  id: string;
  question: string;
  askerName: string;
  source: "Hima" | "Publik";
  status: "Masuk" | "Ditinjau" | "Dijawab" | "Dialihkan" | "Disembunyikan";
  answer: string;
  refUrl: string;
  categories: string[];
  visibility: "Tampil" | "Disembunyikan";
  createdAt: string;
  lastEditedAt: string;
};

/**
 * Queries the FAQ & Tanya Jawab Notion Database and returns a parsed list of entries.
 */
async function fetchFAQEntriesRaw(): Promise<FAQEntry[]> {
  const pageId = await resolveFAQPageIdCached();
  if (!pageId) {
    console.error(
      "[Notion FAQ] Could not resolve FAQ page ID from Master Page database.",
    );
    return [];
  }

  const databaseId = await resolveFAQDatabaseCached(pageId);

  const notion = getNotionClient();
  if (!notion) {
    console.error("[Notion FAQ] Notion client could not be initialized.");
    return [];
  }

  try {
    const dataSourceId = await resolveDataSourceIdSafe(databaseId);
    if (!dataSourceId) {
      console.error(
        "[Notion FAQ] Could not resolve FAQ database to data source.",
      );
      return [];
    }

    const response = await (
      notion as unknown as NotionDataSourceClient
    ).dataSources.query({
      data_source_id: dataSourceId,
    });

    const parsedEntries = (response.results as NotionPage[]).map((page) => {
      const props = page.properties;

      // 1. Pertanyaan (Title) - Judul Pertanyaan or Pertanyaan
      const titleObj = props["Judul Pertanyaan"] ?? props.Pertanyaan;
      const question =
        titleObj?.type === "title"
          ? titleObj.title
              .map((t: { plain_text: string }) => t.plain_text)
              .join("")
          : "";

      // 2. Nama Penanya (Rich Text)
      const askerObj = props["Nama Penanya"];
      const askerName =
        askerObj?.type === "rich_text"
          ? askerObj.rich_text
              .map((t: { plain_text: string }) => t.plain_text)
              .join("")
          : "";

      // 3. Sumber (Select)
      const sourceObj = props.Sumber;
      const source = (
        sourceObj?.type === "select" ? sourceObj.select?.name : "Publik"
      ) as FAQEntry["source"];

      // 4. Status (Status)
      const statusObj = props.Status;
      const status = (
        statusObj?.type === "status" ? statusObj.status?.name : "Masuk"
      ) as FAQEntry["status"];

      // 5. Jawaban (Rich Text)
      const answerObj = props.Jawaban;
      const answer =
        answerObj?.type === "rich_text"
          ? answerObj.rich_text
              .map((t: { plain_text: string }) => t.plain_text)
              .join("")
          : "";

      // 6. URL Referensi (URL)
      const urlObj = props["URL Referensi"];
      const refUrl = urlObj?.type === "url" && urlObj.url ? urlObj.url : "";

      // 7. Kategori (Select or Multi-select)
      const categoryObj = props.Kategori;
      let categories: string[] = [];
      if (categoryObj?.type === "multi_select") {
        categories = categoryObj.multi_select.map(
          (s: { name: string }) => s.name,
        );
      } else if (categoryObj?.type === "select" && categoryObj.select) {
        categories = [categoryObj.select.name];
      }

      // 8. Visibilitas (Checkbox or Select)
      const visibilityObj = props.Visibilitas;
      let visibilityVal = true;
      if (visibilityObj?.type === "checkbox") {
        visibilityVal = visibilityObj.checkbox;
      } else if (visibilityObj?.type === "select") {
        visibilityVal = visibilityObj.select?.name === "Tampil";
      }
      const visibility: FAQEntry["visibility"] = visibilityVal
        ? "Tampil"
        : "Disembunyikan";

      return {
        id: page.id,
        question: question.trim(),
        askerName: askerName.trim() || "Anonim",
        source,
        status,
        answer: answer.trim(),
        refUrl: refUrl.trim(),
        categories: categories.length > 0 ? categories : ["Lainnya"],
        visibility,
        createdAt: page.created_time,
        lastEditedAt: page.last_edited_time,
      };
    });

    // Newest submissions first
    return parsedEntries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch (error) {
    console.error("[Notion FAQ] Database query failed:", error);
    return [];
  }
}

export const fetchFAQEntries = unstable_cache(
  async () => {
    return fetchFAQEntriesRaw();
  },
  ["notion-faq-entries"],
  { revalidate: 60, tags: ["notion-faq"] },
);

/**
 * Queries Kategori property options dynamically from the Notion database.
 */
export async function fetchFAQCategories(): Promise<string[]> {
  const pageId = await resolveFAQPageIdCached();
  if (!pageId)
    return [
      "Lainnya",
      "Akademik",
      "Organisasi (HIMA)",
      "Kegiatan / Event",
      "Pendaftaran",
    ];

  const databaseId = await resolveFAQDatabaseCached(pageId);
  const notion = getNotionClient();
  if (!notion)
    return [
      "Lainnya",
      "Akademik",
      "Organisasi (HIMA)",
      "Kegiatan / Event",
      "Pendaftaran",
    ];

  try {
    const dataSourceId = await resolveDataSourceIdSafe(databaseId);
    if (!dataSourceId)
      return [
        "Lainnya",
        "Akademik",
        "Organisasi (HIMA)",
        "Kegiatan / Event",
        "Pendaftaran",
      ];

    const ds = await (
      notion as unknown as NotionDataSourceClient
    ).dataSources.retrieve({
      data_source_id: dataSourceId,
    });

    if (ds && "properties" in ds) {
      const dbProperties = ds.properties as Record<
        string,
        NotionPropertySchema
      >;
      const kategoriProp = dbProperties["Kategori"];
      if (
        kategoriProp &&
        (kategoriProp.type === "select" || kategoriProp.type === "multi_select")
      ) {
        const selectObj =
          (kategoriProp as any).select || (kategoriProp as any).multi_select;
        if (selectObj && Array.isArray(selectObj.options)) {
          return selectObj.options.map((opt: { name: string }) => opt.name);
        }
      }
    }
  } catch (error) {
    console.error("[Notion FAQ] Failed to fetch dynamic categories:", error);
  }

  return [
    "Lainnya",
    "Akademik",
    "Organisasi (HIMA)",
    "Kegiatan / Event",
    "Pendaftaran",
  ];
}

export const fetchFAQCategoriesCached = unstable_cache(
  async () => {
    return fetchFAQCategories();
  },
  ["notion-faq-categories"],
  { revalidate: 60, tags: ["notion-faq"] },
);

/**
 * Validates and writes a new public-submitted FAQ entry to the Notion database.
 */
export async function createFAQEntry(
  question: string,
  askerName: string,
  category: string,
): Promise<unknown> {
  const pageId = await resolveFAQPageIdCached();
  if (!pageId) {
    throw new Error("Could not resolve FAQ page ID from Master Page database.");
  }

  const databaseId = await resolveFAQDatabaseCached(pageId);

  const notion = getNotionClient();
  if (!notion) {
    throw new Error("Notion client could not be initialized.");
  }

  const cleanCategory = category?.trim() || "Lainnya";

  // Retrieve database properties dynamically via its Data Source
  let dbProperties: Record<string, NotionPropertySchema> = {};
  try {
    const dataSourceId = await resolveDataSourceIdSafe(databaseId);
    if (dataSourceId) {
      const ds = await (
        notion as unknown as NotionDataSourceClient
      ).dataSources.retrieve({
        data_source_id: dataSourceId,
      });
      if (ds && "properties" in ds) {
        dbProperties = ds.properties as Record<string, NotionPropertySchema>;
      }
    }
  } catch (err) {
    console.warn(
      "[Notion FAQ] Could not retrieve database schema via data source, writing with default properties:",
      err,
    );
  }

  const properties: Record<string, unknown> = {};

  // Title: "Judul Pertanyaan" or fallback to "Pertanyaan"
  if ("Judul Pertanyaan" in dbProperties) {
    properties["Judul Pertanyaan"] = {
      title: [{ text: { content: question.trim() } }],
    };
  } else {
    properties.Pertanyaan = {
      title: [{ text: { content: question.trim() } }],
    };
  }

  // Rich Text: "Nama Penanya"
  if ("Nama Penanya" in dbProperties) {
    properties["Nama Penanya"] = {
      rich_text: [{ text: { content: askerName.trim() || "Anonim" } }],
    };
  }

  // Select: "Sumber"
  if ("Sumber" in dbProperties) {
    properties.Sumber = {
      select: { name: "Publik" },
    };
  }

  // Status: "Status"
  if ("Status" in dbProperties) {
    properties.Status = {
      status: { name: "Masuk" },
    };
  }

  // Multi-select: "Kategori" (Optional)
  if ("Kategori" in dbProperties) {
    properties.Kategori = {
      multi_select: [{ name: cleanCategory }],
    };
  }

  // Checkbox or Select: "Visibilitas"
  if ("Visibilitas" in dbProperties) {
    const type = dbProperties.Visibilitas?.type;
    if (type === "checkbox") {
      properties.Visibilitas = {
        checkbox: true,
      };
    } else {
      properties.Visibilitas = {
        select: { name: "Tampil" },
      };
    }
  }

  return await notion.pages.create({
    parent: { database_id: databaseId },
    properties: properties as never,
  });
}

/**
 * Filter FAQ entries according to the visibility rules:
 * - Visibilitas: Disembunyikan -> ❌ Tidak
 * - Status: Disembunyikan -> ❌ Tidak (kecuali jika ada override Visibilitas Tampil)
 * - Tampilkan semua entri dengan status Masuk, Ditinjau, Dijawab, atau Dialihkan
 */
export function filterFAQVisibility(entries: FAQEntry[]): FAQEntry[] {
  return entries.filter((entry) => {
    // 1. Override manual Visibilitas: Disembunyikan -> ❌ Tidak
    if (entry.visibility === "Disembunyikan") return false;

    // New Minecraft Galactic Exception:
    // If status is Disembunyikan but visibility is Tampil (on), we keep it!
    if (entry.status === "Disembunyikan" && entry.visibility === "Tampil") {
      return true;
    }

    // 2. Tipe Status: Disembunyikan -> ❌ Tidak
    if (entry.status === "Disembunyikan") return false;

    // 3. Keep all standard entries (Masuk, Ditinjau, Dijawab, Dialihkan)
    return ["Masuk", "Ditinjau", "Dijawab", "Dialihkan"].includes(entry.status);
  });
}
