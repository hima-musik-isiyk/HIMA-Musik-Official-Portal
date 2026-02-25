import { notFound } from "next/navigation";
import React from "react";

import { fetchArchiveById } from "@/lib/notion";
import ArchiveDetailView from "@/views/ArchiveDetail";

export const revalidate = 60;

type ArchiveDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArchiveDetailPage({
  params,
}: ArchiveDetailPageProps) {
  const { id } = await params;
  const result = await fetchArchiveById(id);

  if (!result) {
    notFound();
  }

  return <ArchiveDetailView entry={result.entry} blocks={result.blocks} />;
}
