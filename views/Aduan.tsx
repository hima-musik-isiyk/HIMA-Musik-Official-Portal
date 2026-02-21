"use client";

import React, { useState, useEffect } from "react";

type AduanFormData = {
  name: string;
  nim: string;
  category: string;
  message: string;
};

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type StoredAduanState = {
  data: AduanFormData;
  timestamp: number;
  messageHistory?: string[];
};

const STORAGE_KEY = "aduan_form_state_v1";
const MAX_HISTORY_LENGTH = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const Aduan: React.FC = () => {
  const [formData, setFormData] = useState<AduanFormData>({
    name: "",
    nim: "",
    category: "Akademik",
    message: "",
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showRestoreNotice, setShowRestoreNotice] = useState(false);
  const [hasTouchedForm, setHasTouchedForm] = useState(false);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoredAduanState | null;
      if (!parsed || typeof parsed !== "object") {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const { data, timestamp, messageHistory: savedHistory } = parsed;

      if (!data || typeof timestamp !== "number") {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (Date.now() - timestamp > DAY_IN_MS) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const validCategories = [
        "Akademik",
        "Fasilitas",
        "Organisasi",
        "Lainnya",
      ];
      const isValidCategory = validCategories.includes(data.category);

      if (
        typeof data.name !== "string" ||
        typeof data.nim !== "string" ||
        typeof data.message !== "string" ||
        !isValidCategory
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setFormData({
        name: data.name,
        nim: data.nim,
        category: data.category,
        message: data.message,
      });

      const cleanedHistory = Array.isArray(savedHistory)
        ? savedHistory
            .filter((entry) => typeof entry === "string")
            .slice(-MAX_HISTORY_LENGTH)
        : [];

      setMessageHistory(cleanedHistory);
      setShowRestoreNotice(true);
      setHasTouchedForm(true);
      setAutoSaveStatus("saved");
      setLastSavedAt(
        new Date(timestamp).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasTouchedForm || submitted) return;
    if (typeof window === "undefined") return;

    setAutoSaveStatus("saving");

    const timeoutId = window.setTimeout(() => {
      try {
        const payload: StoredAduanState = {
          data: formData,
          timestamp: Date.now(),
          messageHistory,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

        setAutoSaveStatus("saved");
        setLastSavedAt(
          new Date(payload.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } catch {
        setAutoSaveStatus("error");
      }
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [formData, messageHistory, hasTouchedForm, submitted]);

  useEffect(() => {
    if (!hasTouchedForm || submitted) return;
    if (typeof window === "undefined") return;

    const handleBeforeUnload = () => {
      try {
        const payload: StoredAduanState = {
          data: formData,
          timestamp: Date.now(),
          messageHistory,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData, messageHistory, hasTouchedForm, submitted]);

  const clearStoredState = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleResetDraft = () => {
    setFormData({
      name: "",
      nim: "",
      category: "Akademik",
      message: "",
    });
    setMessageHistory([]);
    setHasTouchedForm(false);
    setShowRestoreNotice(false);
    setAutoSaveStatus("idle");
    setLastSavedAt(null);
    clearStoredState();
    setShowResetConfirm(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setHasTouchedForm(true);
    if (submitError) setSubmitError(null);
  };

  const handleEnhance = async () => {
    if (!formData.message.trim()) return;
    setHasTouchedForm(true);
    setMessageHistory((prev) => {
      const next = [...prev, formData.message];
      if (next.length > MAX_HISTORY_LENGTH) {
        next.shift();
      }
      return next;
    });
    setIsEnhancing(true);
    try {
      const response = await fetch("/api/refine-aduan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: formData.message }),
      });
      if (!response.ok) {
        setIsEnhancing(false);
        return;
      }
      const data = (await response.json()) as { enhanced?: string };
      const nextMessage =
        typeof data.enhanced === "string" && data.enhanced.trim()
          ? data.enhanced
          : formData.message;
      setFormData((prev) => ({ ...prev, message: nextMessage }));
    } catch {
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoEnhance = () => {
    setMessageHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop() as string;
      setFormData((current) => ({ ...current, message: last }));
      return next;
    });
    setHasTouchedForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setAutoSaveStatus("saving");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          intent: "submit-aduan",
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        const errorMessage =
          typeof errorData === "object" && errorData && "error" in errorData
            ? String(errorData.error)
            : "Server error";
        console.error("API Error:", {
          status: response.status,
          error: errorMessage,
          details: errorData,
        });
        throw new Error(errorMessage);
      }

      setSubmitted(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
      setAutoSaveStatus("idle");
      setLastSavedAt(null);
      setMessageHistory([]);
      setHasTouchedForm(false);
      setShowRestoreNotice(false);
      clearStoredState();
    } catch (error) {
      console.error("Submission error:", error);
      setAutoSaveStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      if (
        errorMsg.includes("env variables") ||
        errorMsg.includes("misconfiguration")
      ) {
        setSubmitError(
          "Sistem belum dikonfigurasi dengan benar. Hubungi administrator.",
        );
      } else if (errorMsg.includes("Telegram")) {
        setSubmitError(
          "Gagal mengirim ke Telegram. Coba lagi dalam beberapa saat.",
        );
      } else if (errorMsg.includes("Message is required")) {
        setSubmitError("Pesan tidak boleh kosong.");
      } else {
        setSubmitError("Gagal mengirim laporan. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.05)_0%,transparent_50%)] pointer-events-none"></div>
        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-8 bg-gold-500/50"></div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500 font-medium">
              Status Laporan
            </p>
            <div className="h-px w-8 bg-gold-500/50"></div>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 tracking-tight">Terima <span className="italic text-gold-500/80 font-light">Kasih</span></h2>
          <p className="text-neutral-400 max-w-md mx-auto leading-relaxed font-light mb-12">
            Laporan Anda telah kami terima dan akan ditinjau oleh Divisi
            Advokasi. Privasi identitas Anda terjamin.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: "",
                nim: "",
                category: "Akademik",
                message: "",
              });
              setSubmitError(null);
              setMessageHistory([]);
              setHasTouchedForm(false);
            }}
            className="group relative px-8 py-4 bg-transparent border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:border-gold-600/50"
          >
            <span className="relative z-10 group-hover:text-gold-600 transition-colors duration-500">Kirim laporan lain</span>
            <div className="absolute inset-0 bg-gold-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-32 px-6 min-h-screen bg-[#0a0a0a] flex justify-center relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-screen bg-[radial-gradient(ellipse_at_top,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="w-full max-w-3xl relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-8 bg-gold-500/50"></div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500 font-medium text-center">
            Layanan Advokasi
          </p>
          <div className="h-px w-8 bg-gold-500/50"></div>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl text-white mb-6 text-center tracking-tight">
          Kotak <span className="italic text-gold-500/80 font-light">Aduan</span>
        </h1>
        <p className="text-neutral-500 text-center mb-20 text-sm font-light tracking-wide">
          Sampaikan aspirasi, kritik, atau saran dengan bijak.
        </p>

        <form onSubmit={handleSubmit} className="space-y-10 bg-[#111]/50 p-8 md:p-12 border border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gold-500/20 to-transparent"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="group relative">
              <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-600 transition-colors duration-500">
                Nama (Opsional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full bg-transparent border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed font-light"
                placeholder="Anonim"
              />
            </div>
            <div className="group relative">
              <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-600 transition-colors duration-500">
                NIM (Opsional)
              </label>
              <input
                type="text"
                name="nim"
                value={formData.nim}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full bg-transparent border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed font-light"
                placeholder="12345678"
              />
            </div>
          </div>

          <div className="group relative">
            <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-600 transition-colors duration-500">
              Kategori
            </label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full bg-transparent border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 appearance-none rounded-none disabled:opacity-50 disabled:cursor-not-allowed font-light"
              >
                <option className="bg-[#111] text-neutral-300" value="Akademik">
                  Akademik
                </option>
                <option className="bg-[#111] text-neutral-300" value="Fasilitas">
                  Fasilitas Kampus
                </option>
                <option className="bg-[#111] text-neutral-300" value="Organisasi">
                  Internal Organisasi
                </option>
                <option className="bg-[#111] text-neutral-300" value="Lainnya">
                  Lainnya
                </option>
              </select>
              <div className="absolute right-0 top-4 pointer-events-none text-[10px] text-gold-500/50 group-focus-within:text-gold-600 transition-colors duration-500">
                ▼
              </div>
            </div>
          </div>

          <div className="group relative">
            <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-600 transition-colors duration-500">
              Pesan
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              disabled={isSubmitting}
              className="w-full bg-black/20 border border-white/5 p-5 text-neutral-200 focus:outline-none focus:border-gold-500/30 transition-colors duration-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed font-light placeholder-neutral-700"
              placeholder="Tuliskan keluhan atau saran anda disini..."
              required
            ></textarea>

            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] text-neutral-600 uppercase tracking-[0.2em]">
                {formData.message.length} Karakter
              </span>
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !formData.message || isSubmitting}
                  className="text-[10px] uppercase tracking-[0.2em] text-gold-500/60 hover:text-gold-600 disabled:text-neutral-700 transition-colors duration-300 flex items-center gap-2"
                >
                  {isEnhancing
                    ? "Sedang Memproses..."
                    : "[ ✨ AI Refine Text ]"}
                </button>
                {messageHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoEnhance}
                    disabled={isSubmitting}
                    className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors duration-300 border-b border-transparent hover:border-neutral-500 disabled:text-neutral-700 disabled:border-transparent"
                  >
                    Undo AI
                  </button>
                )}
              </div>
            </div>
          </div>

          {(hasTouchedForm ||
            showRestoreNotice ||
            autoSaveStatus === "error") && (
            <div className="pt-4 border-t border-white/5 text-[10px] text-neutral-500 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-light">
              <div className="flex items-center gap-3">
                {autoSaveStatus === "saving" && (
                  <span className="tracking-[0.2em] uppercase">
                    Menyimpan draf...
                  </span>
                )}
                {autoSaveStatus === "saved" && lastSavedAt && (
                  <span className="tracking-[0.2em] uppercase">
                    Draf tersimpan otomatis • {lastSavedAt}
                  </span>
                )}
                {autoSaveStatus === "error" && (
                  <span className="tracking-[0.2em] uppercase text-red-400/80">
                    Gagal menyimpan draf. Periksa penyimpanan browser.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 justify-between md:justify-end">
                {showRestoreNotice && (
                  <span className="tracking-[0.2em] uppercase text-gold-500/50">
                    Draf sebelumnya dipulihkan.
                  </span>
                )}
                {hasTouchedForm && (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    disabled={isSubmitting}
                    className="uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors duration-300 border-b border-white/10 hover:border-white disabled:text-neutral-700 disabled:border-transparent disabled:cursor-not-allowed"
                  >
                    Reset draf
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="pt-10 text-center">
            {submitError && (
              <div className="mb-8 p-5 bg-red-950/20 border border-red-900/50 text-red-400/90 text-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-900/50"></div>
                <div className="flex items-start gap-4">
                  <span className="text-lg opacity-80">⚠️</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium mb-1 tracking-wide">Pengiriman Gagal</p>
                    <p className="text-xs leading-relaxed font-light opacity-80">{submitError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative px-12 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-gold-600 hover:text-white w-full md:w-auto disabled:bg-[#222] disabled:text-neutral-600 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">{isSubmitting ? "Mengirim Laporan..." : "Kirim Laporan"}</span>
              {!isSubmitting && <div className="absolute inset-0 bg-gold-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>}
            </button>
            {isSubmitting && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500/60 mt-6 font-light">
                Sedang memproses pengiriman laporan Anda...
              </p>
            )}
          </div>
        </form>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm px-6">
          <div className="w-full max-w-md bg-[#111] border border-white/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gold-500/50 to-transparent"></div>
            <h2 className="font-serif text-2xl text-white mb-4 tracking-wide">Reset draf?</h2>
            <p className="text-sm text-neutral-400 mb-10 leading-relaxed font-light">
              Tindakan ini akan menghapus semua isi kotak aduan yang belum
              dikirim.
            </p>
            <div className="flex justify-end gap-4 text-[10px] uppercase tracking-[0.2em] font-medium">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-6 py-3 text-neutral-400 hover:text-white border border-white/10 hover:border-white/30 transition-colors duration-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="px-6 py-3 bg-white text-black hover:bg-gold-600 hover:text-white transition-colors duration-300"
              >
                Ya, reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Aduan;
