import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { PreviewActionBar } from "@/components/builder/special/PreviewActionBar";
import { fetchEventBySlug } from "@/lib/notion";

export const revalidate = 0;

interface EventDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPreviewRoute({
  params,
}: EventDetailRouteProps) {
  const { slug } = await params;
  const result = await fetchEventBySlug(slug, true); // Allow draft

  if (!result) return notFound();

  let kkmHref = "/agenda";
  if (result.meta.parent_kkm_slug) {
    kkmHref = `/kkm/${result.meta.parent_kkm_slug}`;
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
