import { headers } from "next/headers";

export const CMS_PATHNAME_HEADER = "x-pathname";

/** Current request pathname from proxy (no hardcoded route slugs). */
export async function getRequestPathname(): Promise<string> {
  const headerStore = await headers();
  const fromProxy = headerStore.get(CMS_PATHNAME_HEADER);
  if (fromProxy) {
    const trimmed = fromProxy.trim();
    return trimmed || "/";
  }

  const nextUrl = headerStore.get("x-url") ?? headerStore.get("next-url");
  if (nextUrl) {
    try {
      const pathname = new URL(nextUrl, "http://localhost").pathname;
      return pathname || "/";
    } catch {
      // ignore malformed header
    }
  }

  return "/";
}
