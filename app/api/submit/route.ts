import { NextResponse } from "next/server";

import { sendDiscordWebhook } from "@/lib/discord";
import { fetchAduanDatabaseIdCached, getNotionClient } from "@/lib/notion";

const DISCORD_FIELD_LIMIT = 1024;

const truncate = (value: string, maxLength = DISCORD_FIELD_LIMIT) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

export async function POST(request: Request) {
  try {
    const body = await request
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    const { intent, name, nim, category, message } = body as Record<
      string,
      unknown
    >;

    if (intent !== "submit-aduan") {
      return NextResponse.json(
        { error: "Invalid submit intent" },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.DISCORD_ADUAN_WEBHOOK_URL;
    const aduanPageId = process.env.NOTION_ADUAN_PAGE_ID;

    if (!webhookUrl || !aduanPageId) {
      console.error(
        "Missing environment variables: DISCORD_ADUAN_WEBHOOK_URL or NOTION_ADUAN_PAGE_ID",
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

    const activeDbId = await fetchAduanDatabaseIdCached(aduanPageId);
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

    // Resolve active parent object (data_source_id vs database_id) for compatibility with Notion API v2025-09-03
    let parentObj: any = { database_id: activeDbId };
    try {
      const dbInfo = await notion.databases.retrieve({
        database_id: activeDbId,
      });
      const dataSourceId = (dbInfo as any).data_sources?.[0]?.id;
      if (dataSourceId) {
        parentObj = { data_source_id: dataSourceId };
      }
    } catch (e) {
      console.warn(
        "[Notion resolveDataSource] Could not retrieve data source, falling back to database parent:",
        e,
      );
    }

    const safeName = typeof name === "string" && name.trim() ? name : "Anonim";
    const safeNim = typeof nim === "string" && nim.trim() ? nim : "-";
    const safeCategory =
      typeof category === "string" && category.trim() ? category : "Umum";
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
            { name: "Kategori", value: truncate(safeCategory), inline: true },
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

    try {
      await notion.pages.create({
        parent: parentObj,
        properties: {
          Nama: {
            title: [{ text: { content: safeName } }],
          } as any,
          NIM: {
            rich_text: [{ text: { content: safeNim } }],
          } as any,
          Kategori: {
            rich_text: [{ text: { content: safeCategory } }],
          } as any,
          Pesan: {
            rich_text: [{ text: { content: safeMessage } }],
          } as any,
          Status: {
            status: { name: "Masuk" },
          } as any,
        },
      });
    } catch (notionError) {
      console.error("Notion API Error for Aduan:", notionError);
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
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
