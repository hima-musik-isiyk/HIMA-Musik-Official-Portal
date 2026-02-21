import React from "react";

const Gallery: React.FC = () => {
  return (
    <div className="pt-40 pb-32 px-6 min-h-screen bg-[#0a0a0a] relative">
      <div className="absolute top-0 right-0 w-1/2 h-screen bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 pb-10 border-b border-white/5 relative">
          <div className="absolute bottom-0 left-0 w-32 h-px bg-gold-500/50"></div>
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-8 bg-gold-500/50"></div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500 font-medium">
                Dokumentasi
              </p>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl text-white tracking-tight">
              Galeri <span className="italic text-gold-500/80 font-light">Visual</span>
            </h1>
          </div>
          <p className="text-neutral-500 text-sm mt-8 md:mt-0 font-light tracking-widest uppercase">
            Arsip Kegiatan
          </p>
        </div>

        <div className="space-y-0">
          <div className="border border-white/5 bg-white/1 rounded-none py-24 px-6 text-center text-neutral-500 text-[11px] tracking-[0.3em] uppercase relative overflow-hidden group hover:border-gold-500/30 transition-colors duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.05)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <span className="relative z-10">Konten galeri visual akan segera diisi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
