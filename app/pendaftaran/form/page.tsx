import { redirect } from "next/navigation";

import { FEATURES } from "@/lib/feature-flags";
import Pendaftaran from "@/views/Pendaftaran";

export default function PendaftaranFormPage() {
  if (!FEATURES.ALLOW_PENDAFTARAN) {
    redirect("/");
  }

  return <Pendaftaran />;
}
