"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import LightPillar from "@/components/LightPillar";
import RotatingText from "@/components/RotatingText";
import type {
  ProfilModularDivision,
  ProfilModularExecutive,
} from "@/lib/notion";
import { divisions as allDivisions } from "@/lib/pendaftaran-data";
import useViewEntrance from "@/lib/useViewEntrance";

interface AboutProps {
  paragraph?: string;
  cabinetName?: string;
  executives?: ProfilModularExecutive[];
  divisions?: ProfilModularDivision[];
}

const About: React.FC<AboutProps> = ({
  paragraph,
  cabinetName,
  executives: fetchedExecutives,
  divisions: fetchedDivisions,
}) => {
  const scopeRef = useViewEntrance("/profil");

  const [data, setData] = useState({
    paragraph: paragraph || "",
    cabinetName: cabinetName || "",
    executives: fetchedExecutives || [],
    divisions: fetchedDivisions || [],
  });

  useEffect(() => {
    // Try to load from localStorage cache first to bootstrap client-side SWR
    try {
      const cached = window.localStorage.getItem("hima_profil_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        setData((prev) => ({
          paragraph: prev.paragraph || parsed.paragraph || "",
          cabinetName: prev.cabinetName || parsed.cabinetName || "",
          executives:
            prev.executives && prev.executives.length > 0
              ? prev.executives
              : parsed.executives || [],
          divisions:
            prev.divisions && prev.divisions.length > 0
              ? prev.divisions
              : parsed.divisions || [],
        }));
      }
    } catch {}

    const fetchProfilData = async () => {
      try {
        const res = await fetch("/api/profil");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setData(result.data);
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

    const interval = setInterval(() => {
      fetchProfilData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  const displayCabinetName = data.cabinetName || "2026";

  const defaultParagraphs = [
    "Himpunan Mahasiswa Musik (HIMA MUSIK) adalah ruang kolektif mahasiswa musik di lingkungan ISI Yogyakarta yang berfokus pada pengembangan keilmuan, praktik artistik, dan solidaritas antarmahasiswa. Akar ekosistem musik kampus ini tidak lepas dari warisan Akademi Musik Indonesia (AMI) yang kemudian berproses dalam struktur ISI Yogyakarta.",
    "Dalam perjalanannya, bentuk organisasi mahasiswa musik dapat mengalami fase transisi, reorganisasi, dan pembaruan antar generasi. Karena itu, profil ini menempatkan HIMA MUSIK sebagai kelanjutan semangat kolaborasi mahasiswa musik: merawat tradisi, mendorong eksplorasi kontemporer, serta memperkuat kontribusi bagi ekosistem seni pertunjukan.",
  ];

  let displayParagraphs = defaultParagraphs;
  if (data.paragraph) {
    displayParagraphs = data.paragraph
      .split(/<br\s*\/?>|<br\s*\/?>\s*<br\s*\/?>|\n\n|\r\n\r\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  return (
    <div
      ref={scopeRef}
      className="relative min-h-screen overflow-x-hidden px-6 pt-40 pb-32"
    >
      <div className="pointer-events-none absolute inset-0 w-full bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)]"></div>
      <div className="relative z-10 mx-auto max-w-5xl">
        <div data-animate="up" className="mb-12 flex items-center gap-4">
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <p className="text-gold-500 text-sm font-medium">Profil Organisasi</p>
        </div>
        <div className="mb-32 grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-24">
          <div className="flex flex-col gap-12 md:col-span-7">
            <h1
              data-animate="up"
              data-animate-delay="0.1"
              className="font-serif text-6xl tracking-tight text-white md:text-8xl"
            >
              Kabinet{" "}
              <span className="text-gold-500/80 font-light italic">
                {displayCabinetName}
              </span>
            </h1>

            <div
              data-animate="up"
              data-animate-delay="0.25"
              className="text-lg leading-relaxed font-light text-neutral-400"
            >
              {displayParagraphs.map((p, idx) => {
                if (idx === 0) {
                  let text = p;
                  if (text.startsWith("impunan")) {
                    text = "H" + text;
                  }
                  return (
                    <p
                      key={idx}
                      className="first-letter:text-gold-500 mb-8 first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl"
                    >
                      {text}
                    </p>
                  );
                }
                return (
                  <p key={idx} className="mb-8">
                    {p}
                  </p>
                );
              })}
            </div>
          </div>
          <div
            data-animate="scale"
            data-animate-delay="0.3"
            className="group relative aspect-3/4 w-full overflow-hidden bg-[#111] md:col-span-5"
            aria-hidden="true"
          >
            <div className="bg-gold-500/10 absolute inset-0 z-10 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-0"></div>
            <LightPillar
              topColor="#D4A64D"
              bottomColor="#0a0a0a"
              intensity={1.5}
              className="opacity-70 transition-opacity duration-1000 ease-out group-hover:opacity-100"
            />
            <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-1/2 w-full bg-linear-to-t from-[#0a0a0a] to-transparent"></div>
          </div>
        </div>

        <div className="relative border-t border-white/5 pt-24">
          <div className="bg-gold-500/50 absolute top-0 left-0 h-px w-24" />
          <h2
            data-animate="up"
            className="mb-16 font-serif text-4xl tracking-tight text-white md:text-5xl"
          >
            Struktur Kabinet <br />
            <span className="text-gold-500 text-3xl font-light italic">
              {displayCabinetName}
            </span>
          </h2>

          <div className="mt-12">
            <h3 className="text-gold-500 mb-6 text-sm font-medium">
              Badan Pengurus Harian
            </h3>
          </div>

          <OrgChart executives={executivesList} />

          <div className="mt-12">
            <h3 className="text-gold-500 mb-6 text-sm font-medium">Divisi</h3>
            <DivisionCards
              executives={executivesList}
              divisions={data.divisions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper components reused from PendaftaranLanding layout ---

/** Renders a hoverable open-position badge for BPH muda slots */
const BphOpenSlot = () => {
  const [hovered, setHovered] = useState(false);
  const rtRef = useRef<any>(null);
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
      <div className="flex flex-col items-center">
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
  const rotatingTextRef = useRef<any>(null);

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
      className="border-gold-500/20 bg-gold-500/5 group hover:border-gold-500/50 hover:bg-gold-500/10 relative cursor-default border p-6 text-center transition-all duration-300"
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
            angkatan={(division as any).angkatan}
          />
        );
      })}
    </div>
  );
};

export default About;
