"use client";

import React, { useEffect, useState } from "react";

import { IconChevronDown } from "@/components/Icons";
import { cleanCmsValue } from "@/lib/cms-placeholders";

type AduanFormData = {
  name: string;
  nim: string;
  contact: string;
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

type AduanFormProps = {
  value1?: string; // Database ID Storage
  value2?: string; // Database ID Kategori
};

export const AduanForm: React.FC<AduanFormProps> = ({ value1, value2 }) => {
  const storageDatabaseId = cleanCmsValue(value1, ["Database ID Storage"]);
  const categoryDatabaseId = cleanCmsValue(value2, ["Database ID Kategori"]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const fallbackCategories = [
    { id: "Akademik", name: "Akademik" },
    { id: "Fasilitas", name: "Fasilitas Kampus" },
    { id: "Organisasi", name: "Internal Organisasi" },
    { id: "Lainnya", name: "Lainnya" },
  ];

  const activeCategoriesList =
    categories.length > 0 ? categories : fallbackCategories;

  const [formData, setFormData] = useState<AduanFormData>({
    name: "",
    nim: "",
    contact: "",
    category: "Akademik",
    message: "",
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceStatus, setEnhanceStatus] = useState<
    "idle" | "success" | "rate-limited" | "error"
  >("idle");
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
    if (!categoryDatabaseId) return;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const params = new URLSearchParams({ dbId: categoryDatabaseId });
        const res = await fetch(`/api/aduan-categories?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil kategori");
        const json = await res.json();
        if (json.success && Array.isArray(json.categories)) {
          setCategories(json.categories);
          setFormData((prev) => {
            const hasValidDynamic = json.categories.some(
              (c: { id: string }) => c.id === prev.category,
            );
            if (!hasValidDynamic && json.categories.length > 0) {
              return { ...prev, category: json.categories[0].id };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Failed to load aduan categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [categoryDatabaseId]);

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

      const isValidCategory =
        typeof data.category === "string" &&
        (data.category.length === 36 ||
          data.category.length === 32 ||
          ["Akademik", "Fasilitas", "Organisasi", "Lainnya"].includes(
            data.category,
          ));

      if (
        typeof data.name !== "string" ||
        typeof data.nim !== "string" ||
        typeof data.message !== "string" ||
        (data.contact !== undefined && typeof data.contact !== "string") ||
        !isValidCategory
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setFormData({
        name: data.name,
        nim: data.nim,
        contact: data.contact || "",
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
      contact: "",
      category: activeCategoriesList[0]?.id || "Akademik",
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
    const currentMessage = formData.message;
    setHasTouchedForm(true);
    setEnhanceStatus("idle");
    setIsEnhancing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch("/api/refine-aduan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: formData.message }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        setEnhanceStatus("rate-limited");
        setIsEnhancing(false);
        return;
      }
      if (!response.ok) {
        setEnhanceStatus("error");
        setIsEnhancing(false);
        return;
      }
      const data = (await response.json()) as { enhanced?: string };
      const nextMessage =
        typeof data.enhanced === "string" && data.enhanced.trim()
          ? data.enhanced
          : currentMessage;
      const wasChanged = nextMessage !== currentMessage;
      if (wasChanged) {
        setMessageHistory((prev) => {
          const next = [...prev, currentMessage];
          if (next.length > MAX_HISTORY_LENGTH) {
            next.shift();
          }
          return next;
        });
      }
      setFormData((prev) => ({ ...prev, message: nextMessage }));
      setEnhanceStatus(wasChanged ? "success" : "idle");
    } catch {
      clearTimeout(timeoutId);
      setEnhanceStatus("error");
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
    setEnhanceStatus("idle");
    setHasTouchedForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setAutoSaveStatus("saving");

    const selectedCat = activeCategoriesList.find(
      (c) => c.id === formData.category,
    );
    const categoryName = selectedCat ? selectedCat.name : formData.category;

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          categoryName,
          storageDbId: storageDatabaseId,
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
      } else if (errorMsg.includes("Discord")) {
        setSubmitError(
          "Gagal mengirim notifikasi. Coba lagi dalam beberapa saat.",
        );
      } else if (errorMsg.includes("Notion")) {
        setSubmitError(
          "Gagal mengarsipkan laporan ke Notion. Coba lagi dalam beberapa saat.",
        );
      } else {
        setSubmitError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative w-full py-12 text-center">
        <div className="mb-8 flex items-center justify-center gap-4">
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <p className="text-gold-500 text-sm font-medium">Status Laporan</p>
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
        </div>
        <h2 className="mb-6 font-serif text-4xl tracking-tight text-white md:text-5xl">
          Terima{" "}
          <span className="text-gold-500/80 font-light italic">Kasih</span>
        </h2>
        <p className="mx-auto mb-12 max-w-md leading-relaxed font-light text-neutral-400">
          Laporan Anda telah kami terima dan akan ditinjau oleh Divisi Advokasi.
          Privasi identitas Anda terjamin.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({
              name: "",
              nim: "",
              contact: "",
              category: activeCategoriesList[0]?.id || "Akademik",
              message: "",
            });
            setSubmitError(null);
            setMessageHistory([]);
            setHasTouchedForm(false);
          }}
          className="border-gold-500/30 hover:border-gold-300/60 hover:bg-gold-500/10 inline-flex items-center justify-center border bg-transparent px-6 py-3 text-sm font-medium text-white transition-colors"
          style={{ borderRadius: "var(--radius-action)" }}
        >
          Kirim laporan lain
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="aduan-form relative mx-auto w-full max-w-3xl space-y-10 border border-white/5 bg-[#111]/50 p-8 md:p-12"
        data-animate="up"
      >
        <div className="via-gold-500/20 absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent to-transparent"></div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="group relative">
            <label className="group-focus-within:text-gold-300 mb-3 block text-sm font-medium text-neutral-300 transition-colors duration-500">
              Nama (Opsional)
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: "var(--radius-action)" }}
              placeholder="Nama Lengkap (kosongkan jika anonim)"
            />
          </div>
          <div className="group relative">
            <label className="group-focus-within:text-gold-300 mb-3 block text-sm font-medium text-neutral-300 transition-colors duration-500">
              NIM (Opsional)
            </label>
            <input
              type="text"
              name="nim"
              value={formData.nim}
              onChange={handleChange}
              disabled={isSubmitting}
              className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: "var(--radius-action)" }}
              placeholder="NIM Anda (jika mahasiswa)"
            />
          </div>
        </div>

        <div className="group relative">
          <label className="group-focus-within:text-gold-300 mb-3 block text-sm font-medium text-neutral-300 transition-colors duration-500">
            Kontak Pengadu <span className="text-gold-500">*</span>
          </label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            disabled={isSubmitting}
            required
            className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "var(--radius-action)" }}
            placeholder="Nomor WA / Email / Media Sosial yang aktif"
          />
          <p className="mt-2 text-sm text-neutral-500">
            Data Anda kami jamin kerahasiaannya.
          </p>
        </div>

        <div className="group relative">
          <label className="group-focus-within:text-gold-300 mb-3 block text-sm font-medium text-neutral-300 transition-colors duration-500">
            Kategori <span className="text-gold-500">*</span>
          </label>
          <div className="relative">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting || categoriesLoading}
              required
              className="focus:border-gold-500 focus:ring-gold-500 w-full appearance-none border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: "var(--radius-action)" }}
            >
              {activeCategoriesList.map((cat) => (
                <option
                  key={cat.id}
                  className="bg-[#111] text-neutral-300"
                  value={cat.id}
                >
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="text-gold-500/60 group-focus-within:text-gold-300 pointer-events-none absolute top-0 right-0 bottom-0 flex items-center pr-4 transition-colors duration-300">
              <IconChevronDown />
            </div>
          </div>
        </div>

        <div className="group relative">
          <label className="group-focus-within:text-gold-300 mb-3 block text-sm font-medium text-neutral-300 transition-colors duration-500">
            Pesan <span className="text-gold-500">*</span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            disabled={isSubmitting}
            className="focus:border-gold-500 focus:ring-gold-500 w-full resize-none border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "var(--radius-action)" }}
            placeholder="Tuliskan keluhan atau saran anda disini..."
            required
          ></textarea>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-neutral-500">
              {formData.message.length} Karakter
            </span>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || !formData.message || isSubmitting}
                title="Rapikan tata bahasa dan format pesan menggunakan AI secara otomatis"
                className="text-gold-500/70 hover:text-gold-300 flex items-center gap-2 text-sm font-medium transition-colors duration-300 disabled:text-neutral-700"
              >
                {isEnhancing
                  ? "Sedang Memproses..."
                  : enhanceStatus === "success"
                    ? "Teks diperbarui"
                    : "Rapikan Tata Bahasa"}
              </button>
              {messageHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoEnhance}
                  disabled={isSubmitting}
                  className="border border-white/10 px-3 py-1.5 text-sm text-neutral-400 transition-colors duration-300 hover:border-white/30 hover:text-white disabled:border-white/10 disabled:text-neutral-700"
                  style={{ borderRadius: "var(--radius-action)" }}
                >
                  Undo
                </button>
              )}
            </div>
          </div>
          {enhanceStatus === "rate-limited" && (
            <p className="mt-2 text-sm text-amber-400/80">
              Terlalu cepat — tunggu beberapa detik sebelum mencoba lagi.
            </p>
          )}
          {enhanceStatus === "error" && (
            <p className="mt-2 text-sm text-red-400/80">
              Gagal memperbaiki teks. Silakan coba lagi.
            </p>
          )}
        </div>

        {(hasTouchedForm ||
          showRestoreNotice ||
          autoSaveStatus === "error") && (
          <div className="flex flex-col gap-4 border-t border-white/5 pt-4 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {autoSaveStatus === "saving" && (
                <span className="text-neutral-500">Menyimpan draf...</span>
              )}
              {autoSaveStatus === "saved" && lastSavedAt && (
                <span className="text-neutral-500">
                  Draf tersimpan di perangkat ini &bull; {lastSavedAt}
                </span>
              )}
              {autoSaveStatus === "error" && (
                <span className="text-red-400/80">
                  Gagal menyimpan draf. Periksa penyimpanan browser.
                </span>
              )}
            </div>
            <div className="flex min-w-fit items-center justify-between gap-4 md:justify-end">
              {showRestoreNotice && (
                <span className="text-gold-500/60">
                  Draf sebelumnya dipulihkan.
                </span>
              )}
              {hasTouchedForm && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isSubmitting}
                  className="min-w-fit border border-white/10 px-3 py-1.5 whitespace-nowrap text-neutral-400 transition-colors duration-300 hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-700"
                  style={{ borderRadius: "var(--radius-action)" }}
                >
                  Reset draf
                </button>
              )}
            </div>
          </div>
        )}

        <div className="pt-10 text-center">
          {submitError && (
            <div className="relative mb-8 overflow-hidden border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400/90">
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-900/50"></div>
              <div className="flex items-start gap-4">
                <span className="text-lg opacity-80">!</span>
                <div className="flex-1 text-left">
                  <p className="mb-1 font-medium tracking-wide">
                    Pengiriman Gagal
                  </p>
                  <p className="text-sm leading-relaxed font-light opacity-80">
                    {submitError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-sm text-red-400/60 transition-colors hover:text-red-400"
                >
                  X
                </button>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full md:w-auto"
          >
            {isSubmitting ? "Mengirim Laporan..." : "Kirim Laporan"}
          </button>
          {isSubmitting && (
            <p className="text-gold-500/60 mt-6 text-sm">
              Sedang memproses pengiriman laporan Anda...
            </p>
          )}
        </div>
      </form>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 px-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden border border-white/10 bg-[#111] p-8">
            <div className="via-gold-500/50 absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent to-transparent"></div>
            <h2 className="mb-4 font-serif text-2xl tracking-wide text-white">
              Reset draf?
            </h2>
            <p className="mb-10 text-sm leading-relaxed font-light text-neutral-400">
              Tindakan ini akan menghapus semua isi kotak aduan yang belum
              dikirim.
            </p>
            <div className="flex justify-end gap-4 text-sm font-medium">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="border border-white/10 px-6 py-3 text-neutral-400 transition-colors duration-300 hover:border-white/30 hover:text-white"
                style={{ borderRadius: "var(--radius-action)" }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="hover:bg-gold-300 bg-white px-6 py-3 text-black transition-colors duration-300 hover:text-white"
                style={{ borderRadius: "var(--radius-action)" }}
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
