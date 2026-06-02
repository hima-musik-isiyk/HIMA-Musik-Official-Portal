import type { Metadata } from "next";

import { PageBuilder } from "@/components/builder/PageBuilder";
import PageEntranceWrapper from "@/components/builder/PageEntranceWrapper";
import {
  fetchFAQCategoriesCached,
  fetchFAQEntries,
  filterFAQVisibility,
} from "@/lib/faq";
import { fetchContainerCMSCached } from "@/lib/notion-builder";

export const metadata: Metadata = {
  title: "FAQ & Tanya Jawab | HIMA Musik",
  description:
    "Temukan jawaban atas pertanyaan umum seputar HIMA Musik — kegiatan, organisasi, akademik, dan lebih banyak lagi. Kirim pertanyaanmu langsung dari sini.",
  keywords: [
    "FAQ HIMA Musik",
    "tanya jawab",
    "pertanyaan umum",
    "HIMA Musik ITB",
  ],
  openGraph: {
    title: "FAQ & Tanya Jawab | HIMA Musik",
    description:
      "Pertanyaan umum seputar HIMA Musik. Kirim pertanyaan baru langsung dari portal ini.",
    type: "website",
  },
};

export default async function FAQPage() {
  const [rawEntries, cmsData, categories] = await Promise.all([
    fetchFAQEntries(),
    fetchContainerCMSCached(),
    fetchFAQCategoriesCached(),
  ]);
  const entries = filterFAQVisibility(rawEntries);

  return (
    <PageEntranceWrapper route="/faq">
      <PageBuilder
        pageData={cmsData}
        injectedProps={{
          "FAQ List": {
            initialEntries: entries,
            initialCategories: categories,
          },
        }}
      />
    </PageEntranceWrapper>
  );
}
