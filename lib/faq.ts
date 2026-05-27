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
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const parsedEntries = (response.results as NotionPage[]).map((page) => {
      const props = page.properties;

      // 1. Pertanyaan (Title)
      const titleObj = props.Pertanyaan;
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

      // 8. Visibilitas (Select)
      const visibilityObj = props.Visibilitas;
      const visibility = (
        visibilityObj?.type === "select" ? visibilityObj.select?.name : "Tampil"
      ) as FAQEntry["visibility"];

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

  return await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Pertanyaan: {
        title: [{ text: { content: question.trim() } }],
      },
      "Nama Penanya": {
        rich_text: [{ text: { content: askerName.trim() || "Anonim" } }],
      },
      Sumber: {
        select: { name: "Publik" },
      },
      Status: {
        status: { name: "Masuk" },
      },
      Kategori: {
        multi_select: [{ name: cleanCategory }],
      },
      Visibilitas: {
        select: { name: "Tampil" },
      },
    },
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

    // 3. Sumber Publik rules
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

    // 4. Sumber HIMA rules
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
