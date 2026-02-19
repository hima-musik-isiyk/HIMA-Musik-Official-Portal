'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const currentPath = pathname ?? '/';

  const navItems = [
    { href: '/', label: 'Beranda' },
    { href: '/about', label: 'Tentang' },
    { href: '/events', label: 'Acara' },
    { href: '/gallery', label: 'Galeri' },
    { href: '/aduan', label: 'Aduan' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="cursor-pointer font-serif text-2xl tracking-tighter hover:text-white transition-colors text-stone-300"
        >
          HIMA<span className="italic text-stone-500">MUSIK</span>
        </Link>

        <div className="hidden md:flex space-x-12">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 ${
                (item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href))
                  ? 'text-white border-b border-white pb-1' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button 
          className="md:hidden text-xs uppercase tracking-widest text-stone-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-stone-950 border-b border-stone-800 p-6 flex flex-col space-y-6 animate-fade-in">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`text-left text-sm uppercase tracking-[0.2em] ${
                (item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href))
                  ? 'text-white pl-4 border-l border-white'
                  : 'text-stone-500'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
