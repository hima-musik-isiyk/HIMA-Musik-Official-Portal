export function normalizeImageCacheKey(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    // Notion/S3 signed URLs rotate query params frequently.
    // Keep cache key stable by dropping query and hash.
    url.search = "";
    url.hash = "";

    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return rawUrl;
  }
}

export function toCachedImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return "";

  const key = normalizeImageCacheKey(rawUrl);
  const encodedSrc = encodeURIComponent(rawUrl);
  const encodedKey = encodeURIComponent(key);

  return `/api/notion-image?src=${encodedSrc}&key=${encodedKey}`;
}
