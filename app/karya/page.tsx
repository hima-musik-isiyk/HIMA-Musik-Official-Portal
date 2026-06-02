import { PageBuilder } from "@/components/builder/PageBuilder";
import PageEntranceWrapper from "@/components/builder/PageEntranceWrapper";
import { fetchKaryaEntries } from "@/lib/notion";
import { fetchContainerCMSCached } from "@/lib/notion-builder";

export default async function KaryaPage() {
  const [entries, cmsData] = await Promise.all([
    fetchKaryaEntries(),
    fetchContainerCMSCached(),
  ]);

  return (
    <PageEntranceWrapper route="/karya">
      <PageBuilder
        pageData={cmsData}
        injectedProps={{
          "Karya Grid": { entries },
        }}
      />
    </PageEntranceWrapper>
  );
}
