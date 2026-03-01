"use client";

import { usePathname } from "next/navigation";
import React, { useState } from "react";

import useViewEntrance from "@/lib/useViewEntrance";

interface FormField {
  name: string;
  nim: string;
  items: string;
  date: string;
  returnDate: string;
  notes: string;
}

export default function PeminjamanAlatForm() {
  const pathname = usePathname();
  const scopeRef = useViewEntrance(pathname || "");

  const [form, setForm] = useState<FormField>({
    name: "",
    nim: "",
    items: "",
    date: "",
    returnDate: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.nim.trim() ||
      !form.items.trim() ||
      !form.date
    ) {
      setError("Harap isi semua field yang wajib.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sekretariat/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "submit-form",
          formType: "Peminjaman Alat Musik",
          name: form.name,
          nim: form.nim,
          items: form.items,
          date: form.date,
          notes: form.returnDate
            ? `Rencana kembali: ${form.returnDate}. ${form.notes}`
            : form.notes,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!res.ok || !data.success) {
        setError(data.error ?? "Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Koneksi gagal. Periksa internet Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10">
              <svg
                className="h-7 w-7 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">
            Pengajuan Terkirim
          </h2>
          <p className="mt-3 text-stone-400">
            Sekretaris sudah menerima permintaan peminjaman kamu. Tunggu
            konfirmasi persetujuan melalui kontak yang tertera.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scopeRef} className="flex-1 px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div data-animate="up" className="mb-10">
          <p className="text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
            Fasilitas
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-white">
            Peminjaman Alat Musik
          </h1>
          <p className="mt-3 text-stone-400">
            Ajukan peminjaman alat musik milik HIMA MUSIK. Permintaan akan masuk
            ke Kanban board Sekretaris untuk diproses.
          </p>
          <hr className="mt-6 border-stone-800" />
        </div>

        <form
          onSubmit={handleSubmit}
          data-animate="up"
          data-animate-delay="0.1"
          className="space-y-6"
        >
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:ring-1 focus:outline-none"
              placeholder="Nama sesuai KTM"
            />
          </div>

          {/* NIM */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              NIM <span className="text-red-400">*</span>
            </label>
            <input
              name="nim"
              value={form.nim}
              onChange={handleChange}
              className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:ring-1 focus:outline-none"
              placeholder="Contoh: 2211XXXXXX"
            />
          </div>

          {/* Items */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              Alat yang Dipinjam <span className="text-red-400">*</span>
            </label>
            <textarea
              name="items"
              value={form.items}
              onChange={handleChange}
              rows={3}
              className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full resize-none rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:ring-1 focus:outline-none"
              placeholder="Daftar alat: Drum Set, Keyboard Yamaha, dsb."
            />
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-300">
                Tanggal Pinjam <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-300">
                Tanggal Kembali
              </label>
              <input
                type="date"
                name="returnDate"
                value={form.returnDate}
                onChange={handleChange}
                className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              Catatan Tambahan
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full resize-none rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:ring-1 focus:outline-none"
              placeholder="Info tambahan: keperluan, lokasi penggunaan, dll."
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gold-500 hover:bg-gold-400 w-full rounded-lg px-6 py-3 text-sm font-semibold text-black transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Mengirim..." : "Ajukan Peminjaman"}
          </button>
        </form>
      </div>
    </div>
  );
}
