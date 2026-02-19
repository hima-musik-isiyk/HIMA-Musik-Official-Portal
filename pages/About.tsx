import React from "react";

const About: React.FC = () => {
  const executives = [
    { role: "Ketua Himpunan", name: "Vincent Nuridzati Adittama" },
    { role: "Wakil Ketua", name: "Nadia Fibriani" },
    { role: "Sekretaris", name: "Nuzulul Dian Maulida" },
    { role: "Bendahara", name: "Elizabeth Ardhayu Maheswari" },
  ];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-stone-950">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-8">
          Profil Organisasi
        </p>
        <h1 className="font-serif text-5xl md:text-7xl text-white mb-12">
          Kabinet <span className="italic text-stone-500">2026/2027</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          <div className="text-stone-400 text-lg leading-relaxed font-light">
            <p className="mb-6">
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
          <div className="relative h-64 md:h-auto w-full bg-stone-900 overflow-hidden">
            <img
              src="https://picsum.photos/600/800?grayscale"
              alt="Music Hall"
              className="object-cover w-full h-full opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>

        <div className="border-t border-stone-800 pt-16">
          <h2 className="font-serif text-3xl text-white mb-10">
            Struktur Kabinet <br />
            <span className="italic text-stone-600 text-2xl">2026-2027</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
            {executives.map((exec, idx) => (
              <div key={idx} className="group">
                <p className="text-xs uppercase tracking-widest text-stone-600 mb-2 group-hover:text-stone-400 transition-colors">
                  {exec.role}
                </p>
                <p className="font-serif text-xl text-stone-300 group-hover:text-white transition-colors">
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
