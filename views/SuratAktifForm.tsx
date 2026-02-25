"use client";

import React, { useState } from "react";

interface FormField {
  name: string;
  nim: string;
  department: string;
  reason: string;
}

export default function SuratAktifForm() {
  const [form, setForm] = useState<FormField>({
    name: "",
    nim: "",
    department: "",
    reason: "",
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

    if (!form.name.trim() || !form.nim.trim() || !form.department.trim()) {
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
          formType: "Surat Aktif Organisasi",
          name: form.name,
          nim: form.nim,
          department: form.department,
          reason: form.reason,
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
          <h2 className="font-serif text-2xl font-bold text-white">
            Permintaan Terkirim
          </h2>
          <p className="mt-3 text-stone-400">
            Sekretaris telah menerima notifikasi dan akan memproses surat Anda.
            Silakan hubungi Sekretaris jika membutuhkan tindak lanjut.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
            Surat Keterangan
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-white">
            Pengajuan Surat Aktif Organisasi
          </h1>
          <p className="mt-3 text-stone-400">
            Form ini akan otomatis membuat kartu tugas di board Sekretaris dan
            mengirim notifikasi via Telegram.
          </p>
          <hr className="mt-6 border-stone-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Department */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              Program Studi <span className="text-red-400">*</span>
            </label>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:ring-1 focus:outline-none"
              placeholder="Musik / Seni Pertunjukan"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              Keperluan / Alasan
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={4}
              className="focus:border-gold-500/50 focus:ring-gold-500/30 w-full resize-none rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:ring-1 focus:outline-none"
              placeholder="Tujuan pengajuan surat (opsional)"
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
            {isSubmitting ? "Mengirim..." : "Kirim Permintaan Surat"}
          </button>
        </form>
      </div>
    </div>
  );
}
