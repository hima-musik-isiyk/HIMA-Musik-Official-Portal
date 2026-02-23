"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Division = {
  id: string;
  name: string;
  summary: string;
  focus: string;
  tasks: string[];
  skills: string[];
  commitment: string;
};

type RecruitmentFormData = {
  firstChoice: string;
  secondChoice: string;
  fullName: string;
  nim: string;
  program: string;
  year: string;
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

const divisions: Division[] = [
  {
    id: "kaderisasi",
    name: "Kaderisasi & Pengembangan",
    summary: "Merancang pembinaan anggota, kegiatan orientasi, dan pelatihan soft skills.",
    focus: "Kepemimpinan & internal growth",
    tasks: [
      "Menyusun agenda kaderisasi dan mentoring",
      "Membangun culture kolaboratif",
      "Mengevaluasi progres anggota",
    ],
    skills: ["Leadership", "Facilitation", "Empathy"],
    commitment: "Rapat mingguan + sesi mentoring berkala",
  },
  {
    id: "humas",
    name: "Humas & Kemitraan",
    summary: "Menjaga relasi eksternal, kolaborasi event, dan komunikasi antar organisasi.",
    focus: "Relasi eksternal & komunikasi strategis",
    tasks: [
      "Mengelola komunikasi dengan mitra",
      "Menyusun proposal kolaborasi",
      "Menjadi penghubung antar divisi",
    ],
    skills: ["Communication", "Negotiation", "Networking"],
    commitment: "Fleksibel sesuai agenda kolaborasi",
  },
  {
    id: "kreatif",
    name: "Kreatif & Media",
    summary: "Menghasilkan konten visual, dokumentasi kegiatan, dan identitas kampanye.",
    focus: "Branding & storytelling",
    tasks: [
      "Mendesain poster dan materi publikasi",
      "Mendokumentasikan kegiatan",
      "Mengelola konten media sosial",
    ],
    skills: ["Design", "Photography", "Storytelling"],
    commitment: "Menyesuaikan timeline publikasi",
  },
  {
    id: "acara",
    name: "Acara & Program Kerja",
    summary: "Merancang konsep kegiatan, menyusun rundown, dan eksekusi event HIMA.",
    focus: "Event management & koordinasi",
    tasks: [
      "Menyusun konsep acara",
      "Koordinasi teknis dan logistik",
      "Menjaga flow acara saat eksekusi",
    ],
    skills: ["Planning", "Coordination", "Problem Solving"],
    commitment: "Intensif saat persiapan event",
  },
  {
    id: "advokasi",
    name: "Advokasi & Aspirasi",
    summary: "Menampung isu mahasiswa, merumuskan tindak lanjut, dan advokasi ke pihak kampus.",
    focus: "Kesejahteraan mahasiswa",
    tasks: [
      "Menyusun forum aspirasi",
      "Mengelola data aduan",
      "Koordinasi tindak lanjut ke pihak terkait",
    ],
    skills: ["Critical Thinking", "Empathy", "Analysis"],
    commitment: "Rutin monitoring dan follow-up",
  },
];

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

const Pendaftaran: React.FC = () => {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<RecruitmentFormData>({
    firstChoice: "",
    secondChoice: "",
    fullName: "",
    nim: "",
    program: "",
    year: "",
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
  const stepBarRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollOnStepChangeRef = useRef(false);

  const currentDivision = divisions.find((division) => division.id === formData.firstChoice);

  const isStepComplete = (stepId: number): boolean => {
    if (stepId === 0) {
      return Boolean(formData.firstChoice);
    }
    if (stepId === 1) {
      return Boolean(
        formData.fullName.trim() &&
          formData.nim.trim() &&
          formData.program.trim() &&
          formData.year.trim() &&
          formData.email.trim() &&
          formData.phone.trim(),
      );
    }
    if (stepId === 2) {
      return Boolean(formData.motivation.trim() && formData.availability.length > 0);
    }
    return false;
  };

  const isStepValid: boolean = ((): boolean => {
    if (step >= 0 && step <= 2) {
      return isStepComplete(step);
    }
    if (step === 3) {
      return isStepComplete(0) && isStepComplete(1) && isStepComplete(2);
    }
    return false;
  })();

  const hasEditedCurrentStep: boolean = ((): boolean => {
    if (step === 0) {
      return Boolean(formData.firstChoice);
    }
    if (step === 1) {
      return Boolean(
        formData.fullName.trim() ||
          formData.nim.trim() ||
          formData.program.trim() ||
          formData.year.trim() ||
          formData.email.trim() ||
          formData.phone.trim(),
      );
    }
    if (step === 2) {
      return Boolean(formData.motivation.trim() || formData.availability.length > 0);
    }
    return false;
  })();

  const canAccessStep = (targetStep: number) => {
    if (targetStep < 0 || targetStep >= steps.length) return false;
    if (targetStep === 0) return true;
    for (let index = 0; index < targetStep; index += 1) {
      if (!isStepComplete(index)) {
        return false;
      }
    }
    return true;
  };

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
        "fullName",
        "nim",
        "program",
        "year",
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
        fullName: data.fullName,
        nim: data.nim,
        program: data.program,
        year: data.year,
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
    const rect = node.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const offset = 140;
    window.scrollTo({
      top: absoluteTop - offset,
      behavior: "smooth",
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

  const saveDraftNow = () => {
    if (!hasTouchedForm || submitted) return;
    if (typeof window === "undefined") return;
    try {
      setAutoSaveStatus("saving");
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
  };

  const handleResetDraft = () => {
    setFormData({
      firstChoice: "",
      secondChoice: "",
      fullName: "",
      nim: "",
      program: "",
      year: "",
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

  const handleSelect = (priority: "firstChoice" | "secondChoice", id: string) => {
    setFormData((prev) => {
      if (priority === "secondChoice" && !prev.firstChoice) {
        return prev;
      }
      const next = { ...prev };
      if (priority === "firstChoice") {
        const isSame = prev.firstChoice === id;
        next.firstChoice = isSame ? "" : id;
        if (isSame || next.secondChoice === id) {
          next.secondChoice = "";
        }
        if (!next.firstChoice) {
          next.secondChoice = "";
        }
      } else {
        if (prev.firstChoice === id) {
          next.secondChoice = "";
        } else {
          next.secondChoice = prev.secondChoice === id ? "" : id;
        }
      }
      return next;
    });
    setHasTouchedForm(true);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const handleNext = () => {
    if (step < steps.length - 1) {
      setShowStepErrors(false);
      saveDraftNow();
      shouldScrollOnStepChangeRef.current = true;
      setStep((prev) => prev + 1);
    }
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
      return;
    }
    setShowStepErrors(false);
    saveDraftNow();
    shouldScrollOnStepChangeRef.current = true;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setShowStepErrors(false);
    shouldScrollOnStepChangeRef.current = true;
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (targetStep: number) => {
    if (!canAccessStep(targetStep)) return;
    setShowStepErrors(false);
    setStep(targetStep);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (step < steps.length - 1) {
      handleNextWithValidation();
      return;
    }

    if (!isStepValid) return;

    if (step !== steps.length - 1) return;

    setSubmitted(true);
    setAutoSaveStatus("idle");
    setHasTouchedForm(false);
    setShowRestoreNotice(false);
    setLastSavedAt(null);
    clearStoredState();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  if (submitted) {
    return (
      <div className="pt-40 pb-32 px-6 min-h-screen relative">
        <div className="absolute top-0 right-0 w-full h-screen bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-8 bg-gold-500/50"></div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500 font-medium">
              Pendaftaran Terkirim
            </p>
            <div className="h-px w-8 bg-gold-500/50"></div>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-white mb-6 tracking-tight">
            Terima <span className="italic text-gold-500/80 font-light">Kasih</span>
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto leading-relaxed font-light mb-12">
            Data pendaftaran sudah kami terima. Tim HIMA akan menghubungi kamu
            melalui kontak yang tertera untuk tahap berikutnya.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setStep(0);
                setFormData({
                  firstChoice: "",
                  secondChoice: "",
                  fullName: "",
                  nim: "",
                  program: "",
                  year: "",
                  email: "",
                  phone: "",
                  instagram: "",
                  motivation: "",
                  experience: "",
                  availability: [],
                  portfolio: "",
                });
              }}
              className="group relative px-8 py-4 bg-transparent border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:border-gold-300/50"
            >
              <span className="relative z-10 group-hover:text-gold-300 transition-colors duration-500">
                Daftar Lagi
              </span>
              <div className="absolute inset-0 bg-gold-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            </button>
            <Link
              href="/"
              className="group relative px-8 py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-gold-300 hover:text-white"
            >
              Kembali ke Beranda
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
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px w-8 bg-gold-500/50"></div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500 font-medium">
            Open Recruitment
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div>
            <h1 className="font-serif text-5xl md:text-7xl text-white tracking-tight">
              Pendaftaran <span className="italic text-gold-500/80 font-light">Pengurus</span>
            </h1>
            <p className="text-neutral-500 text-sm mt-4 max-w-xl leading-relaxed">
              Pilih divisi yang paling cocok, isi data diri, ceritakan motivasi,
              lalu kirim pendaftaran. Semua langkah sudah dirancang agar ringkas
              dan jelas.
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Periode: 01–21 Maret 2026
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              title: "Pilih Posisi",
              description: "Baca ringkasannya lalu pilih prioritas divisi.",
            },
            {
              title: "Isi Data & Motivasi",
              description: "Lengkapi data diri dan cerita singkatmu.",
            },
            {
              title: "Review & Kirim",
              description: "Cek kembali sebelum submit pendaftaran.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="border border-white/5 bg-white/2 p-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,166,77,0.06)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <span className="text-[0.65rem] font-mono text-stone-700 tracking-wider mb-5 block relative z-10">
                0{index + 1}
              </span>
              <h3 className="font-serif text-xl text-white mb-3 relative z-10">
                {item.title}
              </h3>
              <p className="text-[0.8125rem] leading-relaxed text-neutral-500 font-light relative z-10">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div ref={stepBarRef} className="border border-white/5 bg-[#111]/50 p-6 md:p-10 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            {steps.map((item) => {
              const isActive = step === item.id;
              const canAccess = canAccessStep(item.id);
              const canClick = canAccess && !isActive;
              const isLocked = !canAccess;
              const stepCompleted = isStepComplete(item.id);
              const cursorClass = canClick
                ? "cursor-pointer"
                : isLocked
                  ? "cursor-not-allowed"
                  : "cursor-default";
              const backgroundClass = isActive
                ? "text-white border-gold-500/40 bg-gold-500/10"
                : stepCompleted
                  ? "text-gold-300/80 border-gold-500/20 bg-gold-500/5"
                  : canClick
                    ? "text-gold-300/70 border-gold-500/10 bg-gold-500/5/50"
                    : "text-neutral-500/70 border-white/10 bg-transparent";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!canClick) return;
                    handleStepClick(item.id);
                  }}
                  className={`flex items-center gap-3 border px-4 py-3 w-full text-left ${cursorClass} ${backgroundClass}`}
                >
                  <span className="text-[0.65rem] font-mono">
                    0{item.id + 1}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {step === 0 && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                    Pilih Divisi
                  </h2>
                  <p className="text-neutral-500 text-sm mt-3 max-w-2xl leading-relaxed">
                    Pilih prioritas utama dan opsional prioritas kedua. Kamu bisa
                    membaca ringkasan tiap divisi sebelum menentukan pilihan.
                  </p>
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Pilihan 2 bersifat opsional
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {divisions.map((division) => {
                  const isPrimary = formData.firstChoice === division.id;
                  const isSecondary = formData.secondChoice === division.id;
                  return (
                    <div
                      key={division.id}
                      className={`border border-white/5 p-7 bg-white/1 transition-all duration-300 ${
                        isPrimary
                          ? "border-gold-500/60 bg-gold-500/10"
                          : isSecondary
                            ? "border-gold-500/30"
                            : "hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="mt-4">
                          <h3 className="font-serif text-2xl text-white">
                            {division.name}
                          </h3>
                          <p className="text-[0.75rem] uppercase tracking-[0.25em] text-gold-500/70 mt-2">
                            {division.focus}
                          </p>
                        </div>
                        <div className="relative">
                          {isPrimary && (
                            <span className="absolute top-0 right-0 text-[0.65rem] uppercase tracking-[0.3em] text-gold-300 whitespace-nowrap">
                              Prioritas 1
                            </span>
                          )}
                          {isSecondary && !isPrimary && (
                            <span className="absolute top-0 right-0 text-[0.65rem] uppercase tracking-[0.3em] text-gold-300/70 whitespace-nowrap">
                              Prioritas 2
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-light">
                        {division.summary}
                      </p>
                      <div className="space-y-4 text-[0.7rem] uppercase tracking-[0.25em] text-neutral-500">
                        <div>
                          <span className="block text-neutral-600 mb-2">Fokus</span>
                          <div className="text-neutral-400 normal-case tracking-normal text-sm">
                            {division.commitment}
                          </div>
                        </div>
                        <div>
                          <span className="block text-neutral-600 mb-2">Tugas Utama</span>
                          <ul className="text-neutral-400 normal-case tracking-normal text-sm space-y-2">
                            {division.tasks.map((task) => (
                              <li key={task}>• {task}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="block text-neutral-600 mb-2">Skill Ideal</span>
                          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                            {division.skills.map((skill) => (
                              <span
                                key={skill}
                                className="border border-white/10 px-3 py-1"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <button
                          type="button"
                          onClick={() => handleSelect("firstChoice", division.id)}
                          className={`px-4 py-3 text-[10px] uppercase tracking-[0.3em] border transition-colors duration-300 ${
                            isPrimary
                              ? "border-gold-500/60 text-gold-300"
                              : "border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
                          }`}
                        >
                          Pilih Prioritas 1
                        </button>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => handleSelect("secondChoice", division.id)}
                            aria-disabled={!formData.firstChoice}
                            className={`px-4 py-3 text-[10px] uppercase tracking-[0.3em] border transition-colors duration-300 ${
                              !formData.firstChoice
                                ? "border-white/10 text-neutral-600 cursor-not-allowed"
                                : isSecondary
                                  ? "border-gold-500/40 text-gold-300/80"
                                  : "border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
                            }`}
                          >
                            Pilih Prioritas 2
                          </button>
                          {!formData.firstChoice && (
                            <div className="pointer-events-none absolute left-0 top-full mt-2 rounded border border-white/10 bg-black/90 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Pilih prioritas 1 dulu
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                  Data Diri
                </h2>
                <p className="text-neutral-500 text-sm mt-3 max-w-2xl leading-relaxed">
                  Pastikan data kontak aktif agar panitia mudah menghubungi kamu.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[
                  { label: "Nama Lengkap", name: "fullName", placeholder: "Nama sesuai KTM" },
                  { label: "NIM", name: "nim", placeholder: "2024xxxxxx" },
                  { label: "Program Studi", name: "program", placeholder: "S-1 Musik" },
                  { label: "Angkatan", name: "year", placeholder: "2024" },
                  { label: "Email Aktif", name: "email", placeholder: "nama@email.com" },
                  { label: "No. WhatsApp", name: "phone", placeholder: "08xxxxxxxxxx" },
                ].map((field) => (
                  <div key={field.name} className="group relative">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name as keyof RecruitmentFormData] as string}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-700 font-light"
                      placeholder={field.placeholder}
                      required
                    />
                  </div>
                ))}
                <div className="group relative">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Instagram (Opsional)
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-700 font-light"
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
                  Motivasi & Kesiapan
                </h2>
                <p className="text-neutral-500 text-sm mt-3 max-w-2xl leading-relaxed">
                  Ceritakan alasanmu memilih divisi dan ketersediaan waktumu.
                </p>
              </div>

              <div className="space-y-10">
                <div className="group relative">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Motivasi Utama
                  </label>
                  <textarea
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full bg-black/20 border border-white/5 p-5 text-neutral-200 focus:outline-none focus:border-gold-500/30 transition-colors duration-500 resize-none font-light placeholder-neutral-700"
                    placeholder={`Ceritakan alasan memilih ${
                      currentDivision?.name ?? "divisi ini"
                    } dan kontribusi yang ingin kamu berikan.`}
                  ></textarea>
                  {showStepErrors && !formData.motivation.trim() && (
                    <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 mt-2">
                      Motivasi wajib diisi untuk melanjutkan.
                    </p>
                  )}
                </div>

                <div className="group relative">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4 group-focus-within:text-gold-300 transition-colors duration-500">
                    Ketersediaan Waktu
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availabilityOptions.map((day) => {
                      const isActive = formData.availability.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleAvailability(day)}
                          className={`border px-4 py-3 text-[10px] uppercase tracking-[0.3em] transition-colors duration-300 ${
                            isActive
                              ? "border-gold-500/60 text-gold-300 bg-gold-500/10"
                              : "border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mt-4">
                    Pilih minimal satu hari untuk rapat rutin.
                  </p>
                  {showStepErrors && formData.availability.length === 0 && (
                    <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 mt-2">
                      Pilih minimal satu ketersediaan waktu.
                    </p>
                  )}
                </div>

                <div className="group relative">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Pengalaman Organisasi (Opsional)
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-black/20 border border-white/5 p-5 text-neutral-200 focus:outline-none focus:border-gold-500/30 transition-colors duration-500 resize-none font-light placeholder-neutral-700"
                    placeholder="Cerita singkat pengalaman organisasi atau proyek yang pernah kamu ikuti."
                  ></textarea>
                </div>

                <div className="group relative">
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 group-focus-within:text-gold-300 transition-colors duration-500">
                    Portofolio/Link Karya (Opsional)
                  </label>
                  <input
                    type="text"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-white/10 py-3 text-neutral-200 focus:outline-none focus:border-gold-500/50 transition-colors duration-500 placeholder-neutral-700 font-light"
                    placeholder="Behance / Drive / Instagram / YouTube"
                  />
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
                <p className="text-neutral-500 text-sm mt-3 max-w-2xl leading-relaxed">
                  Pastikan semua data sudah benar sebelum dikirim.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="border border-white/5 bg-white/2 p-8 space-y-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                      Posisi Pilihan
                    </p>
                    <p className="text-white font-serif text-2xl">
                      {divisions.find((division) => division.id === formData.firstChoice)?.name ||
                        "-"}
                    </p>
                    <p className="text-sm text-neutral-500 mt-2">
                      Pilihan 2:{" "}
                      {divisions.find((division) => division.id === formData.secondChoice)?.name ||
                        "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                      Kontak
                    </p>
                    <div className="text-sm text-neutral-300 space-y-2">
                      <p>{formData.fullName}</p>
                      <p>{formData.nim}</p>
                      <p>{formData.program} • {formData.year}</p>
                      <p>{formData.email}</p>
                      <p>{formData.phone}</p>
                      {formData.instagram && <p>{formData.instagram}</p>}
                    </div>
                  </div>
                </div>
                <div className="border border-white/5 bg-white/2 p-8 space-y-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                      Motivasi
                    </p>
                    <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                      {formData.motivation || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                      Ketersediaan
                    </p>
                    <p className="text-sm text-neutral-300">
                      {formData.availability.length > 0
                        ? formData.availability.join(", ")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                      Pengalaman
                    </p>
                    <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                      {formData.experience || "Belum diisi"}
                    </p>
                  </div>
                  {formData.portfolio && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                        Portofolio
                      </p>
                      <p className="text-sm text-neutral-300">{formData.portfolio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-white/5 pt-8">
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
              {(hasEditedCurrentStep || showStepErrors) && (
                <span
                  className={
                    isStepValid
                      ? "inline-flex items-center gap-2 text-gold-400"
                      : "inline-flex items-center gap-2 text-red-400"
                  }
                >
                  <span className="text-xs">
                    {isStepValid ? "!" : "⚠"}
                  </span>
                  <span>
                    {isStepValid
                      ? step === steps.length - 1
                        ? "Review semua data sebelum mengirim"
                        : "Lengkapi langkah berikutnya"
                      : step === 2
                        ? !formData.motivation.trim()
                          ? "Isi motivasi untuk melanjutkan"
                          : formData.availability.length === 0
                            ? "Pilih minimal satu ketersediaan waktu"
                            : "Isi motivasi dan pilih ketersediaan waktu"
                        : "Ada data wajib yang belum diisi"}
                  </span>
                </span>
              )}
              {(hasTouchedForm || showRestoreNotice || autoSaveStatus === "error") && (
                <span>
                  {autoSaveStatus === "saving" && "Menyimpan draf..."}
                  {autoSaveStatus === "saved" &&
                    lastSavedAt &&
                    `Draf tersimpan \u2022 ${lastSavedAt}`}
                  {autoSaveStatus === "error" &&
                    "Gagal menyimpan draf. Periksa penyimpanan browser."}
                  {autoSaveStatus === "idle" &&
                    showRestoreNotice &&
                    "Draf sebelumnya dipulihkan."}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 text-[10px] uppercase tracking-[0.3em] border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 transition-colors duration-300"
                >
                  Kembali
                </button>
              )}
              {hasTouchedForm && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-6 py-3 text-[10px] uppercase tracking-[0.3em] border border-white/10 text-neutral-400 hover:text-white hover:border-white/30 transition-colors duration-300"
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
                  disabled={!isStepValid}
                  className={`btn-primary ${!isStepValid ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <span className="btn-primary-label">Kirim Pendaftaran</span>
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
                className="px-6 py-3 bg-white text-black hover:bg-gold-300 hover:text-white transition-colors duration-300"
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

export default Pendaftaran;
