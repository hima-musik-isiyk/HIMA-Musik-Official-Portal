import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { fetchEventBySlug } from "@/lib/notion";

export const revalidate = 0;

interface EventDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailRepostRoute({
  params,
}: EventDetailRouteProps) {
  const { slug } = await params;
  const result = await fetchEventBySlug(slug, true); // Allow draft/active

  if (!result) return notFound();

  let kkmHref = "/agenda";
  if (result.meta.parent_kkm_slug) {
    kkmHref = `/kkm/${result.meta.parent_kkm_slug}`;
  }

  // Treat as active for the repost view to bypass draft indicators
  const forcedMeta = { ...result.meta, status: "Active" };

  return (
    <PageBuilder
      overrideComponent="Event Detail"
      injectedProps={{
        "Event Detail": {
          meta: forcedMeta,
          blocks: result.blocks,
          kkmHref,
        },
      }}
    />
  );
}
