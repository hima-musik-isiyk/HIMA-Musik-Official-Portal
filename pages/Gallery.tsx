import React from 'react';

const Gallery: React.FC = () => {
  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-stone-950">
        <div className="max-w-7xl mx-auto">
             <div className="mb-16">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-2">Dokumentasi</p>
                <h1 className="font-serif text-4xl md:text-6xl text-white">Galeri Visual</h1>
            </div>
            <div className="border border-dashed border-stone-800 rounded-lg py-16 px-6 text-center text-stone-500 text-sm tracking-widest uppercase">
              Konten galeri visual akan segera diisi
            </div>
        </div>
    </div>
  );
};

export default Gallery;
