import React, { useEffect, useRef, useState } from "react";

import { IconChevronDown } from "@/components/Icons";
import {
  fetchDivisionsOnce,
  readCachedDivisions,
} from "@/lib/divisions-client";
import { getCmsGsapEasing, gsap } from "@/lib/gsap";
import {
  type Division,
  divisions as staticDivisions,
} from "@/lib/pendaftaran-data";

const DivisionAccordionItem: React.FC<{
  division: Division;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ division, isOpen, onToggle }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const ease = getCmsGsapEasing();
    gsap.killTweensOf(content);

    if (isOpen) {
      gsap.to(content, {
        height: "auto",
        opacity: 1,
        duration: 0.4,
        ease,
      });
      return;
    }

    gsap.to(content, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease,
    });
  }, [isOpen]);

  return (
    <div data-animate="up" className="border border-white/5 bg-white/2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`division-panel-${division.id}`}
        className="flex w-full cursor-pointer items-center justify-between p-6 text-left select-none md:p-8"
      >
        <div>
          <h3 className="mb-1 font-serif text-xl text-white md:text-2xl">
            {division.name}
          </h3>
          <p className="text-gold-500/80 text-sm font-medium">
            {division.focus}
          </p>
        </div>
        <IconChevronDown
          className={`ml-4 shrink-0 text-neutral-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        ref={contentRef}
        id={`division-panel-${division.id}`}
        className="h-0 overflow-hidden opacity-0"
      >
        <div className="border-t border-white/5 px-6 pb-6 md:px-8 md:pb-8">
          <p className="mt-6 mb-6 text-sm leading-relaxed text-neutral-400">
            {division.summary}
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-medium text-neutral-300">
                Tugas Utama
              </h4>
              <ul className="space-y-2 text-sm text-neutral-300">
                {division.tasks.map((task) => (
                  <li key={task} className="flex gap-3">
                    <span className="text-gold-500 shrink-0">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-neutral-300">
                Skill &amp; Komitmen
              </h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {division.skills.map((skill) => (
                    <span
                      key={skill}
                      className="border-gold-500/30 bg-gold-500/5 text-gold-300 border px-3 py-1 text-sm"
                      style={{ borderRadius: "var(--radius-action)" }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-neutral-300">
                  {division.commitment}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PanduanDivisiProps {
  value1?: string;
  value2?: string;
  value3?: string;
}

export default function PanduanDivisi({
  value1: _value1,
  value2: _value2,
  value3: _value3,
}: PanduanDivisiProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [divisions, setDivisions] = useState<Division[]>(staticDivisions);

  useEffect(() => {
    const cached = readCachedDivisions();
    if (cached) setDivisions(cached);

    fetchDivisionsOnce()
      .then(setDivisions)
      .catch((err) =>
        console.error("Error fetching divisions in panduan:", err),
      );
  }, []);

  const toggleDivision = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full">
      <div data-animate-stagger="0.1" className="space-y-4">
        {divisions
          .filter((division) => division.slots > 0)
          .map((division) => (
            <DivisionAccordionItem
              key={division.id}
              division={division}
              isOpen={Boolean(openSections[division.id])}
              onToggle={() => toggleDivision(division.id)}
            />
          ))}
      </div>
    </div>
  );
}
