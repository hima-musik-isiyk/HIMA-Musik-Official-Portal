import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "notion-images");
const MAX_FILE_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function hashKey(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

function safeContentType(input: string | null): string {
  if (!input) return "application/octet-stream";
  if (input.includes("\n") || input.includes("\r")) {
    return "application/octet-stream";
  }
  return input;
}

function buildCachePaths(cacheKey: string) {
  const hashed = hashKey(cacheKey);
  return {
    dataPath: path.join(CACHE_DIR, `${hashed}.bin`),
    metaPath: path.join(CACHE_DIR, `${hashed}.json`),
  };
}

async function readFreshCache(cacheKey: string): Promise<{
  body: Buffer;
  contentType: string;
} | null> {
  const { dataPath, metaPath } = buildCachePaths(cacheKey);

  try {
    const [dataBuffer, metaRaw] = await Promise.all([
      fs.readFile(dataPath),
      fs.readFile(metaPath, "utf8"),
    ]);

    const meta = JSON.parse(metaRaw) as {
      savedAt: number;
      contentType: string;
    };

    if (Date.now() - meta.savedAt > MAX_FILE_AGE_MS) {
      return null;
    }

    return {
      body: dataBuffer,
      contentType: safeContentType(meta.contentType),
    };
  } catch {
    return null;
  }
}

async function writeCache(
  cacheKey: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const { dataPath, metaPath } = buildCachePaths(cacheKey);

  await fs.mkdir(CACHE_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(dataPath, body),
    fs.writeFile(
      metaPath,
      JSON.stringify({
        savedAt: Date.now(),
        contentType,
      }),
    ),
  ]);
}

function makeImageResponse(body: Buffer, contentType: string): NextResponse {
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Browser cache for repeated page visits.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

function makeRedirectResponse(sourceUrl: URL): NextResponse {
  // Use Next.js redirect signature: (url, status). Then set headers.
  const response = NextResponse.redirect(sourceUrl, 307);
  // Keep redirects short-lived because Notion signed URLs rotate.
  response.headers.set(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=300",
  );
  return response;
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  const cacheKeyParam = request.nextUrl.searchParams.get("key");

  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(sourceUrl.protocol)) {
    return NextResponse.json(
      { error: "Unsupported protocol" },
      { status: 400 },
    );
  }

  const cacheKey =
    cacheKeyParam ||
    `${sourceUrl.protocol}//${sourceUrl.host}${sourceUrl.pathname}`;

  // On Vercel, proxying binary responses can hit function payload/storage limits.
  // Redirecting keeps the client request direct to Notion's signed asset URL.
  if (process.env.VERCEL) {
    return makeRedirectResponse(sourceUrl);
  }

  const cached = await readFreshCache(cacheKey);
  if (cached) {
    return makeImageResponse(cached.body, cached.contentType);
  }

  let upstream: Response;
  try {
    upstream = await fetch(sourceUrl.toString(), {
      headers: {
        "User-Agent": "HIMA-Portal-Image-Cache/1.0",
      },
      cache: "no-store",
    });
  } catch {
    return makeRedirectResponse(sourceUrl);
  }

  if (!upstream.ok) {
    return makeRedirectResponse(sourceUrl);
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  const contentType = safeContentType(
    upstream.headers.get("content-type") || "application/octet-stream",
  );

  // Best-effort cache persistence.
  writeCache(cacheKey, body, contentType).catch(() => {});

  return makeImageResponse(body, contentType);
}
