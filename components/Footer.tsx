import React from 'react';
import { Page } from '../types';

interface FooterProps {
    setPage: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ setPage }) => {
  return (
    <footer className="bg-stone-950 border-t border-stone-800 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h3 className="font-serif text-3xl mb-6 text-white">HIMA MUSIK</h3>
          <p className="text-stone-500 text-sm leading-relaxed max-w-md">
            Wadah aspirasi dan kreasi mahasiswa musik. Membangun harmoni dalam keberagaman akademik dan artistik sejak 2015.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-300 mb-6">Navigasi</h4>
          <ul className="space-y-4 text-sm text-stone-500">
            <li><button onClick={() => setPage(Page.HOME)} className="hover:text-white transition-colors">Beranda</button></li>
            <li><button onClick={() => setPage(Page.ABOUT)} className="hover:text-white transition-colors">Tentang Kami</button></li>
            <li><button onClick={() => setPage(Page.EVENTS)} className="hover:text-white transition-colors">Jadwal Acara</button></li>
            <li><button onClick={() => setPage(Page.ADUAN)} className="hover:text-white transition-colors">Layanan Aduan</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-stone-300 mb-6">Kontak</h4>
          <ul className="space-y-4 text-sm text-stone-500">
            <li>Gedung Kesenian Lt. 3</li>
            <li>Universitas Negeri</li>
            <li>info@himamusik.id</li>
            <li>@himamusik</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-stone-900 flex flex-col md:flex-row justify-between items-center text-xs text-stone-600">
        <p>&copy; {new Date().getFullYear()} Himpunan Mahasiswa Musik.</p>
        <p className="mt-2 md:mt-0 tracking-widest uppercase">Estetika & Etika</p>
      </div>
    </footer>
  );
};

export default Footer;
