import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { fetchArchiveEntries } from "@/lib/notion";

export const revalidate = 0;

export default async function ArchivesPage() {
  const [entries, allTags] = await fetchArchiveEntries();

  return (
    <PageBuilder
      overrideComponent="Archives List"
      injectedProps={{ "Archives List": { entries, allTags } }}
    />
  );
}
