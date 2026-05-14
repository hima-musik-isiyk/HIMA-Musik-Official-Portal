import { NextResponse } from "next/server";

import { listRoomPages } from "@/lib/notion-room/server";

export async function GET(request: Request) {
  try {
    const roomId = new URL(request.url).searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    }

    const pages = await listRoomPages(roomId);
    return NextResponse.json({ pages });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load pages",
      },
      { status: 400 },
    );
  }
}
