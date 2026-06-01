import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { fetchEventBySlug } from "@/lib/notion";

export const revalidate = 0;

interface EventDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailRoute({
  params,
}: EventDetailRouteProps) {
  const { slug } = await params;
  const result = await fetchEventBySlug(slug, { allowPreview: false }); // Active

  if (!result) return notFound();

  // If this event has a parent KKM relation, let's determine the href to link back.
  const kkmHref = "/agenda"; // Default back link

  return (
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
  );
}
