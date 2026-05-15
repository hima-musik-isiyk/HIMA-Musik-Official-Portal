import { NextResponse } from "next/server";

import { normalizePageId } from "@/lib/notion-room/server";
import { supabaseRestFetch } from "@/lib/notion-room/supabase-server";
import { extractNotionPageId, type NotionRoom } from "@/lib/notion-room/types";

const pageIdPattern =
  /^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type SupabaseRoom = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

function toRoom(row: SupabaseRoom): NotionRoom {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const response = await supabaseRestFetch(
      "/rest/v1/notion_rooms?select=id,name,created_at,updated_at&order=updated_at.desc",
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
    const name = body.name?.trim() || `Room ${id.slice(0, 6)}`;
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
