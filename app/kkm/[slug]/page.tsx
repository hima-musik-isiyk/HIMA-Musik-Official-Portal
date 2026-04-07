import { notFound } from "next/navigation";

import { fetchKKMEntryBySlug, fetchKKMGroups } from "@/lib/notion";
import DocPageView from "@/views/DocPage";

export const revalidate = 60;

export async function generateStaticParams() {
  const groups = await fetchKKMGroups();
  return groups.map((group) => ({ slug: group.slug }));
}

type KKMEntryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function KKMEntryPage({ params }: KKMEntryPageProps) {
  const { slug } = await params;
  const result = await fetchKKMEntryBySlug(slug);

  if (!result) {
    notFound();
  }

  return (
    <DocPageView
      meta={result.meta}
      blocks={result.blocks}
      sectionHref="/kkm"
      sectionLabel="KKM"
      showCategory={false}
      contentBasePath="/kkm"
      citationScope="kkm"
    />
  );
}
