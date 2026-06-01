import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CMS_PATHNAME_HEADER } from "@/lib/cms-route";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // 1. Fetch redirects from our dynamic internal endpoint
    const apiUrl = new URL("/api/redirects", request.url);
    const res = await fetch(apiUrl);

    if (res.ok) {
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        const redirects = payload.data;

        // 2. Search for a matching source path (exact case-insensitive match)
        const match = redirects.find(
          (entry: { sourcePath: string; destinationUrl: string }) => {
            const normalizedSource = entry.sourcePath.trim().toLowerCase();
            const normalizedPath = pathname.trim().toLowerCase();

            return (
              normalizedSource === normalizedPath ||
              normalizedSource === `${normalizedPath}/` ||
              `${normalizedSource}/` === normalizedPath
            );
          },
        );

        if (match) {
          // 3. Match found! Perform 307 temporary redirect
          const destination = match.destinationUrl.startsWith("http")
            ? match.destinationUrl
            : new URL(match.destinationUrl, request.url).toString();

          return NextResponse.redirect(destination, 307);
        }
      }
    }
  } catch (error) {
    // Fail-safe: log the error and allow the request to proceed without blocking
    console.error("[Proxy Redirects Error]:", error);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CMS_PATHNAME_HEADER, pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - All files with extension (e.g. .svg, .png, .jpg, .css)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
