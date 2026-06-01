import { PageBuilder } from "@/components/builder/PageBuilder";
import PageEntranceWrapper from "@/components/builder/PageEntranceWrapper";
import { fetchEventsCollection, fetchKKMGroups } from "@/lib/notion";
import { fetchContainerCMSCached } from "@/lib/notion-builder";

export const revalidate = 0;

export default async function AgendaPage() {
  const [collection, kkmGroups, cmsData] = await Promise.all([
    fetchEventsCollection(),
    fetchKKMGroups(),
    fetchContainerCMSCached(),
  ]);

  return (
    <PageEntranceWrapper route="/agenda">
      <PageBuilder
        pageData={cmsData}
        injectedProps={{
          "Agenda List": { collection, kkmGroups },
        }}
      />
    </PageEntranceWrapper>
  );
}
