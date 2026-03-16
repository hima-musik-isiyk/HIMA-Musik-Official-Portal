"use client";

import React, { useEffect, useRef, useState } from "react";

import LightPillar from "@/components/LightPillar";
import { divisions as allDivisions } from "@/lib/pendaftaran-data";
import useViewEntrance from "@/lib/useViewEntrance";

const About: React.FC = () => {
  const scopeRef = useViewEntrance("/about");
  const executives = [
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
              <span className="text-gold-500/80 font-light italic">2026</span>
            </h1>

            <div
              data-animate="up"
              data-animate-delay="0.25"
              className="text-lg leading-relaxed font-light text-neutral-400"
            >
              <p className="first-letter:text-gold-500 mb-8 first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl">
                Himpunan Mahasiswa Musik (HIMA MUSIK) adalah ruang kolektif
                mahasiswa musik di lingkungan ISI Yogyakarta yang berfokus pada
                pengembangan keilmuan, praktik artistik, dan solidaritas
                antarmahasiswa. Akar ekosistem musik kampus ini tidak lepas dari
                warisan Akademi Musik Indonesia (AMI) yang kemudian berproses
                dalam struktur ISI Yogyakarta.
              </p>
              <p>
                Dalam perjalanannya, bentuk organisasi mahasiswa musik dapat
                mengalami fase transisi, reorganisasi, dan pembaruan antar
                generasi. Karena itu, profil ini menempatkan HIMA MUSIK sebagai
                kelanjutan semangat kolaborasi mahasiswa musik: merawat tradisi,
                mendorong eksplorasi kontemporer, serta memperkuat kontribusi
                bagi ekosistem seni pertunjukan.
              </p>
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
              2026
            </span>
          </h2>

          <div className="mt-12">
            <h3 className="text-gold-500 mb-6 text-sm font-medium">
              Badan Pengurus Harian
            </h3>
          </div>

          <OrgChart executives={executives} />

          <div className="mt-12">
            <h3 className="text-gold-500 mb-6 text-sm font-medium">Divisi</h3>
            <DivisionCards executives={executives} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper components reused from PendaftaranLanding layout ---
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
              <div className="flex w-full flex-1 flex-col justify-center border border-white/8 bg-white/3 px-4 py-5 text-center md:min-h-25 md:px-6 md:py-6">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                  Sekretaris
                </p>
                <p className="font-serif text-sm leading-snug text-white md:text-base">
                  {findExec("sekretaris")}
                </p>
              </div>

              <div className="border-gold-500/35 h-6 w-px border-l border-dashed" />
              <div className="border-gold-500/20 bg-gold-500/5 flex min-h-27.5 w-full flex-1 flex-col justify-center border px-4 py-5 text-center md:px-6 md:py-6">
                <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Co-Sekretaris
                </p>
                <p className="text-gold-200 font-serif text-sm md:text-base">
                  {executives.find(
                    (e) =>
                      e.role.toLowerCase().includes("co-sekretaris") ||
                      e.role.toLowerCase().includes("co sekretaris"),
                  )?.name ?? "1 posisi terbuka"}
                </p>
              </div>
            </div>

            <div
              className="flex flex-1 flex-col items-center"
              ref={bendaharaBranchRef}
            >
              <div className="h-8 w-px bg-white/15" />
              <div className="w-full max-w-sm border border-white/8 bg-white/3 px-8 py-6 text-center">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                  Bendahara
                </p>
                <p className="font-serif text-lg text-white">
                  {findExec("bendahara")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DivisionCards = ({
  executives,
}: {
  executives: { role: string; name: string }[];
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

  return (
    <div
      data-animate-stagger="0.1"
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {divisions.map((division) => {
        const names = findNamesForDivision(division.name);
        return (
          <div
            key={division.id}
            data-animate="up"
            className="border-gold-500/20 bg-gold-500/5 border p-6 text-center"
          >
            <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
              Divisi
            </p>
            <p className="text-gold-200 mb-3 font-serif text-base">
              {division.name}
            </p>
            {names.length > 0 ? (
              <div className="text-gold-200/60 text-sm">
                {names.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
            ) : (
              <p className="text-gold-200/60 text-sm">
                {division.slots} posisi terbuka
              </p>
            )}
            <p className="mt-1.5 text-xs text-neutral-500">
              {(division as { angkatan?: string }).angkatan ?? ""}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default About;
