import React from "react";

import { fetchSekretariatPortalData } from "@/lib/notion";
import DocsPortalView from "@/views/DocsPortal";

export const revalidate = 60;

export default async function DocsPage() {
  const { docs, categories } = await fetchSekretariatPortalData();
  return <DocsPortalView docs={docs} initialCategories={categories} />;
}
