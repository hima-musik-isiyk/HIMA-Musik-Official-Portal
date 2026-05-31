import React from "react";

import { fetchKKMModularDataCached } from "@/lib/notion";
import KKMPortalView from "@/views/KKMPortal";

export const revalidate = 0;

export default async function KKMPage() {
  const pageId = process.env.NOTION_KKM_PAGE_ID || "";
  const data = await fetchKKMModularDataCached(pageId);

  return <KKMPortalView hero={data.hero} groups={data.groups} />;
}
