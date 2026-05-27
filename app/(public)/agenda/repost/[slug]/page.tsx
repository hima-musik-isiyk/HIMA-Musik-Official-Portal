import { notFound } from "next/navigation";

import {
  fetchAllEventEntries,
  fetchEventBySlug,
  fetchKKMGroups,
} from "@/lib/notion";
import EventDetailView from "@/views/EventDetail";

export const revalidate = 60;

export async function generateStaticParams() {
  const entries = await fetchAllEventEntries();
  return entries
    .filter((entry) => entry.isRepost)
    .map((entry) => ({ slug: entry.slug }));
}

type RepostEntryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RepostEntryPage({
  params,
}: RepostEntryPageProps) {
  const { slug } = await params;
  const [result, kkmGroups] = await Promise.all([
    fetchEventBySlug(slug),
    fetchKKMGroups(),
  ]);

  if (!result || !result.meta.isRepost) {
    notFound();
  }

  const normalizeUnitName = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^kkm[\s:/-]*/i, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const ownerUnit = normalizeUnitName(result.meta.ownerUnit);
  const kkmHref = ownerUnit
    ? (() => {
        const match = kkmGroups.find(
          (group) => normalizeUnitName(group.name) === ownerUnit,
        );
        return match ? `/kkm/${match.slug}` : undefined;
      })()
    : undefined;

  return (
    <EventDetailView
      meta={result.meta}
      blocks={result.blocks}
      kkmHref={kkmHref}
    />
  );
}
