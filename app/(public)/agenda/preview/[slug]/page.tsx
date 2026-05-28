import { notFound } from "next/navigation";

import { fetchEventBySlug, fetchKKMGroups } from "@/lib/notion";
import EventDetailView from "@/views/EventDetail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventPreviewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgendaPreviewPage({
  params,
}: EventPreviewPageProps) {
  const { slug } = await params;
  const [result, kkmGroups] = await Promise.all([
    fetchEventBySlug(slug, { allowPreview: true }),
    fetchKKMGroups(),
  ]);

  if (!result) {
    notFound();
  }

  if (result.meta.isRepost) {
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

  const ownerUnitNormalized = normalizeUnitName(result.meta.ownerUnit);
  const matchedGroup = ownerUnitNormalized
    ? kkmGroups.find(
        (group) =>
          normalizeUnitName(group.name) === ownerUnitNormalized ||
          normalizeUnitName(group.slug) === ownerUnitNormalized,
      )
    : undefined;

  if (matchedGroup) {
    result.meta.ownerUnit = matchedGroup.name;
  }
  const kkmHref = matchedGroup ? `/kkm/${matchedGroup.slug}` : undefined;

  return (
    <div className="relative">
      {/* Premium Preview Alert Banner */}
      <div className="border-gold-500/20 text-gold-300 sticky top-0 z-50 border-b bg-black/80 py-3 text-center text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
        ⚠️ Mode Preview: Halaman ini hanya untuk tinjauan internal KKM /
        Pengurus HIMA
      </div>
      <EventDetailView
        meta={result.meta}
        blocks={result.blocks}
        kkmHref={kkmHref}
      />
    </div>
  );
}
