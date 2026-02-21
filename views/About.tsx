import React from "react";

const About: React.FC = () => {
  const executives = [
    { role: "Ketua Himpunan", name: "Vincent Nuridzati Adittama" },
    { role: "Wakil Ketua", name: "Nadia Fibriani" },
    { role: "Sekretaris", name: "Nuzulul Dian Maulida" },
    { role: "Bendahara", name: "Elizabeth Ardhayu Maheswari" },
  ];

  return (
    <div className="pt-40 pb-32 px-6 min-h-screen bg-[#0a0a0a] relative">
      <div className="absolute top-0 right-0 w-1/2 h-screen bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-[1px] w-8 bg-gold-500/50"></div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500 font-medium">
            Profil Organisasi
          </p>
        </div>
        <h1 className="font-serif text-6xl md:text-8xl text-white mb-20 tracking-tight">
          Kabinet <span className="italic text-gold-500/80 font-light">2026</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24 mb-32">
          <div className="md:col-span-7 text-neutral-400 text-lg leading-relaxed font-light">
            <p className="mb-8 first-letter:text-7xl first-letter:font-serif first-letter:text-gold-500 first-letter:mr-3 first-letter:float-left">
              Himpunan Mahasiswa Musik (HIMA MUSIK) didirikan pada tahun 2015
              sebagai respons terhadap kebutuhan akan wadah kolektif bagi
              mahasiswa seni musik. Kami percaya bahwa musik bukan sekadar
              hiburan, melainkan disiplin intelektual yang membentuk budaya.
            </p>
            <p>
              Visi kami adalah menciptakan ekosistem akademik yang inklusif,
              progresif, dan berdaya saing global, di mana setiap mahasiswa
              memiliki ruang untuk mengekspresikan identitas artistik mereka.
            </p>
          </div>
          <div className="md:col-span-5 relative h-80 md:h-auto w-full bg-[#111] overflow-hidden group">
            <div className="absolute inset-0 bg-gold-500/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-700"></div>
            <img
              src="https://picsum.photos/600/800?grayscale"
              alt="Music Hall"
              className="object-cover w-full h-full opacity-70 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
            />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20"></div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-24 relative">
          <div className="absolute top-0 left-0 w-24 h-[1px] bg-gold-500/50"></div>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-16 tracking-tight">
            Struktur Kabinet <br />
            <span className="italic text-gold-500 text-3xl font-light">2026</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16">
            {executives.map((exec, idx) => (
              <div key={idx} className="group relative pl-6 border-l border-white/5 hover:border-gold-500/50 transition-colors duration-500">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-500 mb-4 group-hover:text-gold-600 transition-colors duration-500">
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
