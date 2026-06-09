import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import PreviewActionBar from "@/components/PreviewActionBar";
import { fetchEventBySlug, fetchKKMGroups } from "@/lib/notion";

export const revalidate = 0;

interface EventDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPreviewRoute({
  params,
}: EventDetailRouteProps) {
  const { slug } = await params;
  const result = await fetchEventBySlug(slug, { allowPreview: true }); // Allow draft

  if (!result) return notFound();

  let kkmHref = "/agenda";
  if (result.meta.ownerUnit) {
    const kkmGroups = await fetchKKMGroups();
    const matched = kkmGroups.find(
      (g) => g.name.toLowerCase() === result.meta.ownerUnit?.toLowerCase(),
    );
    if (matched) {
      kkmHref = `/kkm/${matched.slug}`;
    }
  }

  return (
    <>
      <PreviewActionBar />
      <PageBuilder
        overrideComponent="Event Detail"
        injectedProps={{
          "Event Detail": {
            meta: result.meta,
            blocks: result.blocks,
            kkmHref,
          },
        }}
      />
    </>
  );
}
