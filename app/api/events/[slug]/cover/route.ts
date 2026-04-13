import { NextRequest, NextResponse } from "next/server";

import { fetchAllEventEntries } from "@/lib/notion";

export const runtime = "nodejs";

function safeContentType(input: string | null): string {
  if (!input) return "application/octet-stream";
  if (input.includes("\n") || input.includes("\r")) {
    return "application/octet-stream";
  }
  return input;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const entries = await fetchAllEventEntries();
  const entry = entries.find((item) => item.slug === slug);
  const source = entry?.coverImageUrl;

  if (!source) {
    return NextResponse.json({ error: "Cover not found" }, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(source, {
      headers: {
        "User-Agent": "HIMA-Portal-Event-Cover/1.0",
      },
      cache: "no-store",
    });
  } catch {
    return new NextResponse(null, {
      status: 502,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  if (!upstream.ok) {
    return new NextResponse(null, {
      status: upstream.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": safeContentType(
        upstream.headers.get("content-type") || "application/octet-stream",
      ),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
