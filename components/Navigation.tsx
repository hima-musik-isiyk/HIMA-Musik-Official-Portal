import React, { useState } from 'react';
import { Page } from '../types';

interface NavigationProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, setPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: Page.HOME, label: 'Beranda' },
    { id: Page.ABOUT, label: 'Tentang' },
    { id: Page.EVENTS, label: 'Acara' },
    { id: Page.GALLERY, label: 'Galeri' },
    { id: Page.ADUAN, label: 'Aduan' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Brand */}
        <div 
          onClick={() => setPage(Page.HOME)}
          className="cursor-pointer font-serif text-2xl tracking-tighter hover:text-white transition-colors text-stone-300"
        >
          HIMA<span className="italic text-stone-500">MUSIK</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-12">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 ${
                currentPage === item.id 
                  ? 'text-white border-b border-white pb-1' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-xs uppercase tracking-widest text-stone-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-stone-950 border-b border-stone-800 p-6 flex flex-col space-y-6 animate-fade-in">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                setIsMenuOpen(false);
              }}
              className={`text-left text-sm uppercase tracking-[0.2em] ${
                currentPage === item.id ? 'text-white pl-4 border-l border-white' : 'text-stone-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
