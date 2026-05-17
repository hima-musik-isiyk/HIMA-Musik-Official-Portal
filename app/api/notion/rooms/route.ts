import { NextResponse } from "next/server";

import { normalizePageId } from "@/lib/notion-room/server";
import { supabaseRestFetch } from "@/lib/notion-room/supabase-server";
import { extractNotionPageId, type NotionRoom } from "@/lib/notion-room/types";

const pageIdPattern =
  /^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type SupabaseRoom = {
  id: string;
  name: string;
  actual_title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

function toRoom(row: SupabaseRoom): NotionRoom {
  return {
    id: row.id,
    name: row.name,
    actualTitle: row.actual_title ?? "",
    description: row.description ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const response = await supabaseRestFetch(
      "/rest/v1/notion_rooms?select=id,name,actual_title,description,created_at,updated_at&order=updated_at.desc",
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to load rooms", details: data },
        { status: 502 },
      );
    }

    return NextResponse.json({ rooms: data.map(toRoom) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load rooms",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; name?: string };
    const rawId = extractNotionPageId(body.id ?? "");

    if (!pageIdPattern.test(rawId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const id = normalizePageId(rawId);
    let name = body.name?.trim() || `Room ${id.slice(0, 6)}`;
    let actualTitle = "";

    try {
      const { getRoomNotionClient } = await import("@/lib/notion-room/server");
      const notion = getRoomNotionClient();
      const page = await notion.pages.retrieve({ page_id: id });
      if ("properties" in page) {
        // Look for title property
        for (const prop of Object.values(page.properties)) {
          if (prop.type === "title") {
            actualTitle = prop.title.map((t) => t.plain_text).join("");
            break;
          }
        }
      }
      if (!body.name?.trim() && actualTitle) {
        name = actualTitle;
      }
    } catch (e) {
      console.error("Failed to fetch Notion title:", e);
    }

    const now = new Date().toISOString();

    const response = await supabaseRestFetch(
      "/rest/v1/notion_rooms?on_conflict=id",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          id,
          name,
          actual_title: actualTitle,
          updated_at: now,
        }),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to save room", details: data },
        { status: 502 },
      );
    }

    return NextResponse.json({ room: toRoom(data[0]) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save room" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id: string;
      name?: string;
      id_override?: string;
    };
    if (!body.id)
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) updates.name = body.name;

    // If changing the Notion ID itself
    if (body.id_override) {
      const rawId = extractNotionPageId(body.id_override);
      if (pageIdPattern.test(rawId)) {
        const nextId = normalizePageId(rawId);
        updates.id = nextId;

        try {
          const { getRoomNotionClient } =
            await import("@/lib/notion-room/server");
          const notion = getRoomNotionClient();
          const page = await notion.pages.retrieve({ page_id: nextId });
          if ("properties" in page) {
            for (const prop of Object.values(page.properties)) {
              if (prop.type === "title") {
                const actualTitle = prop.title
                  .map((t) => t.plain_text)
                  .join("");
                updates.actual_title = actualTitle;
                if (!body.name?.trim()) {
                  updates.name = actualTitle;
                }
                break;
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch Notion title on ID change:", e);
        }
      }
    }

    const response = await supabaseRestFetch(
      `/rest/v1/notion_rooms?id=eq.${body.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Update failed", details: data },
        { status: 502 },
      );
    }

    return NextResponse.json({ room: toRoom(data[0]) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const response = await supabaseRestFetch(
      `/rest/v1/notion_rooms?id=eq.${id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: "Delete failed", details: data },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
