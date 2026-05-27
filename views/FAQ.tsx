"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  HelpCircle,
  Layers,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import type { FAQEntry } from "@/lib/faq";
import useViewEntrance from "@/lib/useViewEntrance";

type FAQFormData = {
  askerName: string;
  category: string;
  question: string;
};

const STORAGE_KEY = "hima_faq_draft_v1";

const FAQView: React.FC = () => {
  const scopeRef = useViewEntrance("/sekretariat/faq");

  // State Management
  const [faqs, setFaqs] = useState<FAQEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

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
  const fetchFAQs = async () => {
    setIsLoading(true);
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
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
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

      // Refresh list to show submitted question in real-time
      fetchFAQs();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan server",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search and Category filtering logic
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      // 1. Category check
      const matchesCategory =
        activeCategory === "Semua" || faq.categories.includes(activeCategory);

      // 2. Search query check
      const cleanQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !cleanQuery ||
        faq.question.toLowerCase().includes(cleanQuery) ||
        faq.answer.toLowerCase().includes(cleanQuery) ||
        faq.askerName.toLowerCase().includes(cleanQuery);

      return matchesCategory && matchesSearch;
    });
  }, [faqs, searchQuery, activeCategory]);

  // Separate Answered vs Unanswered
  const { answeredFaqs, unansweredFaqs } = useMemo(() => {
    const answered = filteredFaqs.filter(
      (f) => f.status === "Dijawab" || f.status === "Dialihkan",
    );
    const unanswered = filteredFaqs.filter(
      (f) => f.status === "Masuk" || f.status === "Ditinjau",
    );
    return { answeredFaqs: answered, unansweredFaqs: unanswered };
  }, [filteredFaqs]);

  return (
    <div
      ref={scopeRef}
      className="relative flex-1 px-6 pt-24 pb-24 md:px-10 lg:px-16"
    >
      {/* Background Radial Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.02)_0%,transparent_60%)]" />

      {/* Breadcrumb & Navigation */}
      <div
        data-animate="up"
        className="mb-8 flex items-center gap-2 text-xs text-stone-500"
      >
        <Link
          href="/sekretariat"
          className="hover:text-gold-400 transition-colors"
        >
          Pusat Administrasi
        </Link>
        <span>/</span>
        <span className="text-stone-300">FAQ & Tanya Jawab</span>
      </div>

      {/* Header section */}
      <div className="mb-16 max-w-4xl">
        <div data-animate="up" className="mb-4 flex items-center gap-4">
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
            Administrasi Transparan
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
          Temukan jawaban instan untuk pertanyaan umum seputar administrasi HIMA
          Musik, atau tanyakan langsung hal baru. Pertanyaan publik akan tampil
          secara real-time.
        </p>
      </div>

      {/* Control panel: Search & Filters */}
      <div
        data-animate="up"
        data-animate-delay="0.3"
        className="mb-12 flex flex-col gap-6 border-b border-white/5 pb-8 lg:flex-row lg:items-center lg:justify-between"
      >
        {/* Live Search */}
        <div className="relative max-w-lg flex-1">
          <span className="absolute inset-y-0 left-4 flex items-center text-stone-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari pertanyaan, jawaban, atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-stone-850 focus:border-gold-500/50 focus:ring-gold-500/30 w-full rounded-xl border bg-stone-900/40 py-3.5 pr-4 pl-12 text-sm text-white placeholder-stone-500 transition-all duration-300 focus:bg-stone-900/80 focus:ring-1 focus:outline-none"
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

        {/* Category filtering tabs */}
        <div className="flex flex-wrap gap-2">
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
              className={`rounded-full px-5 py-2 text-xs tracking-wider transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-gold-500/20 text-gold-400 border-gold-500/30 border"
                  : "border border-white/5 bg-stone-900/30 text-stone-400 hover:border-stone-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left FAQs, Right Form */}
      <div className="grid gap-12 lg:grid-cols-3">
        {/* FAQ LISTS */}
        <div className="space-y-12 lg:col-span-2">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center border border-dashed border-stone-800 py-20">
              <RefreshCw className="text-gold-500/60 mb-4 h-8 w-8 animate-spin" />
              <p className="text-sm text-stone-500">
                Menghubungkan ke Notion...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-start gap-4 rounded-xl border border-red-500/20 bg-red-950/10 p-6">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <h3 className="text-sm font-semibold text-red-200">
                  Gagal Memuat FAQ
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-red-400">
                  {error}
                </p>
                <button
                  onClick={fetchFAQs}
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
              {/* Answered FAQ Accordions */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <CheckCircle2 className="text-gold-500/80 h-4 w-4" />
                  <h2 className="font-serif text-xl font-normal text-white">
                    FAQ Resmi & Jawaban
                  </h2>
                  <span className="rounded-full border border-white/5 bg-stone-900/80 px-2.5 py-0.5 text-[10px] text-stone-400">
                    {answeredFaqs.length}
                  </span>
                </div>

                {answeredFaqs.length > 0 ? (
                  <div className="space-y-4">
                    {answeredFaqs.map((faq) => {
                      const isExpanded = expandedFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className={`group border transition-all duration-300 ${
                            isExpanded
                              ? "border-gold-500/20 bg-stone-900/20"
                              : "border-white/5 hover:border-stone-800 hover:bg-stone-900/10"
                          }`}
                        >
                          {/* Accordion Trigger */}
                          <button
                            onClick={() =>
                              setExpandedFaqId(isExpanded ? null : faq.id)
                            }
                            className="flex w-full items-start justify-between gap-4 p-5 text-left"
                          >
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {faq.categories.map((c) => (
                                  <span
                                    key={c}
                                    className="rounded-md border border-white/5 bg-stone-950 px-2 py-0.5 text-[9px] tracking-wider text-stone-500 uppercase"
                                  >
                                    {c}
                                  </span>
                                ))}
                                {faq.source === "Hima" && (
                                  <span className="bg-gold-950/40 text-gold-400 border-gold-900/20 rounded-md border px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase">
                                    HIMA Official
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-medium text-stone-200 transition-colors group-hover:text-white md:text-base">
                                {faq.question}
                              </h3>
                              <p className="text-[10px] text-stone-600">
                                Ditanyakan oleh{" "}
                                <span className="text-stone-400">
                                  {faq.askerName}
                                </span>
                              </p>
                            </div>
                            <span className="mt-1 text-stone-500">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          </button>

                          {/* Accordion Content */}
                          {isExpanded && (
                            <div className="space-y-4 border-t border-white/5 bg-stone-950/20 px-5 py-5">
                              {faq.status === "Dialihkan" ? (
                                <div className="space-y-3">
                                  <p className="text-sm leading-relaxed font-light text-stone-400">
                                    Jawaban untuk pertanyaan ini dialihkan ke
                                    dokumen resmi sekretariat. Silakan klik
                                    tombol di bawah untuk melihat jawaban
                                    lengkap.
                                  </p>
                                  {faq.refUrl && (
                                    <a
                                      href={faq.refUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="border-stone-850 hover:border-gold-500/50 inline-flex items-center gap-2 rounded-xl border bg-stone-900 px-4 py-2.5 text-xs text-stone-300 transition-all hover:bg-stone-900/70 hover:text-white"
                                    >
                                      <span>Lihat Jawaban Resmi</span>
                                      <ExternalLink className="text-gold-500 h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed font-light whitespace-pre-line text-stone-300">
                                  {faq.answer ||
                                    "Belum ada teks jawaban resmi."}
                                </p>
                              )}

                              {/* Version Metadata */}
                              <div className="flex items-center gap-2 border-t border-white/5 pt-3 text-[9px] text-stone-600">
                                <span>Terakhir diperbarui:</span>
                                <span className="text-stone-500">
                                  {new Date(
                                    faq.lastEditedAt,
                                  ).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-stone-850 rounded-xl border border-dashed py-12 text-center text-stone-600">
                    <HelpCircle className="mx-auto mb-3 h-8 w-8 opacity-30" />
                    <p className="text-xs italic">
                      Tidak ada FAQ resmi yang cocok dengan filter Anda.
                    </p>
                  </div>
                )}
              </div>

              {/* Real-time Public Questions (Unanswered / In-Progress) */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <Clock className="h-4 w-4 animate-pulse text-amber-500/70" />
                  <h2 className="font-serif text-xl font-normal text-white">
                    Tanya Jawab Publik
                  </h2>
                  <span className="rounded-full border border-white/5 bg-stone-900/80 px-2.5 py-0.5 text-[10px] text-stone-400">
                    {unansweredFaqs.length}
                  </span>
                </div>

                {unansweredFaqs.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {unansweredFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="hover:border-stone-850 space-y-4 border border-white/5 bg-[#111]/30 p-5 transition-all duration-300 hover:bg-[#111]/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md border border-white/5 bg-stone-950 px-2 py-0.5 text-[8px] tracking-wider text-stone-500 uppercase">
                            {faq.categories[0]}
                          </span>
                          <span className="flex items-center gap-1.5 rounded-full border border-amber-900/20 bg-amber-950/20 px-2.5 py-0.5 text-[9px] font-medium text-amber-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                            Menunggu Jawaban
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed font-medium text-stone-300">
                          &ldquo;{faq.question}&rdquo;
                        </p>
                        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-stone-600">
                          <span>
                            Oleh:{" "}
                            <span className="text-stone-400">
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-stone-850 rounded-xl border border-dashed py-12 text-center text-stone-600">
                    <Layers className="mx-auto mb-3 h-8 w-8 opacity-30" />
                    <p className="text-xs italic">
                      Semua pertanyaan publik telah dijawab atau disinkronkan.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT SIDE: QUESTION FORM */}
        <div className="space-y-6">
          <div className="sticky top-24 border border-white/5 bg-[#111]/50 p-6 md:p-8">
            <div className="via-gold-500/20 absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent to-transparent"></div>
            <h3 className="mb-2 font-serif text-xl text-white">
              Ajukan Pertanyaan
            </h3>
            <p className="mb-6 text-xs leading-relaxed text-stone-400">
              Punya pertanyaan seputar sekretariat, recruitment, atau program
              HIMA? Tulis di bawah ini.
            </p>

            {submitSuccess ? (
              <div className="space-y-4 py-6 text-center">
                <div className="bg-gold-500/10 border-gold-500/30 text-gold-400 mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full border">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-medium text-white">
                  Pertanyaan Terkirim!
                </h4>
                <p className="mx-auto max-w-xs text-xs leading-relaxed text-stone-400">
                  Pertanyaan Anda akan langsung tampil di menu &quot;Tanya Jawab
                  Publik&quot; secara real-time. Admin kami akan menjawabnya
                  segera.
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
                  <label className="block text-xs font-semibold tracking-wider text-stone-400 uppercase">
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
                    className="focus:border-gold-500/50 w-full border border-white/10 bg-stone-900/50 px-4 py-3 text-xs text-stone-200 transition-colors focus:bg-stone-900 focus:outline-none"
                    style={{ borderRadius: "var(--radius-action)" }}
                  />
                </div>

                {/* Kategori Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold tracking-wider text-stone-400 uppercase">
                    Kategori Pertanyaan
                  </label>
                  <select
                    name="category"
                    disabled={isSubmitting}
                    value={formData.category}
                    onChange={handleFormChange}
                    className="focus:border-gold-500/50 w-full border border-white/10 bg-stone-900/50 px-4 py-3 text-xs text-stone-200 transition-colors focus:bg-stone-900 focus:outline-none"
                    style={{ borderRadius: "var(--radius-action)" }}
                  >
                    <option value="Pendaftaran">Pendaftaran (Oprec)</option>
                    <option value="Kegiatan">Kegiatan / Event</option>
                    <option value="Organisasi">Organisasi (HIMA)</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Pertanyaan Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold tracking-wider text-stone-400 uppercase">
                    Isi Pertanyaan
                  </label>
                  <textarea
                    name="question"
                    required
                    disabled={isSubmitting}
                    value={formData.question}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="Contoh: Bagaimana cara meminjam alat musik di sekretariat?"
                    className="focus:border-gold-500/50 w-full resize-none border border-white/10 bg-stone-900/50 px-4 py-3 text-xs text-stone-200 transition-colors focus:bg-stone-900 focus:outline-none"
                    style={{ borderRadius: "var(--radius-action)" }}
                  />
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/10 p-3 text-[11px] leading-relaxed text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
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
                  className="hover:bg-gold-400 disabled:border-stone-850 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-xs font-semibold text-black transition-all hover:text-white disabled:cursor-not-allowed disabled:bg-stone-900 disabled:text-stone-600"
                  style={{ transitionDuration: "300ms" }}
                >
                  {isSubmitting ? (
                    <>
                      <span>Mengirim...</span>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>Kirim Pertanyaan</span>
                      <Send className="h-3 w-3" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQView;
