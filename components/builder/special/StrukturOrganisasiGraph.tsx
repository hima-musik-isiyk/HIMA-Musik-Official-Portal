"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

import RotatingText, { RotatingTextRef } from "@/components/RotatingText";
import type {
  ProfilModularDivision,
  ProfilModularExecutive,
} from "@/lib/notion";
import { divisions as allDivisions } from "@/lib/pendaftaran-data";
import useViewEntrance from "@/lib/useViewEntrance";

import { GenericLineTitle } from "../core/GenericLineTitle";

interface StrukturOrganisasiGraphProps {
  value1?: string; // Tampilkan Batch...
  value2?: string; // Database ID...
}

export const StrukturOrganisasiGraph: React.FC<
  StrukturOrganisasiGraphProps
> = ({ value1, value2 }) => {
  const pathname = usePathname();
  const [data, setData] = useState<{
    executives: ProfilModularExecutive[];
    divisions: ProfilModularDivision[];
    cabinetName: string;
  }>({
    executives: [],
    divisions: [],
    cabinetName: "",
  });

  const scopeRef = useViewEntrance(pathname, [data]);

  useEffect(() => {
    // Try to load from localStorage cache first
    try {
      const cached = window.localStorage.getItem("hima_profil_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        setData((prev) => ({
          executives:
            prev.executives.length > 0
              ? prev.executives
              : parsed.executives || [],
          divisions:
            prev.divisions.length > 0 ? prev.divisions : parsed.divisions || [],
          cabinetName: prev.cabinetName || parsed.cabinetName || "",
        }));
      }
    } catch {}

    const fetchProfilData = async () => {
      if (!value2?.trim()) return;

      try {
        const params = new URLSearchParams();
        params.set("databaseId", value2.trim());
        if (value1?.trim()) {
          params.set("batch", value1.trim());
        }
        const res = await fetch(`/api/profil?${params.toString()}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setData({
              executives: result.data.executives || [],
              divisions: result.data.divisions || [],
              cabinetName: result.data.cabinetName || "",
            });
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                "hima_profil_cache",
                JSON.stringify(result.data),
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch fresh profil data:", err);
      }
    };

    fetchProfilData();
  }, [value1, value2]);

  const fallbackExecutives = [
    { role: "Ketua Himpunan", name: "Vincent Nuridzati Adittama" },
    { role: "Wakil Ketua", name: "Nadia Fibriani" },
    { role: "Sekretaris", name: "Nuzulul Dian Maulida" },
    { role: "Bendahara", name: "Elizabeth Ardhayu Maheswari" },
    { role: "Co-Sekretaris", name: "Yakobus Tosan Sejati Dinar Purnomo" },
    { role: "Humas", name: "Moses Jovilaga" },
    { role: "Publikasi, Desain & Dokumentasi", name: "Harmony Aulia Keisha" },
    {
      role: "Publikasi, Desain & Dokumentasi",
      name: "Alexandro Hamonangan Hutasoit",
    },
    {
      role: "Publikasi, Desain & Dokumentasi",
      name: "Ken Adonai Zireh Wardoyo",
    },
    { role: "Divisi Program & Event", name: "Syaka Maheswara Adi Suro" },
  ];

  const executivesList =
    data.executives && data.executives.length > 0
      ? data.executives
      : fallbackExecutives;

  return (
    <div ref={scopeRef} className="w-full">
      <div className="mt-12">
        <GenericLineTitle value1="Badan Pengurus Harian" variation1="Center" />
      </div>
      <OrgChart executives={executivesList} />
      <div className="mt-12">
        <GenericLineTitle value1="Divisi" variation1="Center" />
        <DivisionCards executives={executivesList} divisions={data.divisions} />
      </div>
    </div>
  );
};

// --- Helper components ---

const BphOpenSlot = () => {
  const [hovered, setHovered] = useState(false);
  const rtRef = useRef<RotatingTextRef | null>(null);
  return (
    <div
      className="mt-1 flex items-center justify-center gap-1.5"
      onMouseEnter={() => {
        setHovered(true);
        rtRef.current?.next();
      }}
      onMouseLeave={() => {
        setHovered(false);
        rtRef.current?.reset();
      }}
    >
      <span className="text-gold-300/80 shrink-0 font-serif text-xs tracking-wider uppercase">
        Terbuka
      </span>
      <span className="bg-gold-500/20 text-gold-300 border-gold-500/30 inline-flex items-center rounded border px-2 py-0.5">
        <RotatingText
          ref={rtRef}
          texts={["1 Posisi"]}
          mainClassName="font-serif text-xs uppercase tracking-wider"
          staggerFrom="last"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden pb-0.5"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={2000}
          splitBy="words"
          auto={hovered}
          loop
        />
      </span>
    </div>
  );
};

const OrgChart = ({
  executives,
}: {
  executives: { role: string; name: string }[];
}) => {
  const branchContainerRef = useRef<HTMLDivElement>(null);
  const sekretarisBranchRef = useRef<HTMLDivElement>(null);
  const bendaharaBranchRef = useRef<HTMLDivElement>(null);
  const [branchConnector, setBranchConnector] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateBranchConnector = () => {
      const container = branchContainerRef.current;
      const sekretaris = sekretarisBranchRef.current;
      const bendahara = bendaharaBranchRef.current;

      if (!container || !sekretaris || !bendahara) return;

      const containerRect = container.getBoundingClientRect();
      const sekretarisRect = sekretaris.getBoundingClientRect();
      const bendaharaRect = bendahara.getBoundingClientRect();

      const sekretarisCenter =
        sekretarisRect.left - containerRect.left + sekretarisRect.width / 2;
      const bendaharaCenter =
        bendaharaRect.left - containerRect.left + bendaharaRect.width / 2;

      const left = Math.min(sekretarisCenter, bendaharaCenter);
      const width = Math.abs(bendaharaCenter - sekretarisCenter);

      setBranchConnector({ left, width });
    };

    const frameId = window.requestAnimationFrame(updateBranchConnector);
    window.addEventListener("resize", updateBranchConnector);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateBranchConnector);
    };
  }, []);

  const findExec = (roleName: string) => {
    const found = executives.find((e) =>
      e.role.toLowerCase().includes(roleName.toLowerCase()),
    );
    return found?.name ?? "—";
  };

  return (
    <div>
      <div className="flex w-full flex-col items-center">
        <div
          className="w-full max-w-sm border border-white/8 bg-white/3 px-8 py-6 text-center"
          data-animate="up"
        >
          <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Ketua Himpunan
          </p>
          <p className="font-serif text-lg text-white">{findExec("ketua")}</p>
        </div>

        <div data-animate="up" className="h-8 w-px bg-white/15" />

        <div
          className="w-full max-w-sm border border-white/8 bg-white/3 px-8 py-6 text-center"
          data-animate="up"
        >
          <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Wakil Ketua
          </p>
          <p className="font-serif text-lg text-white">{findExec("wakil")}</p>
        </div>

        <div data-animate="up" className="h-8 w-px bg-white/15" />

        <div
          className="relative w-full max-w-2xl"
          ref={branchContainerRef}
          data-animate="fade"
          data-animate-delay="0.1"
          data-animate-start="top 100%"
        >
          <div
            className="absolute top-0 h-px bg-white/15"
            style={{
              left: `${branchConnector.left}px`,
              width: `${branchConnector.width}px`,
            }}
          />

          <div className="flex gap-4 pt-px md:gap-8">
            <div
              className="flex flex-1 flex-col items-center"
              ref={sekretarisBranchRef}
            >
              <div className="h-8 w-px bg-white/15" />
              <div className="flex w-full flex-col justify-center border border-white/8 bg-white/3 px-4 py-5 text-center md:min-h-25 md:px-6 md:py-6">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                  Sekretaris
                </p>
                <p className="font-serif text-sm leading-snug text-white md:text-base">
                  {findExec("sekretaris")}
                </p>
              </div>

              {executives.some(
                (e) =>
                  e.role.toLowerCase().includes("co-sekretaris") ||
                  e.role.toLowerCase().includes("sekretaris muda"),
              ) && (
                <>
                  <div className="border-gold-500/35 h-6 w-px border-l border-dashed" />
                  <div className="border-gold-500/20 bg-gold-500/5 flex min-h-27.5 w-full flex-col justify-center border px-4 py-5 text-center md:px-6 md:py-6">
                    <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                      Sekretaris Muda
                    </p>
                    {(() => {
                      const found = executives.find(
                        (e) =>
                          e.role.toLowerCase().includes("co-sekretaris") ||
                          e.role.toLowerCase().includes("co sekretaris") ||
                          e.role.toLowerCase().includes("sekretaris muda"),
                      );
                      const isReal =
                        found && !found.name.includes("[OPEN POSITION]");
                      return isReal ? (
                        <p className="text-gold-200 font-serif text-sm md:text-base">
                          {found.name}
                        </p>
                      ) : (
                        <BphOpenSlot />
                      );
                    })()}
                  </div>
                </>
              )}
            </div>

            <div
              className="flex flex-1 flex-col items-center"
              ref={bendaharaBranchRef}
            >
              <div className="h-8 w-px bg-white/15" />
              <div className="flex w-full flex-col justify-center border border-white/8 bg-white/3 px-4 py-5 text-center md:min-h-25 md:px-6 md:py-6">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                  Bendahara
                </p>
                <p className="font-serif text-sm leading-snug text-white md:text-base">
                  {findExec("bendahara")}
                </p>
              </div>

              {executives.some(
                (e) =>
                  e.role.toLowerCase().includes("co-bendahara") ||
                  e.role.toLowerCase().includes("bendahara muda"),
              ) && (
                <>
                  <div className="border-gold-500/35 h-6 w-px border-l border-dashed" />
                  <div className="border-gold-500/20 bg-gold-500/5 flex min-h-27.5 w-full flex-col justify-center border px-4 py-5 text-center md:px-6 md:py-6">
                    <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                      Bendahara Muda
                    </p>
                    {(() => {
                      const found = executives.find(
                        (e) =>
                          e.role.toLowerCase().includes("co-bendahara") ||
                          e.role.toLowerCase().includes("bendahara muda"),
                      );
                      const isReal =
                        found && !found.name.includes("[OPEN POSITION]");
                      return isReal ? (
                        <p className="text-gold-200 font-serif text-sm md:text-base">
                          {found.name}
                        </p>
                      ) : (
                        <BphOpenSlot />
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DivisionCard = ({
  name,
  members,
  slots,
  openPositions,
  angkatan,
}: {
  name: string;
  members: string[];
  slots: number;
  openPositions: string[];
  angkatan?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const rotatingTextRef = useRef<RotatingTextRef | null>(null);

  const rotatingTexts = useMemo(() => {
    const defaultText = `${slots} Posisi`;
    if (!openPositions || openPositions.length === 0) return [defaultText];
    return [defaultText, ...openPositions];
  }, [slots, openPositions]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    rotatingTextRef.current?.next();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotatingTextRef.current?.reset();
  };

  return (
    <div
      data-animate="up"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="border-gold-500/20 bg-gold-500/5 group hover:border-gold-500/50 hover:bg-gold-500/10 relative cursor-default border p-6 text-center transition-colors duration-300"
    >
      <p className="text-gold-200 mb-3 font-serif text-base transition-colors duration-300 group-hover:text-white">
        {name}
      </p>
      {members.length > 0 ? (
        <div className="text-gold-200/60 group-hover:text-gold-200/80 mb-2 text-sm transition-colors duration-300">
          {members.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
      ) : null}
      {slots > 0 ? (
        <div className="flex min-h-6 items-center justify-center text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-gold-300/80 shrink-0 font-serif text-xs tracking-wider uppercase">
              Terbuka
            </span>
            <span className="bg-gold-500/20 text-gold-300 border-gold-500/30 inline-flex items-center rounded border px-2 py-0.5">
              <RotatingText
                ref={rotatingTextRef}
                texts={rotatingTexts}
                mainClassName="font-serif text-xs uppercase tracking-wider"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2000}
                splitBy="words"
                auto={isHovered}
                loop
              />
            </span>
          </div>
        </div>
      ) : null}
      {angkatan && (
        <p className="mt-1.5 text-[10px] text-neutral-500">{angkatan}</p>
      )}
    </div>
  );
};

const DivisionCards = ({
  executives,
  divisions: fetchedDivisions,
}: {
  executives: { role: string; name: string }[];
  divisions?: ProfilModularDivision[];
}) => {
  const divisions = allDivisions.filter((d) => !d.id.startsWith("co-"));

  const findNamesForDivision = (divisionName: string) => {
    const matches = executives.filter(
      (e) =>
        e.role.toLowerCase().includes(divisionName.toLowerCase()) ||
        divisionName.toLowerCase().includes(e.role.toLowerCase()),
    );
    return matches.map((m) => m.name);
  };

  if (fetchedDivisions && fetchedDivisions.length > 0) {
    return (
      <div
        data-animate-stagger="0.1"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {fetchedDivisions.map((division) => (
          <DivisionCard
            key={division.name}
            name={division.name}
            members={division.members}
            slots={division.slots}
            openPositions={division.openPositions}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-animate-stagger="0.1"
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      {divisions.map((division) => {
        const names = findNamesForDivision(division.name);
        return (
          <DivisionCard
            key={division.id}
            name={division.name}
            members={names}
            slots={division.slots}
            openPositions={[]}
            angkatan={(division as { angkatan?: string }).angkatan}
          />
        );
      })}
    </div>
  );
};
