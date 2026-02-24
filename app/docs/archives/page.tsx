import React from "react";

import { fetchArchives } from "@/lib/notion";
import ArchivesView from "@/views/Archives";

export const revalidate = 60;

export default async function ArchivesPage() {
  const entries = await fetchArchives();
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();

  return <ArchivesView entries={entries} allTags={allTags} />;
}
