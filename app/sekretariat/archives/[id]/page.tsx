import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { fetchArchiveById } from "@/lib/notion";

export const revalidate = 0;

interface ArchiveDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function ArchiveDetailPage({
  params,
}: ArchiveDetailRouteProps) {
  const { id } = await params;
  const result = await fetchArchiveById(id);

  if (!result) return notFound();

  return (
    <PageBuilder
      overrideComponent="Archive Detail"
      injectedProps={{
        "Archive Detail": { entry: result.entry, blocks: result.blocks },
      }}
    />
  );
}
