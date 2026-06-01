import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import PageEntranceWrapper from "@/components/builder/PageEntranceWrapper";
import { fetchKKMModularDataCached } from "@/lib/notion";
import { fetchContainerCMSCached } from "@/lib/notion-builder";

export const revalidate = 0;

export default async function KKMPage() {
  const pageId = process.env.NOTION_KKM_PAGE_ID || "";
  const [data, cmsData] = await Promise.all([
    fetchKKMModularDataCached(pageId),
    fetchContainerCMSCached(),
  ]);

  return (
    <PageEntranceWrapper route="/kkm">
      <PageBuilder
        pageData={cmsData}
        injectedProps={{
          "KKM Grid": { hero: data.hero, groups: data.groups },
        }}
      />
    </PageEntranceWrapper>
  );
}
