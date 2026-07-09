import React from "react";

import { IconCheck } from "@/components/Icons";

interface PendaftaranChecklistsProps {
  value1?: string;
  value2?: string;
  value3?: string;
}

export default function PendaftaranChecklists({
  value1: _value1,
  value2: _value2,
  value3: _value3,
}: PendaftaranChecklistsProps) {
  return (
    <div className="w-full">
      <div data-animate-stagger="0.1" className="space-y-6">
        {[
          {
            label: "Professionalism",
            text: "Disiplin dalam waktu dan komunikasi.",
          },
          {
            label: "Commitment",
            text: "Siap berkontribusi aktif selama satu periode.",
          },
          {
            label: "Growth Mindset",
            text: "Terbuka terhadap feedback dan pembelajaran baru.",
          },
        ].map((item) => (
          <div key={item.label} data-animate="up" className="flex gap-4">
            <div className="bg-gold-500/10 border-gold-500/20 text-gold-500 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border">
              <IconCheck />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">{item.label}</h4>
              <p className="text-xs text-neutral-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
