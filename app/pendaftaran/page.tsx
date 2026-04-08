import { redirect } from "next/navigation";

import { FEATURES } from "@/lib/feature-flags";
import PendaftaranLanding from "@/views/PendaftaranLanding";

export default function PendaftaranPage() {
  if (!FEATURES.ALLOW_PENDAFTARAN) {
    redirect("/");
  }

  return <PendaftaranLanding />;
}
