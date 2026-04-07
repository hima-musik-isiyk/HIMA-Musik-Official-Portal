/* ------------------------------------------------------------------ */
/*  KKM (Kelompok Kegiatan Mahasiswa) data contracts                   */
/* ------------------------------------------------------------------ */

export interface KKMGroup {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  socialLinks: string[];
}

export const KKM_ENTRY_ORDER = [
  "Orkes Mahasiswa",
  "Student Symphonic Band",
  "Kelompok Studi Perkusi",
  "F-Hole",
  "Gitar Ekstra Mahasiswa",
  "Clavier",
  "Serenata",
  "Aksaratala",
] as const;
