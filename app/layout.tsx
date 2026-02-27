import "../index.css";

import { Fraunces } from "next/font/google";
import Script from "next/script";
import React from "react";

import CommandPalette from "../components/CommandPalette";
import Footer from "../components/Footer";
import LocatorInitializer from "../components/LocatorInitializer";
import Navigation from "../components/Navigation";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "HIMA Musik Official Portal",
  description:
    "Portal resmi Himpunan Mahasiswa Musik (HIMA MUSIK) Institut Seni Indonesia Yogyakarta. Informasi organisasi, acara, galeri, dan layanan mahasiswa.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body
        className={`${fraunces.variable} selection:bg-gold-300/30 selection:text-gold-500 flex min-h-screen flex-col bg-transparent font-sans text-neutral-200`}
      >
        <LocatorInitializer />
        <Script id="legacy-hash-route-redirect" strategy="beforeInteractive">
          {`(() => {
  const rawHash = window.location.hash.slice(1).trim();
  if (!rawHash) return;

  const hashPath = rawHash.startsWith('!') ? rawHash.slice(1) : rawHash;
  const normalizedPath = hashPath.startsWith('/') ? hashPath : '/' + hashPath;

  let parsed;
  try {
    parsed = new URL(normalizedPath, window.location.origin);
  } catch {
    return;
  }

  const target = parsed.pathname + parsed.search;
  const current = window.location.pathname + window.location.search;
  if (target !== current) {
    window.location.replace(target);
  }
})();`}
        </Script>
        <div className="fixed inset-0 z-1 bg-[#0a0a0a]" aria-hidden="true" />
        <Navigation />
        <CommandPalette />
        <main className="relative z-3 grow pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
