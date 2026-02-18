import React from 'react';
const Events: React.FC = () => {
  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-stone-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 pb-6 border-b border-stone-800">
           <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-2">Agenda</p>
              <h1 className="font-serif text-4xl md:text-6xl text-white">Kalender Acara</h1>
           </div>
           <p className="text-stone-600 text-sm mt-4 md:mt-0">Semester Genap 2026</p>
        </div>

        <div className="space-y-0">
          <div className="border border-dashed border-stone-800 rounded-lg py-10 px-6 text-center text-stone-500 text-sm tracking-widest uppercase">
            Konten kalender acara akan segera diisi
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
