import { NextRequest, NextResponse } from "next/server";

import {
  buildAnchorMap,
  fetchDocBySlug,
  fetchEventBySlug,
  fetchKKMEntryBySlug,
  type NotionContentScope,
} from "@/lib/notion";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");
  const anchor = searchParams.get("anchor");
  const scope = (searchParams.get("scope") ??
    "sekretariat") as NotionContentScope;

  if (!slug || !anchor) {
    return NextResponse.json(
      { error: "Missing slug or anchor parameter" },
      { status: 400 },
    );
  }

  try {
    const doc =
      scope === "kkm"
        ? await fetchKKMEntryBySlug(slug)
        : scope === "events"
          ? await fetchEventBySlug(slug)
          : await fetchDocBySlug(slug);
    if (!doc) {
      return NextResponse.json(
        { error: `Document "${slug}" not found` },
        { status: 404 },
      );
    }

    const anchorMap = buildAnchorMap(doc.blocks);
    const blocks = anchorMap.get(anchor);

    if (!blocks || blocks.length === 0) {
      return NextResponse.json(
        { error: `Anchor "${anchor}" not found in "${slug}"` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      blocks,
      sourceSlug: doc.meta.slug,
      sourceTitle: doc.meta.title,
    });
  } catch (err) {
    console.error("Citation resolution error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
