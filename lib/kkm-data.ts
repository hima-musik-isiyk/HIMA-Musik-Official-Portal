/* ------------------------------------------------------------------ */
/*  KKM (Kelompok Kegiatan Mahasiswa) data                              */
/* ------------------------------------------------------------------ */

export interface KKMGroup {
  /** Unique slug – used for anchors and potential sub-routes */
  slug: string;
  /** Full official name */
  name: string;
  /** One-liner tagline */
  tagline: string;
  /** Longer description (2-3 sentences) */
  description: string;
  /** Instagram handle (without @) */
  instagram?: string;
  /** Year the KKM was established, if known */
  established?: string;
  /** Current recruitment status */
  recruitmentOpen: boolean;
}

/**
 * The 8 KKM groups under HIMA MUSIK ISI Yogyakarta,
 * as defined in AD/ART Pasal 27.
 */
export const KKM_GROUPS: KKMGroup[] = [
  {
    slug: "orkes-mahasiswa",
    name: "KKM Orkes Mahasiswa",
    tagline: "Orkestrasi Kebanggaan Kampus",
    description:
      "Kelompok orkestra mahasiswa yang membawakan repertoar klasik hingga kontemporer. Tempat belajar bermain bersama dalam formasi besar.",
    instagram: "orkes.mahasiswa_official",
    recruitmentOpen: false,
  },
  {
    slug: "studsy",
    name: "KKM Student Symphonic Band",
    tagline: "The Sound of ISI",
    description:
      "Symphonic band yang menggabungkan instrumen tiup, perkusi, dan string dalam formasi concert band modern.",
    instagram: "studsyyogyakarta",
    recruitmentOpen: false,
  },
  {
    slug: "kesper",
    name: "KKM Kelompok Studi Perkusi",
    tagline: "Rhythm Without Boundaries",
    description:
      "Komunitas perkusi yang mengeksplorasi tradisi dan inovasi ritmik — dari gamelan hingga drum corps.",
    instagram: "kesper_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "f-hole",
    name: "KKM F-Hole",
    tagline: "String Ensemble Community",
    description:
      "Komunitas alat gesek yang fokus pada repertoar string ensemble, chamber music, dan eksplorasi musik dawai.",
    instagram: "fholeofficial",
    recruitmentOpen: false,
  },
  {
    slug: "gema",
    name: "KKM Gitar Ekstra Mahasiswa",
    tagline: "Six Strings, One Voice",
    description:
      "Wadah gitaris kampus untuk mengembangkan kemampuan, mulai dari klasik, fingerstyle, hingga ensemble gitar.",
    instagram: "gema_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "clavier",
    name: "KKM Clavier",
    tagline: "Keys to Expression",
    description:
      "Komunitas pemain keyboard dan piano yang mengeksplorasi solo, ensemble, dan kolaborasi lintas genre.",
    instagram: "clavierstudent",
    recruitmentOpen: false,
  },
  {
    slug: "serenata",
    name: "KKM Vokal SERENATA",
    tagline: "Harmony in Every Voice",
    description:
      "Grup vokal yang menjadi wadah pengembangan teknik vokal — paduan suara, acapella, dan pertunjukan vokal.",
    instagram: "serenata.isi",
    recruitmentOpen: false,
  },
  {
    slug: "aksaratala",
    name: "KKM Jurnalistik Musik AKSARATALA",
    tagline: "Narrating the Sound",
    description:
      "Tim jurnalistik dan media yang mendokumentasikan, menulis, dan menyuarakan aktivitas musik kampus.",
    instagram: "aksaratala.isi",
    recruitmentOpen: false,
  },
];
