"use client";

import useEmblaCarousel from "embla-carousel-react";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

import RotatingText, { RotatingTextRef } from "@/components/RotatingText";
import { cleanCmsValue } from "@/lib/cms-placeholders";
import {
  fetchDivisionsOnce,
  readCachedDivisions,
} from "@/lib/divisions-client";
import type {
  ProfilModularDivision,
  ProfilModularExecutive,
} from "@/lib/notion";
import {
  type Division,
  divisions as staticDivisions,
} from "@/lib/pendaftaran-data";
import useViewEntrance from "@/lib/useViewEntrance";

import { GenericLineTitle } from "../core/GenericLineTitle";

interface StrukturOrganisasiGraphProps {
  value1?: string; // Tampilkan Batch...
  value2?: string; // Database ID...
  cmsVariables?: Record<string, string>;
}

export const StrukturOrganisasiGraph: React.FC<
  StrukturOrganisasiGraphProps
> = ({ value1, value2, cmsVariables }) => {
  const activeDatabaseId = cleanCmsValue(value2, ["Database ID"]);
  const activeBatch =
    cleanCmsValue(value1, ["Tampilkan Batch dari 1 Sampai"]) ||
    cmsVariables?.CURRENT_BATCH ||
    "";
  const pathname = usePathname();
  const [fallbackDivisions, setFallbackDivisions] =
    useState<Division[]>(staticDivisions);

  useEffect(() => {
    const cached = readCachedDivisions();
    if (cached) setFallbackDivisions(cached.divisions);

    fetchDivisionsOnce()
      .then((res) => setFallbackDivisions(res.divisions))
      .catch((err) => console.error("Error fetching divisions in graph:", err));
  }, []);

  const [data, setData] = useState<{
    executives: ProfilModularExecutive[];
    divisions: ProfilModularDivision[];
    cabinetName: string;
  }>({
    executives: [],
    divisions: [],
    cabinetName: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const scopeRef = useViewEntrance(pathname, [data, isLoading]);

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
      try {
        const params = new URLSearchParams();
        if (activeDatabaseId) {
          params.set("databaseId", activeDatabaseId);
        }
        if (activeBatch) {
          params.set("batch", activeBatch);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfilData();
  }, [activeBatch, activeDatabaseId]);

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

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center gap-12 py-12 md:py-20">
        <style>{`
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.15; }
          }
          .skel-pulse {
            animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
        <div className="skel-pulse flex w-full max-w-4xl flex-col items-center gap-8">
          <div className="h-[72px] w-64 bg-white" />
          <div className="h-8 w-px bg-white" />
          <div className="h-[72px] w-64 bg-white" />
          <div className="h-8 w-px bg-white" />
          <div className="flex w-full justify-center gap-4 md:gap-8">
            <div className="h-[96px] w-full max-w-[200px] bg-white" />
            <div className="h-[96px] w-full max-w-[200px] bg-white" />
          </div>
        </div>
        <div className="skel-pulse mt-8 flex w-full gap-4 md:grid md:grid-cols-2">
          <div className="h-[280px] w-full bg-white" />
          <div className="hidden h-[280px] w-full bg-white md:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden" ref={scopeRef}>
      <div className="flex w-full flex-col items-center">
        <GenericLineTitle value1="BPH" variation1="Center" />
        <div className="mb-12 w-full md:mb-20">
          <OrgChart
            executives={executivesList}
            isRecruitment={pathname.includes("pendaftaran")}
          />
        </div>

        <GenericLineTitle value1="Divisi" variation1="Center" />
        <DivisionCards
          executives={executivesList}
          divisions={data.divisions}
          fallbackDivisions={fallbackDivisions}
          isRecruitment={pathname.includes("pendaftaran")}
        />
      </div>
    </div>
  );
};

// --- Helper components ---

const BphOpenSlot = () => {
  return (
    <div className="mt-1 flex items-center justify-center gap-1.5">
      <span className="text-gold-300/80 shrink-0 font-serif text-xs tracking-wider uppercase">
        Terbuka
      </span>
      <span className="bg-gold-500/20 text-gold-300 border-gold-500/30 inline-flex items-center rounded border px-2 py-0.5 font-serif text-xs tracking-wider uppercase">
        1 Posisi
      </span>
    </div>
  );
};

const OrgChart = ({
  executives,
  isRecruitment,
}: {
  executives: { role: string; name: string }[];
  isRecruitment: boolean;
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

              {(isRecruitment ||
                executives.some(
                  (e) =>
                    e.role.toLowerCase().includes("co-sekretaris") ||
                    e.role.toLowerCase().includes("sekretaris muda"),
                )) &&
                (() => {
                  const found = executives.find(
                    (e) =>
                      e.role.toLowerCase().includes("co-sekretaris") ||
                      e.role.toLowerCase().includes("co sekretaris") ||
                      e.role.toLowerCase().includes("sekretaris muda"),
                  );
                  const isReal =
                    found && !found.name.includes("[OPEN POSITION]");

                  if (!isReal && !isRecruitment) return null;

                  return (
                    <>
                      <div className="border-gold-500/35 h-6 w-px border-l border-dashed" />
                      <div className="border-gold-500/20 bg-gold-500/5 flex min-h-27.5 w-full flex-col justify-center border px-4 py-5 text-center md:px-6 md:py-6">
                        <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                          Sekretaris Muda
                        </p>
                        {isReal ? (
                          <p className="text-gold-200 font-serif text-sm md:text-base">
                            {found.name}
                          </p>
                        ) : (
                          <BphOpenSlot />
                        )}
                      </div>
                    </>
                  );
                })()}
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

              {(isRecruitment ||
                executives.some((e) =>
                  e.role.toLowerCase().includes("bendahara muda"),
                )) &&
                (() => {
                  const found = executives.find((e) =>
                    e.role.toLowerCase().includes("bendahara muda"),
                  );
                  const isReal =
                    found && !found.name.includes("[OPEN POSITION]");

                  if (!isReal && !isRecruitment) return null;

                  return (
                    <>
                      <div className="border-gold-500/35 h-6 w-px border-l border-dashed" />
                      <div className="border-gold-500/20 bg-gold-500/5 flex min-h-27.5 w-full flex-col justify-center border px-4 py-5 text-center md:px-6 md:py-6">
                        <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                          Bendahara Muda
                        </p>
                        {isReal ? (
                          <p className="text-gold-200 font-serif text-sm md:text-base">
                            {found.name}
                          </p>
                        ) : (
                          <BphOpenSlot />
                        )}
                      </div>
                    </>
                  );
                })()}
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
  showSlots = false,
}: {
  name: string;
  members: Array<string | { name: string; isKepala?: boolean }>;
  slots: number;
  openPositions: string[];
  angkatan?: string;
  showSlots?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const rotatingTextRef = useRef<RotatingTextRef | null>(null);

  const sortedMembers = useMemo(() => {
    const list = members.map((m) => {
      if (typeof m === "string") {
        return { name: m, isKepala: false };
      }
      return m;
    });
    return [...list].sort(
      (a, b) => (b.isKepala ? 1 : 0) - (a.isKepala ? 1 : 0),
    );
  }, [members]);

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
      className="border-gold-500/20 bg-gold-500/5 group hover:border-gold-500/50 hover:bg-gold-500/10 relative h-full cursor-default border p-6 text-center transition-colors duration-300"
    >
      <p className="text-gold-200 mb-3 font-serif text-base transition-colors duration-300 group-hover:text-white">
        {name}
      </p>
      {sortedMembers.length > 0 ? (
        <div className="text-gold-200/60 group-hover:text-gold-200/80 mb-3 space-y-2 text-sm transition-colors duration-300">
          {sortedMembers.map((m) => (
            <div
              key={m.name}
              className="flex flex-col items-center justify-center"
            >
              <span
                className={
                  m.isKepala
                    ? "text-gold-200 font-medium group-hover:text-white"
                    : ""
                }
              >
                {m.name}
              </span>
              {m.isKepala && (
                <span className="text-gold-500 mt-0.5 text-[9px] font-semibold tracking-[0.1em] uppercase">
                  Kepala Divisi
                </span>
              )}
            </div>
          ))}
        </div>
      ) : null}
      {showSlots && slots > 0 ? (
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
  fallbackDivisions,
  isRecruitment,
}: {
  executives: { role: string; name: string }[];
  divisions?: ProfilModularDivision[];
  fallbackDivisions: Division[];
  isRecruitment: boolean;
}) => {
  const divisions = fallbackDivisions.filter(
    (d) => !d.id.startsWith("co-") && (!isRecruitment || d.slots > 0),
  );

  const [emblaRef] = useEmblaCarousel({
    align: "start",
    loop: false,
    breakpoints: {
      "(min-width: 768px)": { active: false },
    },
  });

  const findNamesForDivision = (divisionName: string) => {
    const matches = executives.filter(
      (e) =>
        e.role.toLowerCase().includes(divisionName.toLowerCase()) ||
        divisionName.toLowerCase().includes(e.role.toLowerCase()),
    );
    return matches.map((m) => m.name);
  };

  const activeDivs =
    fetchedDivisions && fetchedDivisions.length > 0
      ? isRecruitment
        ? fetchedDivisions.filter((d) => d.slots > 0)
        : fetchedDivisions.filter((d) => d.members.length > 0)
      : [];

  const cardsToRender =
    activeDivs.length > 0
      ? activeDivs.map((division) => (
          <div
            key={division.name}
            className="h-full min-w-0 flex-[0_0_85%] md:w-full md:flex-none"
          >
            <DivisionCard
              name={division.name}
              members={division.members}
              slots={division.slots}
              openPositions={division.openPositions}
              showSlots={isRecruitment}
            />
          </div>
        ))
      : divisions.map((division) => {
          const names = findNamesForDivision(division.name);
          return (
            <div
              key={division.id}
              className="h-full min-w-0 flex-[0_0_85%] md:w-full md:flex-none"
            >
              <DivisionCard
                name={division.name}
                members={names}
                slots={division.slots}
                openPositions={[]}
                angkatan={(division as { angkatan?: string }).angkatan}
                showSlots={isRecruitment}
              />
            </div>
          );
        });

  return (
    <div className="embla w-full overflow-hidden" ref={emblaRef}>
      <div
        data-animate-stagger="0.1"
        className="flex gap-4 md:grid md:grid-cols-2"
        style={{ touchAction: "pan-y" }}
      >
        {cardsToRender}
      </div>
    </div>
  );
};
