import React from "react";
import Script from "next/script";
import { Fraunces } from "next/font/google";
import "../index.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body
        className={`${fraunces.variable} min-h-screen bg-transparent text-neutral-200 selection:bg-gold-300/30 selection:text-gold-500 flex flex-col font-sans`}
      >
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
        <div className="fixed inset-0 bg-[#0a0a0a] z-1" aria-hidden="true" />
        <Navigation />
        <main className="grow pt-20 relative z-3">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
