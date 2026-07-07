"use client";

import DocsSidebar from "@/components/DocsSidebar";
import type { DocMeta } from "@/lib/notion";

interface SekretariatSidebarProps {
  docs?: DocMeta[];
}

export default function SekretariatSidebar({
  docs = [],
}: SekretariatSidebarProps) {
  return <DocsSidebar docs={docs} />;
}
