"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoHima from "./LogoHima";

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const currentPath = pathname ?? "/";

  const navItems = [
    { href: "/", label: "Beranda" },
    { href: "/about", label: "Tentang" },
    { href: "/events", label: "Acara" },
    { href: "/gallery", label: "Galeri" },
    { href: "/aduan", label: "Aduan" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link href="/" className="cursor-pointer">
          <LogoHima
            lineColor="white"
            glyphColor="var(--color-gold-500)"
            textColor="white"
            className="h-32 w-auto"
          />
        </Link>

        <div className="hidden md:flex space-x-14">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-500 relative group ${
                  isActive
                    ? "text-gold-500"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-px bg-gold-500 transition-all duration-500 ${
                    isActive
                      ? "w-full opacity-100"
                      : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        <button
          className="md:hidden text-[11px] uppercase tracking-widest text-neutral-400 hover:text-gold-600 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? "Tutup" : "Menu"}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-24 left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 p-8 flex flex-col space-y-8 animate-fade-in">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`text-left text-xs uppercase tracking-[0.25em] transition-all duration-300 ${
                  isActive
                    ? "text-gold-500 pl-4 border-l border-gold-500"
                    : "text-neutral-500 hover:text-white hover:pl-2"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
