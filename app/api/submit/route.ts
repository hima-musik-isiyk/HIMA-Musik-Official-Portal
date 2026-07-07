import { NextResponse } from "next/server";

import { cleanCmsValue } from "@/lib/cms-placeholders";
import { logErrorToDiscord, sendDiscordWebhook } from "@/lib/discord";
import {
  fetchAduanDatabaseIdCached,
  getNotionClient,
  resolveDatabaseId,
} from "@/lib/notion";

const DISCORD_FIELD_LIMIT = 1024;

const truncate = (value: string, maxLength = DISCORD_FIELD_LIMIT) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

export async function POST(request: Request) {
  try {
    const body = await request
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    const {
      intent,
      name,
      nim,
      contact,
      category,
      categoryName,
      message,
      storageDbId,
    } = body as Record<string, unknown>;

    if (intent !== "submit-aduan") {
      return NextResponse.json(
        { error: "Invalid submit intent" },
        { status: 400 },
      );
    }

    if (!contact || typeof contact !== "string" || !contact.trim()) {
      return NextResponse.json(
        { error: "Kontak Pengadu wajib diisi" },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.DISCORD_ADUAN_WEBHOOK_URL;
    const aduanPageId = "02 Storage: Aduan";

    if (!webhookUrl || (!aduanPageId && !storageDbId)) {
      console.error(
        "Missing environment variables: DISCORD_ADUAN_WEBHOOK_URL or aduanPageId/storageDbId",
      );
      return NextResponse.json(
        { error: "Server misconfiguration: Missing env variables" },
        { status: 500 },
      );
    }

    const notion = getNotionClient();
    if (!notion) {
      return NextResponse.json(
        { error: "Notion client not initialized" },
        { status: 500 },
      );
    }

    const safeStorageDbId =
      typeof storageDbId === "string"
        ? cleanCmsValue(storageDbId, ["Database ID Storage"])
        : "";

    const activeDbId = safeStorageDbId
      ? safeStorageDbId
      : await fetchAduanDatabaseIdCached(aduanPageId || "");

    if (!activeDbId) {
      console.error(
        "Failed to resolve Aduan Database ID from parent page:",
        aduanPageId,
      );
      return NextResponse.json(
        {
          error: "Failed to archive to Notion",
          details: "Could not resolve child database from Aduan Page",
        },
        { status: 500 },
      );
    }

    const resolvedDbId = await resolveDatabaseId(activeDbId);

    // Resolve active parent object (data_source_id vs database_id) for compatibility with Notion API v2026-03-11
    let parentObj: Parameters<typeof notion.pages.create>[0]["parent"] = {
      database_id: resolvedDbId,
    };
    let isDbPropRelation = false;
    let isDbPropSelect = false;
    try {
      const dbInfo = (await notion.databases.retrieve({
        database_id: resolvedDbId,
      })) as {
        data_sources?: { id: string }[];
        properties?: Record<string, { type: string }>;
      };
      const dataSourceId = dbInfo.data_sources?.[0]?.id;
      if (dataSourceId) {
        parentObj = { data_source_id: dataSourceId };
      }
      const catProp =
        dbInfo.properties?.["Kategori"] || dbInfo.properties?.["kategori"];
      if (catProp) {
        isDbPropRelation = catProp.type === "relation";
        isDbPropSelect = catProp.type === "select";
      }
    } catch (e) {
      console.warn(
        "[Notion resolveDataSource] Could not retrieve data source, falling back to database parent:",
        e,
      );
    }

    const safeName = typeof name === "string" && name.trim() ? name : "Anonim";
    const safeNim = typeof nim === "string" && nim.trim() ? nim : "-";
    const safeContact =
      typeof contact === "string" && contact.trim() ? contact : "-";
    const safeCategory =
      typeof category === "string" && category.trim() ? category : "";
    const safeCategoryName =
      typeof categoryName === "string" && categoryName.trim()
        ? categoryName
        : "Umum";
    const safeMessage = message.trim();

    const payload = {
      username: "HIMA Musik Aduan",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: "Aduan Baru Masuk",
          description: truncate(safeMessage, 4096),
          color: 0xd4a64d,
          timestamp: new Date().toISOString(),
          fields: [
            { name: "Nama", value: truncate(safeName), inline: true },
            { name: "NIM", value: truncate(safeNim), inline: true },
            { name: "Kontak", value: truncate(safeContact), inline: true },
            {
              name: "Kategori",
              value: truncate(safeCategoryName),
              inline: true,
            },
          ],
          footer: { text: "HIMA Musik Official Portal" },
        },
      ],
    };

    try {
      await sendDiscordWebhook(
        webhookUrl,
        payload,
        "Aduan notification to Discord",
      );
    } catch (discordError) {
      console.error("Discord API Error:", discordError);
      return NextResponse.json(
        {
          error: "Failed to send to Discord",
          details:
            discordError instanceof Error
              ? discordError.message
              : "Unknown Discord error",
        },
        { status: 500 },
      );
    }

    const isRelation =
      typeof safeCategory === "string" &&
      (safeCategory.length === 36 || safeCategory.length === 32);

    const pageProps: Record<string, unknown> = {
      Nama: {
        title: [{ text: { content: safeName } }],
      },
      NIM: {
        rich_text: [{ text: { content: safeNim } }],
      },
      "Kontak Pengadu": {
        rich_text: [{ text: { content: safeContact } }],
      },
      Pesan: {
        rich_text: [{ text: { content: safeMessage } }],
      },
      Status: {
        status: { name: "Masuk" },
      },
    };

    if (isDbPropRelation && isRelation) {
      pageProps.Kategori = { relation: [{ id: safeCategory }] };
    } else if (!isDbPropRelation && isDbPropSelect) {
      pageProps.Kategori = { select: { name: safeCategoryName } };
    } else if (!isDbPropRelation && !isRelation) {
      pageProps.Kategori = {
        rich_text: [{ text: { content: safeCategory || "Umum" } }],
      };
    }

    try {
      console.warn(
        "[Notion Submit] Creating page with parent:",
        parentObj,
        "Props:",
        JSON.stringify(pageProps),
      );
      await notion.pages.create({
        parent: parentObj,
        properties: pageProps as Parameters<
          typeof notion.pages.create
        >[0]["properties"],
      });
    } catch (notionError: unknown) {
      const errorMsg =
        typeof notionError === "object" &&
        notionError !== null &&
        "body" in notionError
          ? (notionError as { body: unknown }).body
          : notionError;
      console.error("Notion API Error for Aduan:", errorMsg);
      return NextResponse.json(
        {
          error: "Failed to archive to Notion",
          details:
            notionError instanceof Error
              ? notionError.message
              : "Unknown Notion error",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal Server Error:", error);
    await logErrorToDiscord(error, "Aduan Form Submit API");
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
