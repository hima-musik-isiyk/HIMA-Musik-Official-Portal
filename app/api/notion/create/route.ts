import { NextResponse } from "next/server";

import { createRoomPage } from "@/lib/notion-room/server";
import {
  NOTION_ROOM_PAGE_TYPES,
  type NotionRoomPageType,
} from "@/lib/notion-room/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      roomId?: string;
      pageType?: NotionRoomPageType;
      referenceIds?: string[];
    };

    if (!body.roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    }

    if (!body.pageType || !NOTION_ROOM_PAGE_TYPES.includes(body.pageType)) {
      return NextResponse.json({ error: "invalid pageType" }, { status: 400 });
    }

    const page = await createRoomPage({
      roomId: body.roomId,
      pageType: body.pageType,
      referenceIds: body.referenceIds ?? [],
    });

    return NextResponse.json({ page });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create page",
      },
      { status: 400 },
    );
  }
}
