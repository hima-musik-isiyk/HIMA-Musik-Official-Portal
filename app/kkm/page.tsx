import React from "react";

import { fetchKKMGroups } from "@/lib/notion";
import KKMPortalView from "@/views/KKMPortal";

export default async function KKMPage() {
  const groups = await fetchKKMGroups();

  return <KKMPortalView groups={groups} />;
}
