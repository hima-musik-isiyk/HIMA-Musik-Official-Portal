import { getNotionClient, NotionPage } from "./notion";

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
export async function fetchFAQEntries(): Promise<FAQEntry[]> {
  const databaseId = process.env.NOTION_FAQ_DATABASE_ID;
  if (!databaseId) {
    console.error(
      "[Notion FAQ] Missing NOTION_FAQ_DATABASE_ID environment variable.",
    );
    return [];
  }

  const notion = getNotionClient();
  if (!notion) {
    console.error("[Notion FAQ] Notion client could not be initialized.");
    return [];
  }

  try {
    const response = await (notion as any).databases.query({
      database_id: databaseId,
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

      // 7. Kategori (Multi-select)
      const categoryObj = props.Kategori;
      const categories =
        categoryObj?.type === "multi_select"
          ? categoryObj.multi_select.map((s: { name: string }) => s.name)
          : [];

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

/**
 * Validates and writes a new public-submitted FAQ entry to the Notion database.
 */
export async function createFAQEntry(
  question: string,
  askerName: string,
  category: string,
): Promise<unknown> {
  const databaseId = process.env.NOTION_FAQ_DATABASE_ID;
  if (!databaseId) {
    throw new Error("Missing NOTION_FAQ_DATABASE_ID environment variable.");
  }

  const notion = getNotionClient();
  if (!notion) {
    throw new Error("Notion client could not be initialized.");
  }

  const cleanCategory = [
    "Pendaftaran",
    "Kegiatan",
    "Organisasi",
    "Akademik",
    "Lainnya",
  ].includes(category)
    ? category
    : "Lainnya";

  // Retrieve database to inspect available properties dynamically
  let dbProperties: Record<string, unknown> = {};
  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    if (db && "properties" in db) {
      dbProperties = db.properties as Record<string, unknown>;
    }
  } catch (err) {
    console.warn(
      "[Notion FAQ] Could not retrieve database schema, writing with default properties:",
      err,
    );
  }

  const properties: Record<string, any> = {};

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
    const type = (dbProperties.Visibilitas as any)?.type;
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
    properties,
  });
}

/**
 * Filter FAQ entries according to the visibility rules:
 * - Sumber: Publik, Status: Masuk/Ditinjau -> ✅ Ya -> Pertanyaan + label "Menunggu Jawaban"
 * - Sumber: Publik, Status: Dijawab -> ✅ Ya -> Pertanyaan + Jawaban
 * - Sumber: Publik, Status: Dialihkan -> ✅ Ya -> Pertanyaan + tombol link ke URL Referensi
 * - Sumber: Hima, Status: Dijawab -> ✅ Ya -> Tampil sebagai FAQ resmi (Q+A lengkap)
 * - Sumber: Hima, Status: Dialihkan -> ✅ Ya -> Pertanyaan + tombol link ke URL Referensi
 * - Visibilitas: Disembunyikan -> ❌ Tidak
 */
export function filterFAQVisibility(entries: FAQEntry[]): FAQEntry[] {
  return entries.filter((entry) => {
    // 1. Override manual Visibilitas: Disembunyikan -> ❌ Tidak
    if (entry.visibility === "Disembunyikan") return false;

    // 2. Tipe Status: Disembunyikan -> ❌ Tidak
    if (entry.status === "Disembunyikan") return false;

    // 3. Sumber Publik rules (allows displaying unanswered submissions in "Tanya Jawab Publik" queue)
    if (entry.source === "Publik") {
      if (entry.status === "Masuk" || entry.status === "Ditinjau") {
        return true;
      }
      if (entry.status === "Dijawab") {
        return true;
      }
      if (entry.status === "Dialihkan") {
        return true;
      }
    }

    // 4. Sumber HIMA rules (requires answered or redirected)
    if (entry.source === "Hima") {
      if (entry.status === "Dijawab") {
        return true;
      }
      if (entry.status === "Dialihkan") {
        return true;
      }
    }

    // Anything else -> ❌ Tidak
    return false;
  });
}
