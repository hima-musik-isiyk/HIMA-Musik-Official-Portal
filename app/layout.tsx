import React from "react";
import Script from "next/script";
import "../index.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-stone-950 text-stone-200 selection:bg-stone-700 selection:text-white flex flex-col">
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
        <Navigation />
        <main className="grow pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
