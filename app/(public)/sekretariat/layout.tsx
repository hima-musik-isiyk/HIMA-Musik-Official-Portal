import React from "react";

import DocsSidebar from "@/components/DocsSidebar";
import { fetchAllDocs } from "@/lib/notion";

export const revalidate = 60;

type DocsLayoutProps = {
  children: React.ReactNode;
};

export default async function DocsLayout({ children }: DocsLayoutProps) {
  const docs = await fetchAllDocs();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-360">
      <DocsSidebar docs={docs} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
