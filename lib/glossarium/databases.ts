/**
 * Notion CMS Glossarium — Database Registry
 * ============================================
 * Source of truth for all Notion databases known to this repo.
 * Derived from script output (A), maintained by hand (B).
 *
 * Run `npx tsx scripts/notion-roaming-fetcher.ts` to audit this
 * file against the live Notion workspace.
 */

// ──────────────────────────────────────────────────────────────
//  CMS Status types
// ──────────────────────────────────────────────────────────────

export type CMSStatus = "CMS" | "CMS but not used" | "not CMS";

// ──────────────────────────────────────────────────────────────
//  Database name constants (replaces old notion-db-ids.ts)
// ──────────────────────────────────────────────────────────────

// Layer 00 — Registry itself
export const DB_DATABASE_REGISTRY =
  process.env.NOTION_DATABASE_REGISTRY_ID ?? "";

// Layer 01 — CMS Page Builder
export const DB_MINDSET = "01 Mindset";
export const DB_COMPONENT_TYPES = "01 Component Types";
export const DB_CONTENT_COMPONENT = "01 Content Component";
export const DB_FOOTER = "01 Footer";
export const DB_REDIRECT = "01 Redirect";
export const DB_GROUP_DIV_CATEGORY = "01 Group Div Category";
export const DB_VARIABLES = "01 Variables";
export const DB_SECTIONS = "01 Sections";
export const DB_PAGES = "01 Pages";

// Layer 02 — Storage & Forms
export const DB_FAQ_STORAGE = "02 Storage: FAQ";
export const DB_STRUKTUR_ORGANISASI = "02 Struktur Organisasi";
export const DB_KKM = "02 KKM";
export const DB_PENDAFTARAN_STORAGE = "02 Storage: Pendaftaran";
export const DB_KARYA_FORM_STORAGE = "02 Form & Storage: Karya";
export const DB_AGENDA_FORM_STORAGE = "02 Form & Storage: Agenda";
export const DB_ADUAN_STORAGE = "02 Storage: Aduan";
export const DB_DOKUMEN_SEKRETARIAT = "02 Dokumen Sekretariat";

// Layer 03 — Operational Data
export const DB_BATCH_PENDAFTARAN = "03 Batch Pendaftaran";
export const DB_TAHAPAN_REKRUTMEN = "03 Tahapan Rekrutmen";
export const DB_SDM_EVALUASI = "03 SDM & Evaluasi";
export const DB_TUGAS_UTAMA_DIVISI = "03 Tugas Utama Divisi";
export const DB_PROYEK = "03 Proyek";
export const DB_KATEGORI_ADUAN = "03 Kategori Aduan";
export const DB_KATEGORI_DOKUMEN = "03 Kategori Dokumen";
export const DB_TUGAS_TICKET = "03 Tugas/Ticket";
export const DB_REKAM_PRESENSI = "03 Rekam Presensi";

// Layer 04 — Jabatan / Position
export const DB_JOBDESK_JABATAN = "04 Jobdesk Jabatan";
export const DB_NAMA_JABATAN = "04 Nama Jabatan";
export const DB_TIPE_JABATAN = "04 Tipe Jabatan";

// Beranda & Profil (page-embedded databases, not in registry)
export const DB_BERANDA_HERO = "Beranda Hero";
export const DB_BERANDA_JELAJAHI = "Beranda Jelajahi";
export const DB_KKM_HERO = "02 KKM Hero";
export const DB_PROFIL_SECTION = "Profil Section";
export const DB_PROFIL_KABINET = "Profil Kabinet";

// Ops / Internal databases
export const DB_SOP_KEBIJAKAN = "SOP & Kebijakan";
export const DB_MODUL_PEMBELAJARAN = "Modul Pembelajaran";
export const DB_ARSIP_SURVEI_RISET = "Arsip Survei & Riset";
export const DB_PENJUALAN_INVENTARIS = "Penjualan & Inventaris";
export const DB_MITRA_SPONSOR_CRM = "Mitra & Sponsor (CRM)";
export const DB_VENDOR_SUPPLIER = "Vendor & Supplier";
export const DB_MANAJEMEN_LOGISTIK = "Manajemen Logistik";
export const DB_TALENT_PENGISI_ACARA = "Talent & Pengisi Acara";
export const DB_REKAM_ADVOKASI_LANJUTAN = "Rekam Advokasi Lanjutan";
export const DB_JEJARING_KAMPUS_MEDIA = "Jejaring Kampus & Media";
export const DB_PUSTAKA_ASET = "Pustaka Aset";
export const DB_JADWAL_KONTEN = "Jadwal Konten";
export const DB_RAPAT = "Rapat";
export const DB_REKAPITULASI_KAS = "Rekapitulasi Kas";
export const DB_KEUANGAN = "Keuangan";

// ──────────────────────────────────────────────────────────────
//  Database metadata registry
//  For each DB: CMS status + teamspace (from last script run)
// ──────────────────────────────────────────────────────────────

export interface DatabaseMeta {
  name: string;
  cmsStatus: CMSStatus;
  teamspace: string;
}

export const DATABASE_META: Record<string, DatabaseMeta> = {
  [DB_PAGES]: { name: DB_PAGES, cmsStatus: "CMS", teamspace: "CMS" },
  [DB_SECTIONS]: { name: DB_SECTIONS, cmsStatus: "CMS", teamspace: "CMS" },
  [DB_CONTENT_COMPONENT]: {
    name: DB_CONTENT_COMPONENT,
    cmsStatus: "CMS",
    teamspace: "CMS",
  },
  [DB_COMPONENT_TYPES]: {
    name: DB_COMPONENT_TYPES,
    cmsStatus: "CMS",
    teamspace: "CMS",
  },
  [DB_VARIABLES]: { name: DB_VARIABLES, cmsStatus: "CMS", teamspace: "CMS" },
  [DB_FOOTER]: { name: DB_FOOTER, cmsStatus: "CMS", teamspace: "CMS" },
  [DB_REDIRECT]: { name: DB_REDIRECT, cmsStatus: "CMS", teamspace: "CMS" },
  [DB_GROUP_DIV_CATEGORY]: {
    name: DB_GROUP_DIV_CATEGORY,
    cmsStatus: "CMS",
    teamspace: "CMS",
  },
  [DB_MINDSET]: { name: DB_MINDSET, cmsStatus: "CMS", teamspace: "Onboarding" },
  [DB_FAQ_STORAGE]: {
    name: DB_FAQ_STORAGE,
    cmsStatus: "CMS",
    teamspace: "Divisi Riset dan Data",
  },
  [DB_STRUKTUR_ORGANISASI]: {
    name: DB_STRUKTUR_ORGANISASI,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_KKM]: {
    name: DB_KKM,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_PENDAFTARAN_STORAGE]: {
    name: DB_PENDAFTARAN_STORAGE,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_KARYA_FORM_STORAGE]: {
    name: DB_KARYA_FORM_STORAGE,
    cmsStatus: "CMS",
    teamspace: "Divisi Ekonomi Kreatif",
  },
  [DB_AGENDA_FORM_STORAGE]: {
    name: DB_AGENDA_FORM_STORAGE,
    cmsStatus: "CMS",
    teamspace: "Divisi Program dan Event",
  },
  [DB_ADUAN_STORAGE]: {
    name: DB_ADUAN_STORAGE,
    cmsStatus: "CMS",
    teamspace: "Divisi Humas dan Advokasi",
  },
  [DB_DOKUMEN_SEKRETARIAT]: {
    name: DB_DOKUMEN_SEKRETARIAT,
    cmsStatus: "CMS",
    teamspace: "Badan Pengurus Harian",
  },
  [DB_BATCH_PENDAFTARAN]: {
    name: DB_BATCH_PENDAFTARAN,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_TAHAPAN_REKRUTMEN]: {
    name: DB_TAHAPAN_REKRUTMEN,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_SDM_EVALUASI]: {
    name: DB_SDM_EVALUASI,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_TUGAS_UTAMA_DIVISI]: {
    name: DB_TUGAS_UTAMA_DIVISI,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_PROYEK]: {
    name: DB_PROYEK,
    cmsStatus: "CMS but not used",
    teamspace: "Divisi Program dan Event",
  },
  [DB_KATEGORI_ADUAN]: {
    name: DB_KATEGORI_ADUAN,
    cmsStatus: "CMS",
    teamspace: "Divisi Humas dan Advokasi",
  },
  [DB_KATEGORI_DOKUMEN]: {
    name: DB_KATEGORI_DOKUMEN,
    cmsStatus: "CMS",
    teamspace: "Badan Pengurus Harian",
  },
  [DB_TUGAS_TICKET]: {
    name: DB_TUGAS_TICKET,
    cmsStatus: "CMS but not used",
    teamspace: "Badan Pengurus Harian",
  },
  [DB_REKAM_PRESENSI]: {
    name: DB_REKAM_PRESENSI,
    cmsStatus: "CMS but not used",
    teamspace: "Badan Pengurus Harian",
  },
  [DB_JOBDESK_JABATAN]: {
    name: DB_JOBDESK_JABATAN,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_NAMA_JABATAN]: {
    name: DB_NAMA_JABATAN,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_TIPE_JABATAN]: {
    name: DB_TIPE_JABATAN,
    cmsStatus: "CMS",
    teamspace: "Divisi Pengembangan Sumber Daya Mahasiswa",
  },
  [DB_SOP_KEBIJAKAN]: {
    name: DB_SOP_KEBIJAKAN,
    cmsStatus: "not CMS",
    teamspace: "Onboarding",
  },
  [DB_MODUL_PEMBELAJARAN]: {
    name: DB_MODUL_PEMBELAJARAN,
    cmsStatus: "not CMS",
    teamspace: "Onboarding",
  },
  [DB_ARSIP_SURVEI_RISET]: {
    name: DB_ARSIP_SURVEI_RISET,
    cmsStatus: "not CMS",
    teamspace: "Divisi Riset dan Data",
  },
  [DB_PENJUALAN_INVENTARIS]: {
    name: DB_PENJUALAN_INVENTARIS,
    cmsStatus: "not CMS",
    teamspace: "Divisi Ekonomi Kreatif",
  },
  [DB_MITRA_SPONSOR_CRM]: {
    name: DB_MITRA_SPONSOR_CRM,
    cmsStatus: "not CMS",
    teamspace: "Divisi Ekonomi Kreatif",
  },
  [DB_VENDOR_SUPPLIER]: {
    name: DB_VENDOR_SUPPLIER,
    cmsStatus: "not CMS",
    teamspace: "Divisi Ekonomi Kreatif",
  },
  [DB_MANAJEMEN_LOGISTIK]: {
    name: DB_MANAJEMEN_LOGISTIK,
    cmsStatus: "not CMS",
    teamspace: "Divisi Program dan Event",
  },
  [DB_TALENT_PENGISI_ACARA]: {
    name: DB_TALENT_PENGISI_ACARA,
    cmsStatus: "not CMS",
    teamspace: "Divisi Program dan Event",
  },
  [DB_REKAM_ADVOKASI_LANJUTAN]: {
    name: DB_REKAM_ADVOKASI_LANJUTAN,
    cmsStatus: "not CMS",
    teamspace: "Divisi Humas dan Advokasi",
  },
  [DB_JEJARING_KAMPUS_MEDIA]: {
    name: DB_JEJARING_KAMPUS_MEDIA,
    cmsStatus: "not CMS",
    teamspace: "Divisi Humas dan Advokasi",
  },
  [DB_PUSTAKA_ASET]: {
    name: DB_PUSTAKA_ASET,
    cmsStatus: "not CMS",
    teamspace: "Divisi Publikasi Desain Dokumentasi",
  },
  [DB_JADWAL_KONTEN]: {
    name: DB_JADWAL_KONTEN,
    cmsStatus: "not CMS",
    teamspace: "Divisi Publikasi Desain Dokumentasi",
  },
  [DB_RAPAT]: {
    name: DB_RAPAT,
    cmsStatus: "not CMS",
    teamspace: "Badan Pengurus Harian",
  },
  [DB_REKAPITULASI_KAS]: {
    name: DB_REKAPITULASI_KAS,
    cmsStatus: "not CMS",
    teamspace: "Badan Pengurus Harian",
  },
  [DB_KEUANGAN]: {
    name: DB_KEUANGAN,
    cmsStatus: "not CMS",
    teamspace: "Badan Pengurus Harian",
  },
};
