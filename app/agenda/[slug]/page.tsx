import { notFound } from "next/navigation";
import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { fetchEventBySlug, fetchKKMGroups } from "@/lib/notion";

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
    <PageBuilder
      pathname={`/agenda/${slug}`}
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
