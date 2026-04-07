import { notFound } from "next/navigation";

import { fetchAllEventEntries, fetchEventBySlug } from "@/lib/notion";
import EventDetailView from "@/views/EventDetail";

export const revalidate = 60;

export async function generateStaticParams() {
  const entries = await fetchAllEventEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

type EventEntryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventEntryPage({ params }: EventEntryPageProps) {
  const { slug } = await params;
  const result = await fetchEventBySlug(slug);

  if (!result) {
    notFound();
  }

  return <EventDetailView meta={result.meta} blocks={result.blocks} />;
}
