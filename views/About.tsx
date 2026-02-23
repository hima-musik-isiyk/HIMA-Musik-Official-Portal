import React from "react";
import LightPillar from "../components/LightPillar";

const About: React.FC = () => {
  const executives = [
    { role: "Ketua Himpunan", name: "Vincent Nuridzati Adittama" },
    { role: "Wakil Ketua", name: "Nadia Fibriani" },
    { role: "Sekretaris", name: "Nuzulul Dian Maulida" },
    { role: "Bendahara", name: "Elizabeth Ardhayu Maheswari" },
  ];

  return (
    <div className="pt-40 pb-32 px-6 min-h-screen relative">
      <div className="absolute top-0 right-0 w-full h-screen bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px w-8 bg-gold-500/50"></div>
          <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-medium">
            Profil Organisasi
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24 mb-32">
          <div className="md:col-span-7 flex flex-col gap-12">
            <h1 className="font-serif text-6xl md:text-8xl text-white tracking-tight">
              Kabinet <span className="italic text-gold-500/80 font-light">2026</span>
            </h1>

            <div className="text-neutral-400 text-lg leading-relaxed font-light">
              <p className="mb-8 first-letter:text-7xl first-letter:font-serif first-letter:text-gold-500 first-letter:mr-3 first-letter:float-left">
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
          <div className="md:col-span-5 relative aspect-3/4 w-full bg-[#111] overflow-hidden group" aria-hidden="true">
            <div className="absolute inset-0 bg-gold-500/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-700"></div>
            <LightPillar
              topColor="#D4A64D"
              bottomColor="#0a0a0a"
              intensity={1.5}
              className="opacity-70 group-hover:opacity-100 transition-opacity duration-1000 ease-out"
            />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none"></div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-24 relative">
          <div className="absolute top-0 left-0 w-24 h-px bg-gold-500/50"></div>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-16 tracking-tight">
            Struktur Kabinet <br />
            <span className="italic text-gold-500 text-3xl font-light">2026</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16">
            {executives.map((exec, idx) => (
              <div key={idx} className="group relative pl-6 border-l border-white/5 hover:border-gold-300 transition-colors duration-500">
                <p className="text-xs uppercase tracking-[0.3em] text-gold-500 mb-4 group-hover:text-gold-300 transition-colors duration-500">
                  {exec.role}
                </p>
                <p className="font-serif text-xl text-neutral-300 group-hover:text-white transition-colors duration-500">
                  {exec.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
