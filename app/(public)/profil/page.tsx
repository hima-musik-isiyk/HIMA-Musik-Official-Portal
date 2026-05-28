import React from "react";

import { fetchProfilModularDataCached } from "@/lib/notion";
import About from "@/views/About";

export const revalidate = 60;

export default async function ProfilPage() {
  const pageId =
    process.env.NOTION_PROFIL_PAGE_ID || "36e3b26dc3be80f2b542ced846ba8edb";
  const data = await fetchProfilModularDataCached(pageId);

  return (
    <About
      paragraph={data?.paragraph}
      cabinetName={data?.cabinetName}
      executives={data?.executives}
      divisions={data?.divisions}
    />
  );
}
