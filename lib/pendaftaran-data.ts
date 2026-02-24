export type Division = {
  id: string;
  name: string;
  summary: string;
  focus: string;
  tasks: string[];
  skills: string[];
  commitment: string;
};

export const divisions: Division[] = [
  {
    id: "humas",
    name: "Humas & Kemitraan",
    summary:
      "Menjaga relasi internal kampus dan eksternal, kolaborasi event, dan komunikasi antar organisasi. Slot: 2 orang, terbuka untuk angkatan 2023–2025.",
    focus: "Relasi internal & eksternal, komunikasi strategis",
    tasks: [
      "Mengelola komunikasi dengan mitra internal (prodi, dosen, HIMA lain, KKM) dan eksternal (sponsor, komunitas musik, media partner)",
      "Menyusun proposal kolaborasi",
      "Menjadi penghubung antar divisi dan pihak luar",
    ],
    skills: ["Communication", "Negotiation", "Networking"],
    commitment: "Fleksibel sesuai agenda kolaborasi",
  },
  {
    id: "program-event",
    name: "Divisi Program & Event",
    summary:
      "Merancang konsep kegiatan, menyusun rundown, manajemen kepanitiaan, dan eksekusi event HIMA. Slot: 2 orang, terbuka untuk angkatan 2023–2025.",
    focus: "Perencanaan, konsep acara & eksekusi event",
    tasks: [
      "Menyusun konsep dan perencanaan acara",
      "Koordinasi teknis, logistik, dan manajemen kepanitiaan",
      "Menjaga flow acara saat eksekusi",
    ],
    skills: ["Planning", "Coordination", "Problem Solving"],
    commitment: "Intensif saat persiapan event",
  },
  {
    id: "pdd",
    name: "Publikasi, Desain & Dokumentasi",
    summary:
      "Menghasilkan konten visual, dokumentasi kegiatan, dan identitas kampanye. Slot: 3 orang, terbuka untuk angkatan 2023–2025. Terdapat 3 sub-fokus: Desain (visual identity, poster, brand guideline), Publikasi & Media Sosial (content calendar, distribusi info), Dokumentasi (foto/video, aftermovie).",
    focus: "Branding, storytelling & dokumentasi",
    tasks: [
      "Desain: membuat visual identity, poster, feed IG, template, brand guideline",
      "Publikasi & Media Sosial: menyusun content calendar, distribusi info, kelola platform",
      "Dokumentasi: fotografi/videografi kegiatan, seleksi & arsip, aftermovie",
    ],
    skills: ["Design", "Photography", "Storytelling", "Content Creation"],
    commitment: "Menyesuaikan timeline publikasi dan jadwal event",
  },
  {
    id: "co-sekretaris",
    name: "Co-Sekretaris",
    summary:
      "Membantu kinerja Sekretaris dalam administrasi internal harian, notulensi, dan database keanggotaan. Slot: 1 orang, khusus angkatan 2024–2025.",
    focus: "Administrasi & dokumentasi internal",
    tasks: [
      "Membantu administrasi internal harian",
      "Notulensi rapat dan kegiatan",
      "Mengelola database keanggotaan",
    ],
    skills: ["Organization", "Attention to Detail", "Communication"],
    commitment: "Rutin mengikuti rapat dan koordinasi internal",
  },
  {
    id: "co-bendahara",
    name: "Co-Bendahara",
    summary:
      "Membantu Bendahara dalam pencatatan transaksi, kwitansi, laporan keuangan per acara, dan penyusunan RAB. Slot: 1 orang, khusus angkatan 2024–2025.",
    focus: "Keuangan & transparansi anggaran",
    tasks: [
      "Pencatatan transaksi dan kwitansi",
      "Menyusun laporan keuangan per acara",
      "Membantu penyusunan Rencana Anggaran Biaya (RAB)",
    ],
    skills: ["Accounting basics", "Organization", "Integrity"],
    commitment: "Rutin mengikuti rapat dan koordinasi keuangan",
  },
];

export const RECRUITMENT_PERIOD = "01–21 Maret 2026";

export const SELECTION_TIMELINE = [
  {
    title: "Pendaftaran",
    date: RECRUITMENT_PERIOD,
    description: "Isi formulir dan pastikan data kontak aktif.",
  },
  {
    title: "Seleksi Administrasi",
    date: "22–25 Maret 2026",
    description: "Panitia melakukan verifikasi data pendaftar.",
  },
  {
    title: "Wawancara",
    date: "26–28 Maret 2026",
    description: "Wawancara singkat untuk divisi tertentu jika diperlukan.",
  },
  {
    title: "Pengumuman",
    date: "30 Maret 2026",
    description: "Hasil seleksi diumumkan via email dan kanal resmi.",
  },
];
