import type { Metadata } from "next";
import { redirect } from "next/navigation";

import PageEntranceWrapper from "@/components/builder/PageEntranceWrapper";
import PendaftaranForm from "@/components/builder/special/PendaftaranForm";
import { FEATURES } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Formulir Pendaftaran | HIMA Musik",
  description: "Formulir pendaftaran pengurus HIMA Musik ISI Yogyakarta.",
};

export default function PendaftaranFormPage() {
  if (!FEATURES.ALLOW_PENDAFTARAN) {
    redirect("/");
  }

  return (
    <PageEntranceWrapper route="/pendaftaran/form">
      <PendaftaranForm />
    </PageEntranceWrapper>
  );
}
