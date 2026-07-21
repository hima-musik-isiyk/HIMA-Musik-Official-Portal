/**
 * Notion CMS Glossarium — Relation Map
 * ========================================
 * Maps how databases relate to each other in the Notion CMS.
 * Sourced from the relation properties in the schema crawl.
 */

export const RELATION_MAP = {
  "01 Content Component": {
    SECTIONS: "01 Sections",
    COMPONENT_TYPES: "01 Component Types",
    GROUP_DIV_CATEGORY: "01 Group Div Category",
  },
  "01 Component Types": {
    CONTENT_COMPONENT: "01 Content Component",
  },
  "01 Group Div Category": {
    CONTENT_COMPONENT: "01 Content Component",
  },
  "01 Sections": {
    PAGES: "01 Pages",
  },
  "02 Struktur Organisasi": {
    TUGAS_UTAMA_DIVISI: "03 Tugas Utama Divisi",
    NAMA_JABATAN: "04 Nama Jabatan",
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  "02 Storage: Aduan": {
    KATEGORI_ADUAN: "03 Kategori Aduan",
  },
  "02 Dokumen Sekretariat": {
    KATEGORI_DOKUMEN: "03 Kategori Dokumen",
  },
  "03 SDM & Evaluasi": {
    STRUKTUR_ORGANISASI: "02 Struktur Organisasi",
    NAMA_JABATAN: "04 Nama Jabatan",
    TIPE_JABATAN: "04 Tipe Jabatan",
    JOBDESK_JABATAN: "04 Jobdesk Jabatan",
    BATCH_PENDAFTARAN: "03 Batch Pendaftaran",
    PROYEK: "03 Proyek",
    REKAM_PRESENSI: "03 Rekam Presensi",
    TUGAS_TICKET: "03 Tugas/Ticket",
    PENDAFTARAN_PILIHAN_1: "02 Storage: Pendaftaran",
    PENDAFTARAN_PILIHAN_2: "02 Storage: Pendaftaran",
    KEUANGAN: "Keuangan",
  },
  "03 Kategori Aduan": {
    STORAGE_ADUAN: "02 Storage: Aduan",
  },
  "03 Kategori Dokumen": {
    DOKUMEN_SEKRETARIAT: "02 Dokumen Sekretariat",
  },
  "03 Tugas Utama Divisi": {
    STRUKTUR_ORGANISASI: "02 Struktur Organisasi",
  },
  "03 Batch Pendaftaran": {
    TAHAPAN_REKRUTMEN: "03 Tahapan Rekrutmen",
    SDM_EVALUASI: "03 SDM & Evaluasi",
    PENDAFTARAN_STORAGE: "02 Storage: Pendaftaran",
  },
  "03 Tahapan Rekrutmen": {
    BATCH_PENDAFTARAN: "03 Batch Pendaftaran",
    PROYEK: "03 Proyek",
  },
  "02 Storage: Pendaftaran": {
    BATCH_PENDAFTARAN: "03 Batch Pendaftaran",
    SDM_EVALUASI_PILIHAN_1: "03 SDM & Evaluasi",
    SDM_EVALUASI_PILIHAN_2: "03 SDM & Evaluasi",
  },
  "04 Jobdesk Jabatan": {
    NAMA_JABATAN: "04 Nama Jabatan",
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  "04 Nama Jabatan": {
    STRUKTUR_ORGANISASI: "02 Struktur Organisasi",
    JOBDESK_JABATAN: "04 Jobdesk Jabatan",
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  "04 Tipe Jabatan": {
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  "Arsip Survei & Riset": {
    PROYEK: "03 Proyek",
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  "Penjualan & Inventaris": {
    PROYEK: "03 Proyek",
    VENDOR_SUPPLIER: "Vendor & Supplier",
  },
  "Mitra & Sponsor (CRM)": {
    PROYEK: "03 Proyek",
  },
  "Vendor & Supplier": {
    KEUANGAN: "Keuangan",
  },
  "Manajemen Logistik": {
    VENDOR_SUPPLIER: "Vendor & Supplier",
    PROYEK: "03 Proyek",
  },
  "Talent & Pengisi Acara": {
    PROYEK: "03 Proyek",
  },
  "03 Proyek": {
    SDM_EVALUASI: "03 SDM & Evaluasi",
    STRUKTUR_ORGANISASI: "02 Struktur Organisasi",
    KEUANGAN: "Keuangan",
    TAHAPAN_REKRUTMEN: "03 Tahapan Rekrutmen",
  },
  "Rekam Advokasi Lanjutan": {
    SDM_EVALUASI: "03 SDM & Evaluasi",
    STORAGE_ADUAN: "02 Storage: Aduan",
  },
  "Jejaring Kampus & Media": {
    PROYEK: "03 Proyek",
  },
  "Pustaka Aset": {
    PROYEK: "03 Proyek",
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  "Jadwal Konten": {
    PROYEK: "03 Proyek",
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  "03 Tugas/Ticket": {
    SDM_EVALUASI_PEMBERI: "03 SDM & Evaluasi",
    SDM_EVALUASI_PELAKSANA: "03 SDM & Evaluasi",
    PROYEK: "03 Proyek",
  },
  "03 Rekam Presensi": {
    RAPAT: "Rapat",
    SDM_EVALUASI: "03 SDM & Evaluasi",
  },
  Rapat: {
    STRUKTUR_ORGANISASI: "02 Struktur Organisasi",
    SDM_EVALUASI_DAFTAR_UNDANGAN: "03 SDM & Evaluasi",
    REKAM_PRESENSI: "03 Rekam Presensi",
    PROYEK: "03 Proyek",
    SDM_EVALUASI_NOTULIS: "03 SDM & Evaluasi",
  },
  "Rekapitulasi Kas": {
    KEUANGAN: "Keuangan",
  },
  Keuangan: {
    PROYEK: "03 Proyek",
    VENDOR_SUPPLIER: "Vendor & Supplier",
    REKAPITULASI_KAS: "Rekapitulasi Kas",
    SDM_EVALUASI_INTERNAL: "03 SDM & Evaluasi",
  },
} as const;
