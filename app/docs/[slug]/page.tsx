import { notFound } from "next/navigation";
import React from "react";

import { fetchAllDocs, fetchDocBySlug } from "@/lib/notion";
import DocPageView from "@/views/DocPage";

export const revalidate = 60;

export async function generateStaticParams() {
  const docs = await fetchAllDocs();
  return docs.map((doc) => ({ slug: doc.slug }));
}

type DocSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DocSlugPage({ params }: DocSlugPageProps) {
  const { slug } = await params;
  const result = await fetchDocBySlug(slug);

  if (!result) {
    notFound();
  }

  return <DocPageView meta={result.meta} blocks={result.blocks} />;
}
