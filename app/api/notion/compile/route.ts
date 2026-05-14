import { NextResponse } from "next/server";

import { compilePages } from "@/lib/notion-room/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pageIds?: string[] };
    if (!Array.isArray(body.pageIds) || body.pageIds.length === 0) {
      return NextResponse.json({ error: "pageIds required" }, { status: 400 });
    }

    const content = await compilePages(body.pageIds);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to compile" },
      { status: 400 },
    );
  }
}
