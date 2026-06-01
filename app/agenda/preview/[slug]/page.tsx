import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import PreviewActionBar from "@/components/PreviewActionBar";
import { fetchEventBySlug } from "@/lib/notion";

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

  const kkmHref = "/agenda";

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
