import { revalidatePath, revalidateTag } from "next/cache";

import type { CMSPage } from "./notion-builder";
import { revalidateScope } from "./notion-revalidate-helper";

export const CMS_REVALIDATION_SCOPES = [
  "events",
  "beranda",
  "profil",
  "kkm",
  "faq",
  "redirects",
] as const;

function normalizeCmsPath(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function revalidateCmsCaches(pages: CMSPage[] = []) {
  revalidateTag("notion-container", { expire: 0 });

  for (const scope of CMS_REVALIDATION_SCOPES) {
    revalidateScope(scope);
  }

  for (const page of pages) {
    if (page.type === "Redirect") continue;
    revalidatePath(normalizeCmsPath(page.slug || "/"));
  }
}
