import React from 'react';
import '../index.css';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-stone-950 text-stone-200 selection:bg-stone-700 selection:text-white flex flex-col">
        <Navigation />
        <main className="grow pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

