import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import { headers } from "next/headers";

// Central registry for cached callbacks
const registry = new Map<string, (...args: unknown[]) => Promise<unknown>>();

/**
 * Wrapper around Next.js 16 caching utilities.
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
  const key = keyParts.join(":");
  // Store the original callback for later execution.
  registry.set(key, cb);

  const cachedFn = async (cacheKey: string, serializedArgs: string) => {
    "use cache";
    const reval = options?.revalidate ?? false;
    if (process.env.NODE_ENV !== "production") {
      // Fast revalidation during development.
      cacheLife({ stale: 1, revalidate: 1, expire: 1 });
    } else {
      if (reval === false) {
        cacheLife("max");
      } else if (typeof reval === "number") {
        cacheLife({ stale: 300, revalidate: reval, expire: reval * 2 });
      } else {
        cacheLife("default");
      }
    }
    if (options?.tags) {
      for (const tag of options.tags) {
        cacheTag(tag);
      }
    }
    const fn = registry.get(cacheKey);
    if (!fn) throw new Error("Callback not found in registry: " + cacheKey);
    const args = JSON.parse(serializedArgs) as unknown[];

    return fn(...args);
  };

  return (async (...args: unknown[]) => {
    try {
      const reqHeaders = await headers();
      const cacheControl = reqHeaders?.get("cache-control");
      const pragma = reqHeaders?.get("pragma");
      if (cacheControl === "no-cache" || pragma === "no-cache") {
        return cb(...args);
      }
    } catch {
      // Ignore header errors during prerendering.
    }
    const serializedArgs = JSON.stringify(args);
    return cachedFn(key, serializedArgs);
  }) as unknown as T;
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
