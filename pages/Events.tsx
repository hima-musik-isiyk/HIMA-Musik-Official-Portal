import React from 'react';
import { EventItem } from '../types';

const Events: React.FC = () => {
  const events: EventItem[] = [
    {
      id: '1',
      date: '15',
      month: 'MAR',
      title: 'Resital Komposisi: "Gema"',
      location: 'Auditorium Utama',
      time: '19:00 WIB',
      description: 'Pertunjukan karya orisinal mahasiswa semester akhir, mengeksplorasi batas antara musik tradisi dan kontemporer.'
    },
    {
      id: '2',
      date: '02',
      month: 'APR',
      title: 'Workshop: Music Business',
      location: 'Ruang Teori 3',
      time: '13:00 WIB',
      description: 'Membedah royalti digital dan manajemen artis bersama praktisi industri dari Jakarta.'
    },
    {
      id: '3',
      date: '20',
      month: 'APR',
      title: 'Soundscape City Project',
      location: 'Taman Kota',
      time: '08:00 WIB',
      description: 'Instalasi bunyi interaktif di ruang publik, kolaborasi dengan HIMA Arsitektur.'
    },
     {
      id: '4',
      date: '10',
      month: 'MEI',
      title: 'Annual Grand Concert',
      location: 'Concert Hall Besar',
      time: '18:30 WIB',
      description: 'Puncak acara tahunan HIMA MUSIK menampilkan orkestra mahasiswa.'
    }
  ];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-stone-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 pb-6 border-b border-stone-800">
           <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-2">Agenda</p>
              <h1 className="font-serif text-4xl md:text-6xl text-white">Kalender Acara</h1>
           </div>
           <p className="text-stone-600 text-sm mt-4 md:mt-0">Semester Genap 2024</p>
        </div>

        <div className="space-y-0">
          {events.map((event) => (
            <div key={event.id} className="group border-b border-stone-900 py-10 flex flex-col md:flex-row gap-8 hover:bg-stone-900/30 transition-colors px-4 -mx-4">
              
              <div className="flex flex-row md:flex-col items-baseline md:w-32 flex-shrink-0">
                <span className="text-4xl md:text-5xl font-serif text-stone-200 group-hover:text-white transition-colors">{event.date}</span>
                <span className="ml-3 md:ml-0 text-xs font-bold uppercase tracking-widest text-stone-600 mt-1">{event.month}</span>
              </div>

              <div className="flex-grow">
                <h3 className="text-2xl font-serif text-stone-300 group-hover:text-white transition-colors mb-2">{event.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed max-w-2xl">{event.description}</p>
                
                <div className="mt-6 flex gap-6 text-xs uppercase tracking-widest text-stone-600">
                  <span>{event.time}</span>
                  <span>&mdash;</span>
                  <span>{event.location}</span>
                </div>
              </div>

              <div className="hidden md:flex items-center justify-end w-32">
                 <button className="text-stone-500 text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity border border-stone-700 px-4 py-2 hover:bg-white hover:text-black">
                    Detail
                 </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
