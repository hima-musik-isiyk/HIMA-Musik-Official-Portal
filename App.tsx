import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Events from "./pages/Events";
import Aduan from "./pages/Aduan";
import Gallery from "./pages/Gallery";
import { Page } from "./types";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);

  const pathToPage = (path: string): Page => {
    if (path === "/about") return Page.ABOUT;
    if (path === "/events") return Page.EVENTS;
    if (path === "/aduan") return Page.ADUAN;
    if (path === "/gallery") return Page.GALLERY;
    return Page.HOME;
  };

  const pageToPath = (page: Page): string => {
    if (page === Page.ABOUT) return "/about";
    if (page === Page.EVENTS) return "/events";
    if (page === Page.ADUAN) return "/aduan";
    if (page === Page.GALLERY) return "/gallery";
    return "/";
  };

  // Path-based router implementation
  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPage(pathToPage(window.location.pathname));
    };

    window.addEventListener("popstate", handlePathChange);
    handlePathChange(); // Check initial path

    return () => window.removeEventListener("popstate", handlePathChange);
  }, []);

  const setPage = (page: Page) => {
    const path = pageToPath(page);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return <Home />;
      case Page.ABOUT:
        return <About />;
      case Page.EVENTS:
        return <Events />;
      case Page.ADUAN:
        return <Aduan />;
      case Page.GALLERY:
        return <Gallery />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 selection:bg-stone-700 selection:text-white flex flex-col">
      <Navigation />
      <main className="grow">{renderPage()}</main>
      <Footer />
    </div>
  );
};

export default App;
