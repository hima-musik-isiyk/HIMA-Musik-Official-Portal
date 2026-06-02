import React from "react";

import { PageBuilder } from "@/components/builder/PageBuilder";
import { fetchArchives } from "@/lib/notion";

export default async function ArchivesPage() {
  const [entries, allTags] = await fetchArchives();

  return (
    <PageBuilder
      overrideComponent="Archives List"
      injectedProps={{ "Archives List": { entries, allTags } }}
    />
  );
}
