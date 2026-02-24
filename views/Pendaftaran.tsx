"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { divisions } from "@/lib/pendaftaran-data";

type RecruitmentFormData = {
  firstChoice: string;
  secondChoice: string;
  angkatan: string;
  pddSubfocus: string;
  fullName: string;
  nim: string;
  email: string;
  phone: string;
  instagram: string;
  motivation: string;
  experience: string;
  availability: string[];
  portfolio: string;
};

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type StoredRecruitmentState = {
  data: RecruitmentFormData;
  timestamp: number;
  step: number;
};

const STORAGE_KEY = "pendaftaran_form_state_v1";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const steps = [
  { id: 0, label: "Posisi" },
  { id: 1, label: "Data Diri" },
  { id: 2, label: "Motivasi" },
  { id: 3, label: "Review" },
];

const availabilityOptions = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const MIN_MOTIVATION_CHARS = 100;
const MAX_MOTIVATION_CHARS = 1500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIM_PATTERN = /^\d{10,12}$/;
const PHONE_PATTERN = /^(?:\+62|62|0)8\d{7,11}$/;

const Pendaftaran: React.FC = () => {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
  const [formData, setFormData] = useState<RecruitmentFormData>({
    firstChoice: "",
    secondChoice: "",
    angkatan: "",
    pddSubfocus: "",
    fullName: "",
    nim: "",
    email: "",
    phone: "",
    instagram: "",
    motivation: "",
    experience: "",
    availability: [],
    portfolio: "",
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showRestoreNotice, setShowRestoreNotice] = useState(false);
  const [hasTouchedForm, setHasTouchedForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showStepErrors, setShowStepErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const stepBarRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollOnStepChangeRef = useRef(false);
  const formContainerRef = useRef<HTMLFormElement | null>(null);
  const isPddSelected =
    formData.firstChoice === "pdd" || formData.secondChoice === "pdd";

  const currentDivision = divisions.find((division) => division.id === formData.firstChoice);
  const trimmedFullName = formData.fullName.trim();
  const trimmedNim = formData.nim.trim();
  const trimmedEmail = formData.email.trim();
  const trimmedPhone = formData.phone.trim();
  const cleanPhone = trimmedPhone.replace(/\D/g, "");
  const trimmedMotivation = formData.motivation.trim();
  const motivationLength = trimmedMotivation.length;
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail);
  const isNimValid = NIM_PATTERN.test(trimmedNim);
  const isPhoneValid = PHONE_PATTERN.test(cleanPhone);
  const isMotivationValid =
    motivationLength >= MIN_MOTIVATION_CHARS &&
    motivationLength <= MAX_MOTIVATION_CHARS;
  const fullNameError = !trimmedFullName ? "Nama lengkap wajib diisi." : "";
  const nimError = !trimmedNim
    ? "NIM wajib diisi."
    : !isNimValid
      ? "NIM harus 10–12 digit angka."
      : "";
  const emailError = !trimmedEmail
    ? "Email wajib diisi."
    : !isEmailValid
      ? "Format email tidak valid."
      : "";
  const phoneError = !trimmedPhone
    ? "Nomor WhatsApp wajib diisi."
    : !isPhoneValid
      ? "Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx."
      : "";
  const motivationError = !trimmedMotivation
    ? "Motivasi wajib diisi."
    : motivationLength < MIN_MOTIVATION_CHARS
      ? `Minimal ${MIN_MOTIVATION_CHARS} karakter.`
      : motivationLength > MAX_MOTIVATION_CHARS
        ? `Maksimal ${MAX_MOTIVATION_CHARS} karakter.`
        : "";

  const isAngkatanRestricted =
    (formData.firstChoice === "co-sekretaris" || formData.firstChoice === "co-bendahara") &&
    formData.angkatan === "2023";
  const angkatanError = !formData.angkatan
    ? "Angkatan wajib dipilih."
    : isAngkatanRestricted
      ? "Posisi ini hanya tersedia untuk angkatan 2024\u20132025."
      : "";

  const isStepComplete = (stepId: number): boolean => {
    if (stepId === 0) {
      return Boolean(formData.firstChoice && formData.angkatan && !isAngkatanRestricted);
    }
    if (stepId === 1) {
      return Boolean(
        trimmedFullName &&
          isNimValid &&
          isEmailValid &&
          isPhoneValid,
      );
    }
    if (stepId === 2) {
      return Boolean(isMotivationValid && formData.availability.length > 0);
    }
    return false;
  };

  const isStepValid =
    step === 3
      ? isStepComplete(0) && isStepComplete(1) && isStepComplete(2)
      : isStepComplete(step);

  const hasEditedCurrentStep: boolean = ((): boolean => {
    if (step === 0) {
      return Boolean(formData.firstChoice || formData.angkatan);
    }
    if (step === 1) {
      return Boolean(
        formData.fullName.trim() ||
          formData.nim.trim() ||
          formData.email.trim() ||
          formData.phone.trim(),
      );
    }
    if (step === 2) {
      return Boolean(formData.motivation.trim() || formData.availability.length > 0);
    }
    return false;
  })();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoredRecruitmentState | null;
      if (!parsed || typeof parsed !== "object") {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const { data, timestamp, step: storedStep } = parsed;

      if (!data || typeof timestamp !== "number") {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (Date.now() - timestamp > DAY_IN_MS) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const stringFields: (keyof RecruitmentFormData)[] = [
        "firstChoice",
        "secondChoice",
        "angkatan",
        "pddSubfocus",
        "fullName",
        "nim",
        "email",
        "phone",
        "instagram",
        "motivation",
        "experience",
        "portfolio",
      ];

      const isValidStrings = stringFields.every(
        (field) => typeof data[field] === "string",
      );

      const isValidAvailability =
        Array.isArray(data.availability) &&
        data.availability.every((value) => typeof value === "string");

      if (!isValidStrings || !isValidAvailability) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      let nextStep = 0;
      if (typeof storedStep === "number" && Number.isInteger(storedStep)) {
        const maxIndex = steps.length - 1;
        if (storedStep >= 0 && storedStep <= maxIndex) {
          nextStep = storedStep;
        }
      }

      setFormData({
        firstChoice: data.firstChoice,
        secondChoice: data.secondChoice,
        angkatan: data.angkatan || "",
        pddSubfocus: data.pddSubfocus || "",
        fullName: data.fullName,
        nim: data.nim,
        email: data.email,
        phone: data.phone,
        instagram: data.instagram,
        motivation: data.motivation,
        experience: data.experience,
        availability: data.availability,
        portfolio: data.portfolio,
      });

      setStep(nextStep);
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
    if (!shouldScrollOnStepChangeRef.current) return;
    shouldScrollOnStepChangeRef.current = false;
    if (typeof window === "undefined") return;
    const node = stepBarRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const rect = node.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const offset = window.innerWidth < 768 ? 100 : 140;
        window.scrollTo({
          top: absoluteTop - offset,
          behavior: "smooth",
        });
      }, 50);
    });
  }, [step]);

  useEffect(() => {
    if (!hasTouchedForm || submitted) return;
    if (typeof window === "undefined") return;

    setAutoSaveStatus("saving");

    const timeoutId = window.setTimeout(() => {
      try {
        const payload: StoredRecruitmentState = {
          data: formData,
          timestamp: Date.now(),
          step,
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
  }, [formData, hasTouchedForm, submitted, step]);

  useEffect(() => {
    if (!hasTouchedForm || submitted) return;
    if (typeof window === "undefined") return;

    const handleBeforeUnload = () => {
      try {
        const payload: StoredRecruitmentState = {
          data: formData,
          timestamp: Date.now(),
          step,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData, hasTouchedForm, submitted, step]);

  const clearStoredState = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleResetDraft = () => {
    setFormData({
      firstChoice: "",
      secondChoice: "",
      angkatan: "",
      pddSubfocus: "",
      fullName: "",
      nim: "",
      email: "",
      phone: "",
      instagram: "",
      motivation: "",
      experience: "",
      availability: [],
      portfolio: "",
    });
    setStep(0);
    setHasTouchedForm(false);
    setShowRestoreNotice(false);
    setAutoSaveStatus("idle");
    setLastSavedAt(null);
    clearStoredState();
    setShowResetConfirm(false);
  };

  const handleFirstChoiceChange = (divisionId: string) => {
    setFormData((prev) => ({
      ...prev,
      firstChoice: divisionId,
      secondChoice: prev.secondChoice === divisionId ? "" : prev.secondChoice,
      pddSubfocus:
        divisionId === "pdd" || prev.secondChoice === "pdd"
          ? prev.pddSubfocus
          : "",
    }));
    setHasTouchedForm(true);
  };

  const handleSecondChoiceChange = (divisionId: string) => {
    setFormData((prev) => ({
      ...prev,
      secondChoice: divisionId,
      pddSubfocus:
        prev.firstChoice === "pdd" || divisionId === "pdd"
          ? prev.pddSubfocus
          : "",
    }));
    setHasTouchedForm(true);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasTouchedForm(true);
  };

  const toggleAvailability = (value: string) => {
    setFormData((prev) => {
      const isActive = prev.availability.includes(value);
      const availability = isActive
        ? prev.availability.filter((item) => item !== value)
        : [...prev.availability, value];
      return { ...prev, availability };
    });
    setHasTouchedForm(true);
  };

  const scrollToFirstError = () => {
    if (!formContainerRef.current) return;
    requestAnimationFrame(() => {
      const firstError = formContainerRef.current?.querySelector(
        "[data-error='true']",
      );
      if (firstError) {
        const rect = firstError.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const offset = window.innerWidth < 768 ? 120 : 160;
        window.scrollTo({
          top: absoluteTop - offset,
          behavior: "smooth",
        });
      }
    });
  };

  const handleNextWithValidation = (
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!isStepComplete(step)) {
      setShowStepErrors(true);
      setTimeout(scrollToFirstError, 50);
      return;
    }
    setShowStepErrors(false);
    shouldScrollOnStepChangeRef.current = true;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setShowStepErrors(false);
    shouldScrollOnStepChangeRef.current = true;
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (step < steps.length - 1) {
      handleNextWithValidation();
      return;
    }

    if (!isStepValid) return;

    if (step !== steps.length - 1) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      intent: "submit-pendaftaran",
      data: {
        firstChoice: formData.firstChoice,
        secondChoice: formData.secondChoice,
        angkatan: formData.angkatan,
        pddSubfocus: isPddSelected ? formData.pddSubfocus : "",
        fullName: trimmedFullName,
        nim: trimmedNim,
        email: trimmedEmail,
        phone: cleanPhone,
        instagram: formData.instagram.trim(),
        motivation: trimmedMotivation,
        experience: formData.experience.trim(),
        availability: formData.availability,
        portfolio: formData.portfolio.trim(),
        submittedAt: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Gagal mengirim bukti pendaftaran. Coba lagi sebentar lagi.";
        try {
          const body = await response.json();
          if (body && typeof body.error === "string" && body.error.trim()) {
            message = body.error;
          }
        } catch {
        }
        setSubmitError(message);
        setIsSubmitting(false);
        return;
      }

      const submittedTime = new Date();
      setSubmittedAt(submittedTime);
      setSubmitted(true);
      setAutoSaveStatus("idle");
      setHasTouchedForm(false);
      setShowRestoreNotice(false);
      setLastSavedAt(null);
      clearStoredState();
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    } catch {
      setSubmitError(
        "Terjadi kesalahan saat menghubungi server. Coba lagi sebentar lagi.",
      );
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-40 pb-32 px-6 min-h-screen relative">
        <div className="absolute top-0 right-0 w-full h-screen bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-8 bg-gold-500/50"></div>
            <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-medium">
              Pendaftaran Terkirim
            </p>
            <div className="h-px w-8 bg-gold-500/50"></div>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-white mb-6 tracking-tight">
            Terima <span className="italic text-gold-500/80 font-light">Kasih</span>
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto leading-relaxed font-light mb-4">
            Data pendaftaran sudah kami terima. Bukti pendaftaran telah kami kirim
            ke email{" "}
            <span className="text-gold-300">
              {formData.email || "yang kamu tulis di formulir"}
            </span>
            . Tim HIMA akan menghubungi kamu melalui kontak yang tertera untuk
            tahap berikutnya.
          </p>
          <div className="max-w-xl mx-auto text-xs text-neutral-500 mb-12">
            <p className="leading-relaxed">
              Jika email belum muncul di kotak masuk, cek juga folder{" "}
              <span className="text-neutral-300">Spam</span> atau{" "}
              <span className="text-neutral-300">Junk</span> dan tandai email dari{" "}
              <span className="text-gold-300">HIMA Musik</span> sebagai{" "}
              <span className="text-neutral-300">“Bukan spam”</span> supaya informasi
              berikutnya tidak terlewat.
            </p>
          </div>
          <div className="border border-white/10 bg-white/5 p-6 max-w-lg mx-auto mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">
              Bukti Pendaftaran
            </p>
            <div className="text-sm text-neutral-200 space-y-2">
              <p>Nama: {formData.fullName}</p>
              <p>Email: {formData.email}</p>
              <p>
                Waktu:{" "}
                {submittedAt
                  ? submittedAt.toLocaleString("id-ID", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })
                  : "-"}
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setIsSubmitting(false);
                setSubmittedAt(null);
                setStep(0);
                setFormData({
                  firstChoice: "",
                  secondChoice: "",
                  angkatan: "",
                  pddSubfocus: "",
                  fullName: "",
                  nim: "",
                  email: "",
                  phone: "",
                  instagram: "",
                  motivation: "",
                  experience: "",
                  availability: [],
                  portfolio: "",
                });
              }}
              className="group relative px-8 py-4 bg-transparent border border-white/10 text-white text-xs font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:border-gold-300/50"
            >
              <span className="relative z-10 group-hover:text-gold-300 transition-colors duration-500">
                Daftar Lagi
              </span>
              <div className="absolute inset-0 bg-gold-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            </button>
            <Link
              href="/pendaftaran"
              className="group relative px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-gold-300 hover:text-white"
            >
              Kembali ke Pendaftaran
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-32 px-6 min-h-screen relative">
      <div className="absolute top-0 left-0 w-full h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <Link
          href="/pendaftaran"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-gold-300 transition-colors duration-300 mb-8"
        >
          ← Kembali ke Info Pendaftaran
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-px w-8 bg-gold-500/50"></div>
          <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-medium">
            Formulir Pendaftaran
          </p>
        </div>
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-white tracking-tight mb-4">
            Isi Data <span className="italic text-gold-500/80 font-light">Pendaftaran</span>
          </h1>
          <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">
            Pilih divisi, isi data diri, ceritakan motivasi, lalu kirim
            pendaftaran.
          </p>
        </div>

        <div ref={stepBarRef} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-gold-500 font-medium">
              Langkah {step + 1} dari {steps.length}: {steps[step].label}
            </p>
          </div>
          <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <form ref={formContainerRef} onSubmit={handleSubmit} className="space-y-12">
          {step === 0 && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                    Divisi apa yang paling kamu minati?
                  </h2>
                  <p className="text-neutral-400 text-sm mt-3 max-w-2xl leading-relaxed">
                    Pilih divisi utama tempat kamu ingin berkontribusi.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsDivisionModalOpen(true)}
                  className="group relative px-6 py-3 bg-transparent border border-gold-500/40 text-gold-300 text-xs font-medium uppercase tracking-[0.3em] overflow-hidden transition-all hover:border-gold-500/60"
                >
                  <span className="relative z-10 flex items-center gap-2 group-hover:text-gold-200 transition-colors duration-500">
                    Lihat Panduan dan Tugas Divisi
                  </span>
                  <div className="absolute inset-0 bg-gold-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 font-medium">
                    Pilihan 1 (Wajib) <span className="text-gold-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {divisions.map((division) => (
                      <div key={division.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`choice1-${division.id}`}
                          name="firstChoice"
                          value={division.id}
                          checked={formData.firstChoice === division.id}
                          onChange={(e) => handleFirstChoiceChange(e.target.value)}
                          className="w-4 h-4 accent-gold-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`choice1-${division.id}`}
                          className="ml-4 cursor-pointer flex-1 py-3 px-4 border border-white/5 rounded-sm transition-all duration-300 hover:border-white/20 hover:bg-white/5"
                          style={{
                            borderColor:
                              formData.firstChoice === division.id
                                ? "rgba(212, 166, 77, 0.4)"
                                : undefined,
                            backgroundColor:
                              formData.firstChoice === division.id
                                ? "rgba(212, 166, 77, 0.05)"
                                : undefined,
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-white">
                              {division.name}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {division.summary}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {showStepErrors && !formData.firstChoice && (
                    <p
                      data-error="true"
                      className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-2"
                    >
                      Pilih divisi utama terlebih dahulu.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <label htmlFor="secondChoice" className="block text-xs uppercase tracking-[0.3em] text-neutral-400 font-medium">
                    Pilihan 2 (Opsional)
                  </label>
                  <select
                    id="secondChoice"
                    name="secondChoice"
                    value={formData.secondChoice}
                    onChange={(e) => handleSecondChoiceChange(e.target.value)}
                    className="w-full bg-white/5 focus:bg-white/10 border border-white/10 py-3 px-4 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 font-light"
                  >
                    <option value="">
                      — Tidak ada / Hanya fokus pada Pilihan 1 —
                    </option>
                    {divisions.map((division) => (
                      <option
                        key={division.id}
                        value={division.id}
                        disabled={division.id === formData.firstChoice}
                      >
                        {division.name}
                        {division.id === formData.firstChoice ? " (dipilih sebagai Pilihan 1)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-2">
                    Pilihan 2 tidak dapat sama dengan Pilihan 1.
                  </p>
                </div>

                <div className="space-y-4">
                  <label htmlFor="angkatan" className="block text-xs uppercase tracking-[0.3em] text-neutral-400 font-medium">
                    Angkatan <span className="text-gold-500">*</span>
                  </label>
                  <select
                    id="angkatan"
                    name="angkatan"
                    value={formData.angkatan}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 focus:bg-white/10 border border-white/10 py-3 px-4 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 font-light"
                  >
                    <option value="">— Pilih angkatan —</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                  {showStepErrors && angkatanError && (
                    <p
                      data-error="true"
                      className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-2"
                    >
                      {angkatanError}
                    </p>
                  )}
                </div>

                {isPddSelected && (
                  <div className="space-y-4">
                    <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 font-medium">
                      Sub-fokus PDD (Opsional)
                    </label>
                    <p className="text-xs text-neutral-500">
                      Sub-fokus mana yang paling sesuai dengan skill-mu?
                    </p>
                    <div className="space-y-3">
                      {[
                        { value: "desain", label: "Desain", desc: "Visual identity, poster, feed IG, template, brand guideline" },
                        { value: "publikasi", label: "Publikasi & Media Sosial", desc: "Content calendar, distribusi info, kelola platform" },
                        { value: "dokumentasi", label: "Dokumentasi", desc: "Fotografer/videografer, seleksi & arsip, aftermovie" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            id={`pdd-${option.value}`}
                            name="pddSubfocus"
                            value={option.value}
                            checked={formData.pddSubfocus === option.value}
                            onChange={handleInputChange}
                            className="w-4 h-4 accent-gold-500 cursor-pointer"
                          />
                          <label
                            htmlFor={`pdd-${option.value}`}
                            className="ml-4 cursor-pointer flex-1 py-3 px-4 border border-white/5 rounded-sm transition-all duration-300 hover:border-white/20 hover:bg-white/5"
                            style={{
                              borderColor:
                                formData.pddSubfocus === option.value
                                  ? "rgba(212, 166, 77, 0.4)"
                                  : undefined,
                              backgroundColor:
                                formData.pddSubfocus === option.value
                                  ? "rgba(212, 166, 77, 0.05)"
                                  : undefined,
                            }}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-white">
                                {option.label}
                              </span>
                              <span className="text-xs text-neutral-400">
                                {option.desc}
                              </span>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                  Mari mulai dengan perkenalan
                </h2>
                <p className="text-neutral-400 text-sm mt-3 max-w-2xl leading-relaxed">
                  Pastikan data kontak aktif agar panitia mudah menghubungi kamu.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Nama Lengkap <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 focus:bg-white/10 border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-600 font-light px-3"
                      placeholder="Nama sesuai KTM"
                      required
                    />
                    {trimmedFullName && (
                      <span className="absolute right-3 text-green-500 text-xs">OK</span>
                    )}
                  </div>
                  {showStepErrors && fullNameError && (
                    <p data-error="true" className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-2">
                      {fullNameError}
                    </p>
                  )}
                </div>
                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    NIM <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      name="nim"
                      value={formData.nim}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 focus:bg-white/10 border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-600 font-light px-3"
                      placeholder="24xxxxxxxx"
                      inputMode="numeric"
                      pattern="\d{10,12}"
                      required
                    />
                    {trimmedNim && isNimValid && (
                      <span className="absolute right-3 text-green-500 text-xs">OK</span>
                    )}
                  </div>
                  <p className="text-[0.6rem] text-neutral-500 mt-1 tracking-wide">10–12 digit angka sesuai KTM</p>
                  {showStepErrors && nimError && (
                    <p data-error="true" className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-2">
                      {nimError}
                    </p>
                  )}
                </div>
                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Email Aktif <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 focus:bg-white/10 border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-600 font-light px-3"
                      placeholder="nama@email.com"
                      required
                    />
                    {trimmedEmail && isEmailValid && (
                      <span className="absolute right-3 text-green-500 text-xs">OK</span>
                    )}
                  </div>
                  {showStepErrors && emailError && (
                    <p data-error="true" className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-2">
                      {emailError}
                    </p>
                  )}
                </div>
                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    No. WhatsApp <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 focus:bg-white/10 border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-600 font-light px-3"
                      placeholder="08xxxxxxxxxx"
                      inputMode="tel"
                      required
                    />
                    {trimmedPhone && isPhoneValid && (
                      <span className="absolute right-3 text-green-500 text-xs">OK</span>
                    )}
                  </div>
                  <p className="text-[0.6rem] text-neutral-500 mt-1 tracking-wide">Format: 08xx atau +628xx (spasi/strip diabaikan)</p>
                  {showStepErrors && phoneError && (
                    <p data-error="true" className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-2">
                      {phoneError}
                    </p>
                  )}
                </div>
                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Instagram (Opsional)
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 focus:bg-white/10 border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-600 font-light px-3"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                  Ceritakan alasanmu & atur jadwalmu
                </h2>
                <p className="text-neutral-400 text-sm mt-3 max-w-2xl leading-relaxed">
                  Berikan penjelasan lengkap tentang motivasimu dan pilih hari ketersediaan.
                </p>
              </div>

              <div className="space-y-10">
                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Motivasi Utama <span className="text-gold-500">*</span>
                  </label>
                  <textarea
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    rows={6}
                    maxLength={MAX_MOTIVATION_CHARS}
                    className="w-full bg-black/20 border border-white/5 p-5 text-neutral-200 focus:outline-none focus:border-gold-500/30 transition-colors duration-500 resize-none font-light placeholder-neutral-700 overflow-hidden"
                    style={{ overflowWrap: "break-word" }}
                    placeholder={`Contoh: Kenapa kamu tertarik dengan ${currentDivision ? currentDivision.name : "divisi ini"}? Apa yang ingin kamu pelajari atau ubah di HIMA Musik?`}
                  ></textarea>
                  <div className="mt-3 space-y-2">
                    <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          motivationLength >= MIN_MOTIVATION_CHARS
                            ? "bg-green-500"
                            : motivationLength >= MIN_MOTIVATION_CHARS - 30
                              ? "bg-amber-500"
                              : "bg-neutral-700"
                        }`}
                        style={{
                          width: `${(motivationLength / MAX_MOTIVATION_CHARS) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                      <span
                        className={
                          motivationLength >= MIN_MOTIVATION_CHARS
                            ? "text-green-500"
                            : motivationLength > 0
                              ? "text-neutral-500"
                              : "text-neutral-700"
                        }
                      >
                        {motivationLength >= MIN_MOTIVATION_CHARS
                          ? "Penjelasanmu sudah cukup detail."
                          : `${MIN_MOTIVATION_CHARS - motivationLength} karakter lagi`}
                      </span>
                      <span className="text-neutral-600">
                        {motivationLength}/{MAX_MOTIVATION_CHARS}
                      </span>
                    </div>
                  </div>
                  {showStepErrors && motivationError && (
                    <p data-error="true" className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-3">
                      {motivationError}
                    </p>
                  )}
                </div>

                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-4 group-focus-within:text-gold-300 transition-colors duration-500">
                    Ketersediaan Waktu <span className="text-gold-500">*</span>
                  </label>
                  <p className="text-xs text-neutral-500 mb-4">
                    Pilih hari di mana kamu biasanya luang untuk rapat/koordinasi (Bisa pilih lebih dari satu).
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availabilityOptions.map((day) => {
                      const isActive = formData.availability.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleAvailability(day)}
                          className={`border px-4 py-3 text-xs uppercase tracking-[0.3em] transition-all duration-300 rounded-sm font-medium ${
                            isActive
                              ? "border-gold-500/60 text-gold-300 bg-gold-500/10"
                              : "border-white/10 text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {showStepErrors && formData.availability.length === 0 && (
                    <p data-error="true" className="text-xs uppercase tracking-[0.2em] text-amber-500/80 mt-3">
                      Pilih minimal satu hari untuk rapat rutin.
                    </p>
                  )}
                </div>

                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Pengalaman Organisasi (Opsional)
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-black/20 border border-white/5 p-5 text-neutral-200 focus:outline-none focus:border-gold-500/30 transition-colors duration-500 resize-none font-light placeholder-neutral-700 overflow-hidden"
                    style={{ overflowWrap: "break-word" }}
                    placeholder="Cerita singkat pengalaman organisasi atau proyek yang pernah kamu ikuti."
                  ></textarea>
                </div>

                <div className="group relative">
                  <label className="block text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Portofolio/Link Karya (Opsional)
                  </label>
                  <textarea
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-black/20 border border-white/5 p-5 text-neutral-200 focus:outline-none focus:border-gold-500/30 transition-colors duration-500 resize-none font-light placeholder-neutral-700 overflow-hidden"
                    style={{ overflowWrap: "break-word" }}
                    placeholder="Behance, Drive, Instagram, YouTube, dsb."
                  ></textarea>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-600">
                    Boleh lebih dari satu link, pisahkan dengan koma atau baris baru.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                  Review Pendaftaran
                </h2>
                <p className="text-neutral-400 text-sm mt-3 max-w-2xl leading-relaxed">
                  Satu langkah lagi! Pastikan data di atas sudah benar sebelum dikirim.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="border border-white/5 bg-white/2 p-8 space-y-6 overflow-hidden" style={{ overflowWrap: "break-word" }}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                        Posisi Pilihan
                      </p>
                      <button
                        type="button"
                        onClick={() => { setShowStepErrors(false); shouldScrollOnStepChangeRef.current = true; setStep(0); }}
                        className="text-xs text-gold-500/60 hover:text-gold-300 transition-colors duration-300 uppercase tracking-[0.2em]"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-white font-serif text-2xl">
                      {divisions.find((division) => division.id === formData.firstChoice)?.name ||
                        "-"}
                    </p>
                    <p className="text-sm text-neutral-400 mt-2">
                      Pilihan 2:{" "}
                      {divisions.find((division) => division.id === formData.secondChoice)?.name ||
                        "—"}
                    </p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Angkatan: {formData.angkatan || "—"}
                    </p>
                    {isPddSelected && formData.pddSubfocus && (
                      <p className="text-sm text-neutral-400 mt-1">
                        Sub-fokus PDD:{" "}
                        {formData.pddSubfocus === "desain"
                          ? "Desain"
                          : formData.pddSubfocus === "publikasi"
                            ? "Publikasi & Media Sosial"
                            : formData.pddSubfocus === "dokumentasi"
                              ? "Dokumentasi"
                              : "—"}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                        Kontak
                      </p>
                      <button
                        type="button"
                        onClick={() => { setShowStepErrors(false); shouldScrollOnStepChangeRef.current = true; setStep(1); }}
                        className="text-xs text-gold-500/60 hover:text-gold-300 transition-colors duration-300 uppercase tracking-[0.2em]"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="text-sm text-neutral-300 space-y-2 overflow-hidden" style={{ overflowWrap: "break-word" }}>
                      <p className="overflow-hidden" style={{ overflowWrap: "break-word" }}>{formData.fullName}</p>
                      <p className="overflow-hidden" style={{ overflowWrap: "break-word" }}>{formData.nim}</p>
                      <p className="overflow-hidden text-xs" style={{ overflowWrap: "break-word" }}>{formData.email}</p>
                      <p className="overflow-hidden" style={{ overflowWrap: "break-word" }}>{formData.phone}</p>
                      {formData.instagram && <p className="overflow-hidden" style={{ overflowWrap: "break-word" }}>{formData.instagram}</p>}
                    </div>
                  </div>
                </div>
                <div className="border border-white/5 bg-white/2 p-8 space-y-6 overflow-hidden" style={{ overflowWrap: "break-word" }}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                        Motivasi
                      </p>
                      <button
                        type="button"
                        onClick={() => { setShowStepErrors(false); shouldScrollOnStepChangeRef.current = true; setStep(2); }}
                        className="text-xs text-gold-500/60 hover:text-gold-300 transition-colors duration-300 uppercase tracking-[0.2em]"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap overflow-hidden" style={{ overflowWrap: "break-word" }}>
                      {formData.motivation || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-2">
                      Ketersediaan
                    </p>
                    <p className="text-sm text-neutral-300">
                      {formData.availability.length > 0
                        ? formData.availability.join(", ")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-2">
                      Pengalaman
                    </p>
                    <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap overflow-hidden" style={{ overflowWrap: "break-word" }}>
                      {formData.experience || "Belum diisi"}
                    </p>
                  </div>
                  {formData.portfolio && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-2">
                        Portofolio
                      </p>
                      <div className="text-sm text-neutral-300 space-y-1 overflow-hidden" style={{ overflowWrap: "break-word" }}>
                        {formData.portfolio
                          .split(/[\n,]+/)
                          .map((entry) => entry.trim())
                          .filter(Boolean)
                          .map((entry) => (
                            <p key={entry} className="overflow-hidden text-xs" style={{ overflowWrap: "break-word" }}>{entry}</p>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-white/5 pt-8">
            <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-neutral-500">
              {(hasEditedCurrentStep || showStepErrors) && (
                <span
                  className={
                    isStepValid
                      ? "inline-flex items-center gap-2 text-gold-400"
                      : "inline-flex items-center gap-2 text-red-400"
                  }
                >
                  <span className="text-xs">
                    {isStepValid ? "OK" : "!"}
                  </span>
                  <span>
                    {isStepValid
                      ? step === steps.length - 1
                        ? "Review semua data sebelum mengirim"
                        : "Lengkapi langkah berikutnya"
                      : step === 2
                        ? !trimmedMotivation
                          ? "Isi motivasi untuk melanjutkan"
                          : !isMotivationValid
                            ? "Motivasi belum memenuhi batas karakter"
                            : formData.availability.length === 0
                              ? "Pilih minimal satu ketersediaan waktu"
                              : "Lengkapi motivasi dan ketersediaan"
                        : "Periksa kembali data diri yang belum valid"}
                  </span>
                </span>
              )}
              {(hasTouchedForm || showRestoreNotice || autoSaveStatus === "error") && (
                <span>
                  {autoSaveStatus === "saving" && "Menyimpan draf..."}
                  {autoSaveStatus === "saved" &&
                    lastSavedAt &&
                    `Draf tersimpan di perangkat ini \u2022 ${lastSavedAt}`}
                  {autoSaveStatus === "error" &&
                    "Gagal menyimpan draf. Periksa penyimpanan browser."}
                  {autoSaveStatus === "idle" &&
                    showRestoreNotice &&
                    "Draf sebelumnya dipulihkan dari perangkat ini."}
                </span>
              )}
              {submitError && (
                <span className="text-red-400">
                  {submitError}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 text-xs uppercase tracking-[0.3em] border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 transition-colors duration-300"
                >
                  Kembali
                </button>
              )}
              {hasTouchedForm && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-neutral-500 hover:text-red-400 transition-colors duration-300 border-b border-transparent hover:border-red-400/30"
                >
                  Reset Draf
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextWithValidation}
                  className="btn-primary"
                >
                  <span className="btn-primary-label">Lanjut</span>
                  <div className="btn-primary-overlay"></div>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isStepValid || isSubmitting}
                  className={`btn-primary ${!isStepValid || isSubmitting ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <span className="btn-primary-label">
                    {isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
                  </span>
                  <div className="btn-primary-overlay"></div>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm px-6">
          <div className="w-full max-w-md bg-[#111] border border-white/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gold-500/50 to-transparent"></div>
            <h2 className="font-serif text-2xl text-white mb-4 tracking-wide">Reset draf?</h2>
            <p className="text-sm text-neutral-400 mb-10 leading-relaxed font-light">
              Tindakan ini akan menghapus semua isian formulir pendaftaran yang belum dikirim.
            </p>
            <div className="flex justify-end gap-4 text-xs uppercase tracking-[0.2em] font-medium">
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
                className="px-6 py-3 bg-white text-black hover:bg-gold-300 hover:text-white transition-colors duration-300"
              >
                Ya, reset
              </button>
            </div>
          </div>
        </div>
      )}

      {isDivisionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0a0a0a]/90 backdrop-blur-sm px-6 py-12 overflow-y-auto"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsDivisionModalOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-4xl bg-[#111] border border-white/10 relative overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gold-500/50 to-transparent"></div>
            <button
              type="button"
              onClick={() => setIsDivisionModalOpen(false)}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors z-10 text-2xl leading-none"
              aria-label="Tutup modal"
            >
              X
            </button>

            <div className="p-8 md:p-12">
              <h2 className="font-serif text-4xl text-white mb-2 tracking-tight">
                Panduan Lengkap Divisi
              </h2>
              <p className="text-neutral-400 text-sm mb-12">
                Pelajari detail setiap divisi untuk memilih yang paling cocok dengan minat dan keahlianmu.
              </p>

              <div className="space-y-8">
                {divisions.map((division) => (
                  <div
                    key={division.id}
                    className="border border-white/10 bg-white/2 p-8"
                  >
                    <div className="mb-6">
                      <h3 className="font-serif text-2xl text-white mb-2">
                        {division.name}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-gold-500/70 mb-4">
                        Fokus: {division.focus}
                      </p>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {division.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 font-medium">
                          Tugas Utama
                        </h4>
                        <ul className="text-sm text-neutral-300 space-y-2">
                          {division.tasks.map((task) => (
                            <li key={task} className="flex gap-3">
                              <span className="text-gold-500 shrink-0">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 font-medium">
                          Skill Ideal & Komitmen
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-neutral-500 mb-2">Skill:</p>
                            <div className="flex flex-wrap gap-2">
                              {division.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-xs border border-gold-500/30 bg-gold-500/5 px-3 py-1 text-gold-300"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-2">Komitmen Waktu:</p>
                            <p className="text-sm text-neutral-300">
                              {division.commitment}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setIsDivisionModalOpen(false)}
                  className="group relative px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-gold-300"
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                    Tutup
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pendaftaran;
