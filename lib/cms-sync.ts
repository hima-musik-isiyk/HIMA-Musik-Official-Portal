import { revalidateTag } from "next/cache";

import { revalidateScope } from "./notion-revalidate-helper";

export const CMS_REVALIDATION_SCOPES = [
  "events",
  "beranda",
  "profil",
  "kkm",
  "faq",
  "redirects",
] as const;

export function revalidateCmsCaches() {
  revalidateTag("notion-container", { expire: 0 });

  for (const scope of CMS_REVALIDATION_SCOPES) {
    revalidateScope(scope);
  }
}
