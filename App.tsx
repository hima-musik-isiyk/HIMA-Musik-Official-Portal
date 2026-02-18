import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Aduan from './pages/Aduan';
import Gallery from './pages/Gallery';
import { Page } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);

  // Simple hash router implementation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'about') setCurrentPage(Page.ABOUT);
      else if (hash === 'events') setCurrentPage(Page.EVENTS);
      else if (hash === 'aduan') setCurrentPage(Page.ADUAN);
      else if (hash === 'gallery') setCurrentPage(Page.GALLERY);
      else setCurrentPage(Page.HOME);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setPage = (page: Page) => {
    let hash = '';
    switch (page) {
      case Page.ABOUT: hash = 'about'; break;
      case Page.EVENTS: hash = 'events'; break;
      case Page.ADUAN: hash = 'aduan'; break;
      case Page.GALLERY: hash = 'gallery'; break;
      default: hash = '';
    }
    window.location.hash = hash;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME: return <Home setPage={setPage} />;
      case Page.ABOUT: return <About />;
      case Page.EVENTS: return <Events />;
      case Page.ADUAN: return <Aduan />;
      case Page.GALLERY: return <Gallery />;
      default: return <Home setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 selection:bg-stone-700 selection:text-white flex flex-col">
      <Navigation currentPage={currentPage} setPage={setPage} />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer setPage={setPage} />
    </div>
  );
};

export default App;
