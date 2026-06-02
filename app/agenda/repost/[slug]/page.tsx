import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { fetchEventBySlug } from "@/lib/notion";

interface EventDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailRepostRoute({
  params,
}: EventDetailRouteProps) {
  const { slug } = await params;
  const result = await fetchEventBySlug(slug, { allowPreview: true }); // Allow draft/active

  if (!result) return notFound();

  const kkmHref = "/agenda";

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
