import React from 'react';

const Gallery: React.FC = () => {
  // Using picsum with specific seeds to ensure consistency
  const items = [
    { id: 1, url: 'https://picsum.photos/seed/music1/800/600', span: 'col-span-1', title: 'Recital Hall' },
    { id: 2, url: 'https://picsum.photos/seed/music2/800/800', span: 'col-span-1 md:col-span-1 md:row-span-2', title: 'Strings Section' },
    { id: 3, url: 'https://picsum.photos/seed/music3/800/500', span: 'col-span-1', title: 'Jazz Night' },
    { id: 4, url: 'https://picsum.photos/seed/music4/800/1000', span: 'col-span-1 md:row-span-2', title: 'Conductor' },
    { id: 5, url: 'https://picsum.photos/seed/music5/800/600', span: 'col-span-1', title: 'Practice Room' },
    { id: 6, url: 'https://picsum.photos/seed/music6/800/600', span: 'col-span-1 md:col-span-2', title: 'Grand Orchestra 2023' },
  ];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-stone-950">
        <div className="max-w-7xl mx-auto">
             <div className="mb-16">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-2">Dokumentasi</p>
                <h1 className="font-serif text-4xl md:text-6xl text-white">Galeri Visual</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div key={item.id} className={`relative group overflow-hidden bg-stone-900 ${item.span} min-h-[300px]`}>
                        <img 
                            src={`${item.url}?grayscale`} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0 opacity-70 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-stone-950/40">
                            <span className="font-serif text-2xl text-white italic">{item.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Gallery;
