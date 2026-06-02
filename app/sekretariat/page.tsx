import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import PageEntranceWrapper from "@/components/builder/PageEntranceWrapper";
import { fetchSekretariatPortalData } from "@/lib/notion";
import { fetchContainerCMSCached } from "@/lib/notion-builder";

export default async function DocsPage() {
  const [{ docs, categories }, cmsData] = await Promise.all([
    fetchSekretariatPortalData(),
    fetchContainerCMSCached(),
  ]);

  return (
    <PageEntranceWrapper route="/sekretariat">
      <PageBuilder
        pageData={cmsData}
        injectedProps={{
          "Sekretariat Grid": { docs, initialCategories: categories },
        }}
      />
    </PageEntranceWrapper>
  );
}
