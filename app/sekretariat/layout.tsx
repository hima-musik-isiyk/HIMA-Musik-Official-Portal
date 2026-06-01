import React from "react";

import DocsSidebar from "@/components/DocsSidebar";
import { fetchAllDocs } from "@/lib/notion";

export const revalidate = 0;

type DocsLayoutProps = {
  children: React.ReactNode;
};

export default async function DocsLayout({ children }: DocsLayoutProps) {
  const docs = await fetchAllDocs();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full">
      <DocsSidebar docs={docs} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
