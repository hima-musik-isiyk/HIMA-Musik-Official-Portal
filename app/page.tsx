import React from "react";

import { fetchBerandaModularDataCached } from "@/lib/notion";

import Home from "../views/Home";

export const revalidate = 0;

export default async function Page() {
  const pageId =
    process.env.NOTION_BERANDA_PAGE_ID || "36e3b26dc3be8036be8cc142fa468964";
  const data = await fetchBerandaModularDataCached(pageId);

  return <Home heroSection={data?.heroSection} jelajahi={data?.jelajahi} />;
}
