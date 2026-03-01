/* ------------------------------------------------------------------ */
/*  KKM (Kelompok Kegiatan Mahasiswa) data                              */
/* ------------------------------------------------------------------ */

export interface KKMGroup {
  /** Unique slug – used for anchors and potential sub-routes */
  slug: string;
  /** Full official name */
  name: string;
  /** Short abbreviation shown in the card header */
  abbreviation: string;
  /** One-liner tagline */
  tagline: string;
  /** Longer description (2-3 sentences) */
  description: string;
  /** Emoji or icon character used as a visual accent */
  icon: string;
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
    abbreviation: "OM",
    tagline: "Orkestrasi Kebanggaan Kampus",
    description:
      "Kelompok orkestra mahasiswa yang membawakan repertoar klasik hingga kontemporer. Tempat belajar bermain bersama dalam formasi besar.",
    icon: "🎻",
    instagram: "om_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "studsy",
    name: "KKM Student Symphonic Band",
    abbreviation: "Studsy",
    tagline: "The Sound of ISI",
    description:
      "Symphonic band yang menggabungkan instrumen tiup, perkusi, dan string dalam formasi concert band modern.",
    icon: "🎺",
    instagram: "studsy_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "kesper",
    name: "KKM Kelompok Studi Perkusi",
    abbreviation: "Kesper",
    tagline: "Rhythm Without Boundaries",
    description:
      "Komunitas perkusi yang mengeksplorasi tradisi dan inovasi ritmik — dari gamelan hingga drum corps.",
    icon: "🥁",
    instagram: "kesper_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "f-hole",
    name: "KKM F-Hole",
    abbreviation: "F-Hole",
    tagline: "String Ensemble Community",
    description:
      "Komunitas alat gesek yang fokus pada repertoar string ensemble, chamber music, dan eksplorasi musik dawai.",
    icon: "🎶",
    instagram: "fhole_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "gema",
    name: "KKM Gitar Ekstra Mahasiswa",
    abbreviation: "GEMA",
    tagline: "Six Strings, One Voice",
    description:
      "Wadah gitaris kampus untuk mengembangkan kemampuan, mulai dari klasik, fingerstyle, hingga ensemble gitar.",
    icon: "🎸",
    instagram: "gema_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "clavier",
    name: "KKM Clavier",
    abbreviation: "Clavier",
    tagline: "Keys to Expression",
    description:
      "Komunitas pemain keyboard dan piano yang mengeksplorasi solo, ensemble, dan kolaborasi lintas genre.",
    icon: "🎹",
    instagram: "clavier_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "serenata",
    name: "KKM Vokal SERENATA",
    abbreviation: "SERENATA",
    tagline: "Harmony in Every Voice",
    description:
      "Grup vokal yang menjadi wadah pengembangan teknik vokal — paduan suara, acapella, dan pertunjukan vokal.",
    icon: "🎤",
    instagram: "serenata_isiyk",
    recruitmentOpen: false,
  },
  {
    slug: "aksaratala",
    name: "KKM Jurnalistik Musik AKSARATALA",
    abbreviation: "AKSARATALA",
    tagline: "Narrating the Sound",
    description:
      "Tim jurnalistik dan media yang mendokumentasikan, menulis, dan menyuarakan aktivitas musik kampus.",
    icon: "✍️",
    instagram: "aksaratala_isiyk",
    recruitmentOpen: false,
  },
];
