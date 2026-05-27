import { Metadata } from "next";
import React from "react";

import FAQView from "@/views/FAQ";

export const revalidate = 0; // Dynamic Q&A page

export const metadata: Metadata = {
  title: "FAQ & Tanya Jawab | Sekretariat HIMA Musik",
  description:
    "Portal tanya jawab transparan dan FAQ resmi Himpunan Mahasiswa Musik (HIMA MUSIK). Ajukan pertanyaan dan lihat jawaban secara real-time.",
};

export default function FAQPage() {
  return <FAQView />;
}
