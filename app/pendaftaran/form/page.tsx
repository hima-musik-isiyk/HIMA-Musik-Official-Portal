import { redirect } from "next/navigation";

import { PageBuilder } from "@/components/builder/PageBuilder";
import PageEntranceWrapper from "@/components/builder/PageEntranceWrapper";
import { FEATURES } from "@/lib/feature-flags";
import { fetchContainerCMSCached } from "@/lib/notion-builder";

export default async function PendaftaranFormPage() {
  if (!FEATURES.ALLOW_PENDAFTARAN) {
    redirect("/");
  }

  const cmsData = await fetchContainerCMSCached();

  return (
    <PageEntranceWrapper route="/pendaftaran/form">
      <PageBuilder pageData={cmsData} />
    </PageEntranceWrapper>
  );
}
