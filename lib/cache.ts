import {
  unstable_cache as next_cache,
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

/**
 * Wrapper around Next.js native unstable_cache.
 * @param cb The async function to cache.
 * @param keyParts Parts used to build a unique cache key.
 * @param options Optional revalidation and tag settings.
 */
export function unstable_cache<
  T extends (...args: unknown[]) => Promise<unknown>,
>(
  cb: T,
  keyParts: string[],
  options?: { revalidate?: number | false; tags?: string[] },
): T {
  let revalidate = options?.revalidate;
  if (process.env.NODE_ENV !== "production" && revalidate !== false) {
    // Keep dev data fresh enough without turning render-path fetches into uncached blocking work.
    revalidate = typeof revalidate === "number" ? Math.min(revalidate, 1) : 1;
  }

  // Use the native next/cache unstable_cache to avoid the closure compiler bug
  // Do NOT read headers() here because it forces dynamic rendering and triggers Route blocking errors.
  return next_cache(cb, keyParts, {
    revalidate,
    tags: options?.tags,
  }) as T;
}

export function setupCache(tags: string[], revalidate: number) {
  if (process.env.NODE_ENV !== "production") {
    cacheLife({ stale: 1, revalidate: 1, expire: 1 });
  } else {
    cacheLife({
      stale: revalidate,
      revalidate: revalidate,
      expire: revalidate * 2,
    });
  }
  for (const tag of tags) {
    cacheTag(tag);
  }
}
