import React from "react";

import { fetchAllDocs } from "@/lib/notion";
import DocsPortalView from "@/views/DocsPortal";

export const revalidate = 60;

export default async function DocsPage() {
  const docs = await fetchAllDocs();
  return <DocsPortalView docs={docs} />;
}
