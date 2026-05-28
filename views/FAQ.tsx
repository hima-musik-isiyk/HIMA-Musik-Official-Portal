"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import {
  IconChevronDown,
  IconExternalLink,
  IconPlus,
  IconSend,
} from "@/components/Icons";
import type { FAQEntry } from "@/lib/faq";
import useViewEntrance from "@/lib/useViewEntrance";

// Types
type FAQFormData = {
  askerName: string;
  category: string;
  question: string;
};

const STORAGE_KEY = "hima_faq_draft_v1";

// ------------------------------------------------------------------
// Custom Inline Thin-Stroke SVGs (Aligning with DESIGN_LANGUAGE.md)
// ------------------------------------------------------------------
const IconSearch: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconAlertCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconRefreshCw: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconHelpCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconChevronUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ObfuscatedMinecraftText: React.FC<{ text: string; enabled: boolean }> = ({
  text,
  enabled,
}) => {
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789§!@#$%^&*()_+-=[]{}|;':\",./<>?";
    const interval = setInterval(() => {
      let scrambled = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") {
          scrambled += " ";
        } else {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      setDisplayedText(scrambled);
    }, 80);

    return () => clearInterval(interval);
  }, [text, enabled]);

  if (enabled) {
    return (
      <span className="font-mono tracking-widest text-stone-500/80 blur-[1px] select-none">
        {displayedText}
      </span>
    );
  }
  return <>{text}</>;
};

const FAQStatusBadge: React.FC<{ status: FAQEntry["status"] }> = ({
  status,
}) => {
  switch (status) {
    case "Masuk":
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-blue-900/20 bg-blue-950/20 px-2.5 py-0.5 text-[9px] font-medium text-blue-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Masuk
        </span>
      );
    case "Ditinjau":
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-amber-900/20 bg-amber-950/20 px-2.5 py-0.5 text-[9px] font-medium text-amber-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          Ditinjau
        </span>
      );
    case "Disembunyikan":
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-purple-900/20 bg-purple-950/20 px-2.5 py-0.5 text-[9px] font-medium text-purple-400">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Disembunyikan
        </span>
      );
    case "Dialihkan":
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-cyan-900/20 bg-cyan-950/20 px-2.5 py-0.5 text-[9px] font-medium text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Dialihkan
        </span>
      );
    case "Dijawab":
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-900/20 bg-emerald-950/20 px-2.5 py-0.5 text-[9px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Dijawab
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-stone-900/20 bg-stone-950/20 px-2.5 py-0.5 text-[9px] font-medium text-stone-400">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
          {status}
        </span>
      );
  }
};

const PaginationControl: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="hover:border-stone-750 border border-white/5 bg-stone-900/30 px-3 py-1 text-[10px] tracking-wider text-stone-400 uppercase transition-all duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
        style={{ borderRadius: "var(--radius-action)" }}
      >
        Prev
      </button>
      <span className="font-mono text-[9px] tracking-widest text-stone-600 uppercase">
        {currentPage} / {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="hover:border-stone-750 border border-white/5 bg-stone-900/30 px-3 py-1 text-[10px] tracking-wider text-stone-400 uppercase transition-all duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
        style={{ borderRadius: "var(--radius-action)" }}
      >
        Next
      </button>
    </div>
  );
};

const FAQView: React.FC = () => {
  const scopeRef = useViewEntrance("/faq");

  // State Management
  const [faqs, setFaqs] = useState<FAQEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search, Filters & Row Expansion
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeStatusFilter, setActiveStatusFilter] = useState("Semua"); // "Semua", "Sudah Dijawab", "Belum Dijawab"
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false); // Collapsible Ask Form

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when queries change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, activeStatusFilter]);

  // Form State
  const [formData, setFormData] = useState<FAQFormData>({
    askerName: "",
    category: "Lainnya",
    question: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasTouchedForm, setHasTouchedForm] = useState(false);

  // Load FAQs from API
  const fetchFAQs = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/faq");
      if (!response.ok) {
        throw new Error("Gagal memuat data dari server");
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setFaqs(result.data);
      } else {
        throw new Error(result.error || "Data tidak valid");
      }
    } catch (err) {
      if (showLoading) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan koneksi",
        );
      }
    } finally {
      if (showLoading) setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Initial Fetch & Active Browser Polling (5 Seconds)
  useEffect(() => {
    fetchFAQs(true);

    const interval = setInterval(() => {
      fetchFAQs(false); // Background silent updates
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Form Auto-save
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData(parsed);
          setHasTouchedForm(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!hasTouchedForm || submitSuccess) return;
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch {}
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, hasTouchedForm, submitSuccess]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHasTouchedForm(true);
    if (submitError) setSubmitError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.askerName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/faq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: formData.question,
          askerName: formData.askerName,
          category: formData.category,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengirim pertanyaan");
      }

      setSubmitSuccess(true);
      setFormData({
        askerName: "",
        category: "Lainnya",
        question: "",
      });
      setHasTouchedForm(false);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}

      // Refresh list instantly
      fetchFAQs(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan server",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search and Filtering logic
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      // 1. Category Filter
      const matchesCategory =
        activeCategory === "Semua" || faq.categories.includes(activeCategory);

      // 2. Status Filter
      let matchesStatus = true;
      if (activeStatusFilter === "Sudah Dijawab") {
        matchesStatus = faq.status === "Dijawab" || faq.status === "Dialihkan";
      } else if (activeStatusFilter === "Belum Dijawab") {
        matchesStatus = faq.status === "Masuk" || faq.status === "Ditinjau";
      }

      // 3. Search Query Check
      const cleanQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !cleanQuery ||
        faq.question.toLowerCase().includes(cleanQuery) ||
        faq.answer.toLowerCase().includes(cleanQuery) ||
        faq.askerName.toLowerCase().includes(cleanQuery);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [faqs, searchQuery, activeCategory, activeStatusFilter]);

  // Paginated FAQ records
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const paginatedFaqs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFaqs.slice(start, start + itemsPerPage);
  }, [filteredFaqs, currentPage]);

  return (
    <div
      ref={scopeRef}
      className="relative flex-1 px-6 pt-24 pb-24 md:px-10 lg:px-16"
    >
      {/* Background Radial Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.015)_0%,transparent_60%)]" />

      {/* Breadcrumb & Live Sync Badge */}
      <div
        data-animate="up"
        className="mb-8 flex items-center justify-between gap-4 text-xs text-stone-500"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/sekretariat"
            className="hover:text-gold-400 transition-colors"
          >
            Pusat Administrasi
          </Link>
          <span>/</span>
          <span className="text-stone-300">FAQ & Tanya Jawab</span>
        </div>

        {/* Premium Pulsing Live Syncing Indicator */}
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-stone-900/30 px-3 py-1 font-mono text-[9px] tracking-wider text-stone-400 uppercase">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </span>
          <span>Live Sync</span>
          {isSyncing && (
            <IconRefreshCw className="text-gold-500/60 h-2.5 w-2.5 animate-spin" />
          )}
        </div>
      </div>

      {/* Header section */}
      <div className="mb-16 max-w-4xl">
        <div data-animate="up" className="mb-4 flex items-center gap-4">
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
            Q&A Impromptu Portal
          </span>
        </div>
        <h1
          data-animate="up"
          data-animate-delay="0.1"
          className="font-serif text-5xl leading-tight font-normal text-white md:text-7xl"
        >
          FAQ & <br />
          <span className="font-light text-stone-500 italic">Tanya Jawab</span>
        </h1>
        <p
          data-animate="up"
          data-animate-delay="0.2"
          className="mt-6 max-w-2xl text-base leading-relaxed text-stone-400"
        >
          Temukan jawaban instan untuk pertanyaan umum, atau ajukan pertanyaan
          baru secara real-time. Untuk FAQ Resmi HIMA, silakan kunjungi{" "}
          <Link
            href="/sekretariat/faq"
            className="text-gold-400 hover:text-gold-300 underline"
          >
            sekretariat/faq
          </Link>
          .
        </p>
      </div>

      {/* Control panel: Search & Filters */}
      <div
        data-animate="up"
        data-animate-delay="0.3"
        className="mb-8 border-b border-white/5 pb-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Live Search */}
          <div className="relative max-w-lg flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-stone-500">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari pertanyaan, jawaban, atau nama penanya..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-stone-850 focus:border-gold-500/50 focus:ring-gold-500/30 w-full border bg-stone-900/40 py-3.5 pr-4 pl-12 text-sm text-white placeholder-stone-500 transition-all duration-300 focus:bg-stone-900/80 focus:ring-1 focus:outline-none"
              style={{ borderRadius: "var(--radius-action)" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-4 flex items-center text-xs text-stone-500 hover:text-stone-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Collapsible Form Toggle & Status Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Dropdown / Segment */}
            <div className="flex items-center rounded-lg border border-white/5 bg-stone-900/20 p-1">
              {["Semua", "Sudah Dijawab", "Belum Dijawab"].map((st) => (
                <button
                  key={st}
                  onClick={() => setActiveStatusFilter(st)}
                  className={`rounded-md px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase transition-all duration-300 ${
                    activeStatusFilter === st
                      ? "bg-gold-500/20 text-gold-400 border-gold-500/30 border"
                      : "border border-transparent text-stone-500 hover:text-stone-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Collapsible Toggle Action */}
            <button
              onClick={() => {
                setIsFormOpen(!isFormOpen);
                setSubmitSuccess(false);
              }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                isFormOpen
                  ? "bg-gold-500/20 text-gold-400 border-gold-500/30 border"
                  : "hover:bg-gold-400 bg-white text-black hover:text-white"
              }`}
              style={{ borderRadius: "var(--radius-action)" }}
            >
              <span>Ajukan Tanya</span>
              <IconPlus
                className={`h-3 w-3 transition-transform duration-300 ${isFormOpen ? "rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Category filtering tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Semua",
            "Pendaftaran",
            "Kegiatan",
            "Organisasi",
            "Akademik",
            "Lainnya",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-[10px] tracking-wider transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-gold-500/25 text-gold-400 border-gold-500/30 border"
                  : "hover:border-stone-850 border border-white/5 bg-stone-900/10 text-stone-500 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div
        className={`grid gap-8 transition-all duration-500 ${isFormOpen ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
      >
        {/* LEFT / MAIN COLUMN: SPREADSHEET TABLE GRID */}
        <div
          className={`space-y-6 transition-all duration-500 ${isFormOpen ? "lg:col-span-2" : "col-span-1"}`}
        >
          {/* Loading state */}
          {isLoading && (
            <div className="border-stone-850 flex flex-col items-center justify-center border border-dashed bg-stone-950/10 py-24">
              <IconRefreshCw className="text-gold-500/60 mb-4 h-6 w-6 animate-spin" />
              <p className="font-mono text-[10px] tracking-widest text-stone-500 uppercase">
                Menghubungkan ke Notion...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-start gap-4 border border-red-500/10 bg-red-950/5 p-6">
              <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <h3 className="text-sm font-semibold text-red-300">
                  Gagal Memuat Data
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-red-400">
                  {error}
                </p>
                <button
                  onClick={() => fetchFAQs(true)}
                  className="text-gold-400 mt-4 text-xs font-semibold hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          )}

          {/* List display when ready */}
          {!isLoading && !error && (
            <>
              {filteredFaqs.length > 0 ? (
                <div>
                  {/* Desktop Tabular View (Spreadsheet layout) */}
                  <div className="hidden overflow-hidden border border-white/5 bg-black/20 backdrop-blur-md lg:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/2">
                          <th className="w-12 px-4 py-3.5 text-center font-mono text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                            No
                          </th>
                          <th className="px-4 py-3.5 text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                            Pertanyaan
                          </th>
                          <th className="w-32 px-4 py-3.5 text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                            Penanya
                          </th>
                          <th className="w-28 px-4 py-3.5 text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                            Kategori
                          </th>
                          <th className="w-28 px-4 py-3.5 text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                            Status
                          </th>
                          <th className="w-28 px-4 py-3.5 text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                            Tanggal
                          </th>
                          <th className="w-16 px-4 py-3.5 text-center font-mono text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {paginatedFaqs.map((faq, index) => {
                          const isExpanded = expandedFaqId === faq.id;
                          const itemNo =
                            (currentPage - 1) * itemsPerPage + index + 1;

                          return (
                            <React.Fragment key={faq.id}>
                              {/* Spreadsheet Row */}
                              <tr
                                onClick={() =>
                                  setExpandedFaqId(isExpanded ? null : faq.id)
                                }
                                className={`group hover:bg-gold-500/5 cursor-pointer transition-all duration-200 ${
                                  isExpanded ? "bg-gold-500/5" : ""
                                }`}
                              >
                                <td className="px-4 py-3.5 text-center font-mono text-xs text-stone-500">
                                  {itemNo}
                                </td>
                                <td className="max-w-sm truncate px-4 py-3.5 font-medium text-stone-200 group-hover:text-white">
                                  <ObfuscatedMinecraftText
                                    text={faq.question}
                                    enabled={faq.status === "Disembunyikan"}
                                  />
                                </td>
                                <td className="max-w-[120px] truncate px-4 py-3.5 text-xs text-stone-400">
                                  {faq.askerName}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="rounded-md border border-white/5 bg-stone-950 px-2 py-0.5 text-[9px] tracking-wider text-stone-500 uppercase">
                                    {faq.categories[0]}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <FAQStatusBadge status={faq.status} />
                                </td>
                                <td className="px-4 py-3.5 font-mono text-[10px] text-stone-500">
                                  {new Date(faq.createdAt).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-center text-stone-500 group-hover:text-white">
                                  {isExpanded ? (
                                    <IconChevronUp className="mx-auto h-4 w-4" />
                                  ) : (
                                    <IconChevronDown className="mx-auto h-4 w-4" />
                                  )}
                                </td>
                              </tr>

                              {/* Spreadsheet Row Expansion Detail */}
                              {isExpanded && (
                                <tr className="bg-stone-900/10">
                                  <td
                                    colSpan={7}
                                    className="bg-white/[0.01] px-6 py-5"
                                  >
                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-[9px] font-semibold tracking-widest text-stone-500 uppercase">
                                          Pertanyaan Lengkap
                                        </p>
                                        <p className="mt-1.5 text-sm leading-relaxed font-light text-stone-200">
                                          <ObfuscatedMinecraftText
                                            text={faq.question}
                                            enabled={
                                              faq.status === "Disembunyikan"
                                            }
                                          />
                                        </p>
                                      </div>

                                      <div className="border-t border-white/5 pt-4">
                                        <p className="text-[9px] font-semibold tracking-widest text-stone-500 uppercase">
                                          Jawaban
                                        </p>
                                        {faq.status === "Dialihkan" ? (
                                          <div className="mt-2 space-y-3">
                                            <p className="text-xs leading-relaxed text-stone-400">
                                              Jawaban dialihkan ke dokumen resmi
                                              sekretariat. Silakan klik tombol
                                              di bawah ini untuk membuka detail.
                                            </p>
                                            {faq.refUrl && (
                                              <a
                                                href={faq.refUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="border-stone-850 hover:border-gold-500/50 inline-flex items-center gap-2 border bg-stone-900 px-4 py-2 text-xs text-stone-300 transition-all hover:bg-stone-950 hover:text-white"
                                                style={{
                                                  borderRadius:
                                                    "var(--radius-action)",
                                                }}
                                              >
                                                <span>Buka Jawaban Resmi</span>
                                                <IconExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="mt-1.5 text-sm leading-relaxed font-light whitespace-pre-line text-stone-300">
                                            <ObfuscatedMinecraftText
                                              text={
                                                faq.answer ||
                                                "Sedang diproses / Belum dijawab oleh admin."
                                              }
                                              enabled={
                                                faq.status === "Disembunyikan"
                                              }
                                            />
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/5 pt-3.5 font-mono text-[9px] text-stone-500">
                                        <span>
                                          Oleh:{" "}
                                          <span className="font-sans text-stone-400">
                                            {faq.askerName}
                                          </span>
                                        </span>
                                        <span>
                                          Waktu Tanya:{" "}
                                          <span className="text-stone-400">
                                            {new Date(
                                              faq.createdAt,
                                            ).toLocaleDateString("id-ID", {
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </span>
                                        {faq.lastEditedAt && (
                                          <span>
                                            Update:{" "}
                                            <span className="text-stone-400">
                                              {new Date(
                                                faq.lastEditedAt,
                                              ).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                              })}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Compact Cards View */}
                  <div className="block space-y-4 lg:hidden">
                    {paginatedFaqs.map((faq, index) => {
                      const isExpanded = expandedFaqId === faq.id;
                      const itemNo =
                        (currentPage - 1) * itemsPerPage + index + 1;

                      return (
                        <div
                          key={faq.id}
                          onClick={() =>
                            setExpandedFaqId(isExpanded ? null : faq.id)
                          }
                          className={`border bg-black/10 p-4 transition-all duration-300 ${
                            isExpanded
                              ? "border-gold-500/30 bg-stone-900/10"
                              : "hover:border-stone-850 border-white/5"
                          }`}
                          style={{ borderRadius: "var(--radius-action)" }}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-stone-500">
                                #{itemNo}
                              </span>
                              <span className="rounded-md border border-white/5 bg-stone-950 px-2 py-0.5 text-[8px] tracking-wider text-stone-400 uppercase">
                                {faq.categories[0]}
                              </span>
                            </div>
                            <FAQStatusBadge status={faq.status} />
                          </div>

                          <h4 className="line-clamp-2 text-sm font-medium text-stone-200">
                            <ObfuscatedMinecraftText
                              text={faq.question}
                              enabled={faq.status === "Disembunyikan"}
                            />
                          </h4>

                          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 font-mono text-[9px] text-stone-500">
                            <span>
                              Oleh:{" "}
                              <span className="font-sans text-stone-400">
                                {faq.askerName}
                              </span>
                            </span>
                            <span>
                              {new Date(faq.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </span>
                          </div>

                          {/* Mobile Expansion */}
                          {isExpanded && (
                            <div className="mt-4 space-y-4 border-t border-white/5 pt-3 text-left">
                              <div>
                                <p className="text-[8px] font-semibold tracking-widest text-stone-500 uppercase">
                                  Pertanyaan Lengkap
                                </p>
                                <p className="mt-1 text-xs leading-relaxed font-light text-stone-200">
                                  <ObfuscatedMinecraftText
                                    text={faq.question}
                                    enabled={faq.status === "Disembunyikan"}
                                  />
                                </p>
                              </div>

                              <div>
                                <p className="text-[8px] font-semibold tracking-widest text-stone-500 uppercase">
                                  Jawaban
                                </p>
                                {faq.status === "Dialihkan" ? (
                                  <div className="mt-2 space-y-2">
                                    <p className="text-[11px] leading-relaxed font-light text-stone-400">
                                      Jawaban dialihkan ke dokumen resmi.
                                    </p>
                                    {faq.refUrl && (
                                      <a
                                        href={faq.refUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 border border-white/10 bg-stone-900 px-3 py-1.5 text-[10px] text-stone-300 transition-all hover:bg-stone-950 hover:text-white"
                                        style={{
                                          borderRadius: "var(--radius-action)",
                                        }}
                                      >
                                        <span>Buka Jawaban</span>
                                        <IconExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <p className="mt-1 text-xs leading-relaxed font-light whitespace-pre-line text-stone-300">
                                    <ObfuscatedMinecraftText
                                      text={
                                        faq.answer ||
                                        "Sedang diproses / Belum dijawab."
                                      }
                                      enabled={faq.status === "Disembunyikan"}
                                    />
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <PaginationControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              ) : (
                <div className="border-stone-850 border border-dashed py-16 text-center text-stone-600">
                  <IconHelpCircle className="mx-auto mb-3 h-8 w-8 opacity-30" />
                  <p className="text-xs italic">
                    Tidak ada FAQ yang cocok dengan filter Anda.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: COLLAPSIBLE QUESTION FORM */}
        {isFormOpen && (
          <div className="animate-fade col-span-1 space-y-6">
            <div className="border border-white/5 bg-stone-950/20 p-6 backdrop-blur-md md:p-8">
              <div className="via-gold-500/20 absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent to-transparent"></div>
              <h3 className="mb-2 font-serif text-xl text-white">
                Ajukan Pertanyaan
              </h3>
              <p className="mb-6 text-xs leading-relaxed text-stone-400">
                Punya pertanyaan seputar akademik, event, atau birokrasi HIMA?
                Tulis di bawah ini untuk respon cepat.
              </p>

              {submitSuccess ? (
                <div className="space-y-4 py-6 text-center">
                  <div className="bg-gold-500/10 border-gold-500/30 text-gold-400 mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full border">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-white">
                    Pertanyaan Terkirim!
                  </h4>
                  <p className="mx-auto max-w-xs text-xs leading-relaxed text-stone-400">
                    Pertanyaan Anda akan segera diproses oleh pengurus HIMA dan
                    tampil di queue spreadsheet secara real-time.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="text-gold-400 mt-6 text-xs font-semibold hover:underline"
                  >
                    Ajukan pertanyaan lagi
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Nama Input */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                      Nama Penanya
                    </label>
                    <input
                      type="text"
                      name="askerName"
                      required
                      disabled={isSubmitting}
                      value={formData.askerName}
                      onChange={handleFormChange}
                      placeholder="Contoh: Budi Santoso"
                      className="focus:border-gold-500 focus:ring-gold-500 w-full border-white/10 bg-stone-900/50 px-4 py-3 text-xs text-stone-200 transition-colors focus:bg-stone-900 focus:ring-1 focus:outline-none"
                      style={{ borderRadius: "var(--radius-action)" }}
                    />
                  </div>

                  {/* Kategori Input */}
                  <div className="group relative space-y-2">
                    <label className="group-focus-within:text-gold-300 block text-[10px] font-semibold tracking-wider text-stone-400 uppercase transition-colors duration-300">
                      Kategori Pertanyaan
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        disabled={isSubmitting}
                        value={formData.category}
                        onChange={handleFormChange}
                        className="focus:border-gold-500 w-full appearance-none border border-white/10 bg-stone-900/50 px-4 py-3 pr-10 text-xs text-stone-200 transition-colors focus:bg-stone-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ borderRadius: "var(--radius-action)" }}
                      >
                        <option
                          className="bg-[#111] text-neutral-300"
                          value="Pendaftaran"
                        >
                          Pendaftaran (Oprec)
                        </option>
                        <option
                          className="bg-[#111] text-neutral-300"
                          value="Kegiatan"
                        >
                          Kegiatan / Event
                        </option>
                        <option
                          className="bg-[#111] text-neutral-300"
                          value="Organisasi"
                        >
                          Organisasi (HIMA)
                        </option>
                        <option
                          className="bg-[#111] text-neutral-300"
                          value="Akademik"
                        >
                          Akademik
                        </option>
                        <option
                          className="bg-[#111] text-neutral-300"
                          value="Lainnya"
                        >
                          Lainnya
                        </option>
                      </select>
                      <div className="text-gold-500/60 group-focus-within:text-gold-300 pointer-events-none absolute top-0 right-0 bottom-0 flex items-center pr-4 transition-colors duration-300">
                        <IconChevronDown />
                      </div>
                    </div>
                  </div>

                  {/* Pertanyaan Input */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                      Isi Pertanyaan
                    </label>
                    <textarea
                      name="question"
                      required
                      disabled={isSubmitting}
                      value={formData.question}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder="Bagaimana prosedur peminjaman studio musik?"
                      className="focus:border-gold-500 focus:ring-gold-500 w-full resize-none border-white/10 bg-stone-900/50 px-4 py-3 text-xs text-stone-200 transition-colors focus:bg-stone-900 focus:ring-1 focus:outline-none"
                      style={{ borderRadius: "var(--radius-action)" }}
                    />
                  </div>

                  {/* Submit Error */}
                  {submitError && (
                    <div className="flex items-start gap-2 border border-red-500/10 bg-red-950/5 p-3 text-[11px] leading-relaxed text-red-400">
                      <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.question.trim() ||
                      !formData.askerName.trim()
                    }
                    className="hover:bg-gold-400 disabled:border-stone-850 flex w-full items-center justify-center gap-2 bg-white px-5 py-3.5 text-xs font-semibold text-black transition-all hover:text-white disabled:cursor-not-allowed disabled:bg-stone-900 disabled:text-stone-600"
                    style={{
                      transitionDuration: "300ms",
                      borderRadius: "var(--radius-action)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span>Mengirim...</span>
                        <IconRefreshCw className="h-3 w-3 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Kirim Pertanyaan</span>
                        <IconSend className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQView;
