import React from "react";

import { IconCheck, IconDiamond } from "@/components/Icons";

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
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
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
                  <h4 className="text-sm font-medium text-white">
                    {item.label}
                  </h4>
                  <p className="text-xs text-neutral-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          data-animate="up"
          className="border-gold-500/10 bg-gold-500/2 mt-8 border p-8 md:p-10 lg:mt-0"
        >
          <div className="mb-6 flex h-10 w-10 items-center justify-center bg-white/5">
            <IconDiamond className="text-gold-500" />
          </div>
          <p className="text-gold-200/90 mb-4 text-sm font-semibold tracking-wide uppercase">
            HR Professional Tip
          </p>
          <p className="mb-6 text-sm leading-relaxed text-neutral-400 italic">
            &quot;Saat tahap wawancara, jangan hanya menceritakan apa yang bisa
            kamu lakukan. Ceritakan bagaimana kamu akan menggunakan skill
            tersebut untuk memberikan dampak nyata bagi program kerja
            HIMA.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
