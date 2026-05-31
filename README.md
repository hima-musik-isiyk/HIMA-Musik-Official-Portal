## Overview

This repository contains the official portal for Himpunan Mahasiswa Musik (HIMA MUSIK) ISI Yogyakarta.
It is a modern web application built on the **Next.js App Router** framework, featuring dynamic content management, real-time collaboration rooms, automated administration sync, and highly-stylized user experiences powered by GSAP and Framer Motion.

The portal focuses on:

- Presenting organizational profile, cabinet structure, and vision for the 2026 cabinet
- Showcasing dynamic events and Kelompok Kegiatan Mahasiswa (KKM) portals
- Providing a public FAQ channel where students can browse answers and submit new questions (backed by a Notion database)
- Providing an advocacy channel with AI-assisted text refinement for student aspirations
- Serving as a central, interactive Secretariat portal for documents, SOPs, archives, and self-service requests
- Enabling internal admin tools like Canva-to-Instagram grid planning and real-time Notion context rooms

## Features

- **Dynamic Landing Page:** Sleek homepage featuring responsive layouts, kinetic typography, and fluid entrance animations.
- **Cabinet Profile & KKM:** Sourced directly from Notion, organizing divisions, cabinet hierarchies, and student interest groups.
- **Kalender Agenda:** Live tracking of academic schedules, projects, and repost schedules categorized by lifecycle (route: `/agenda`).
- **FAQ & Tanya Jawab:** Impromptu, quick-response Q&A board backed by a Notion database (route: `/faq`).
  - Merged spreadsheet-inspired board showing both answered and unanswered questions clearly in a unified, high-density interactive grid table.
  - Submit new impromptu questions via a collapsible glassmorphic drawer panel that maximizes table visibility.
  - Active real-time background polling (every 5 seconds) paired with a pulsing live sync indicator.
  - Hand-crafted inline thin-stroke SVG icons matching the unified design system.
  - Search query filters across questions, askers, and answers, alongside category and status lifecycle filters.
  - Custom Minecraft Standard Galactic character scrambler obfuscation for hidden content.
  - Dynamic page-by-page rendering with custom retro-themed `PaginationControl` for the board.
- **FAQ Resmi HIMA:** Curated official help documentation managed by the cabinet (route: `/sekretariat/faq`).
  - Dynamic rendering as a structured document page directly compiled from the Notion Sekretariat database using `NotionRenderer`.
  - Supports rich-block styling, toggle lists, side table of contents with IDE-style sticky scope breadcrumbs (ancestor headings pin seamlessly at the top as you scroll, closing the gap to prevent header duplication with a dynamic ResizeObserver-based height measurement for precise scroll-padding offsets), and responsive layouts.
- **Ruang Advokasi (Aduan):**
  - Category-based submission of complaints (Akademik, Fasilitas, Organisasi, Lainnya)
  - AI-assisted message refinement utilizing Groq (Llama 3)
  - Discord webhook integration for real-time administrator notifications
  - Notion database integration for permanent digital archiving and admin tracking
  - Local draft recovery using standard storage APIs
  - Custom chevron-decorated category selector matching the unified portal input styles
- **Etalase Karya Mahasiswa:** Interactive portfolio showcase featuring dynamic audio/video embeds (YouTube, Spotify, etc.) and oEmbed artwork fetching (route: `/karya`).
  - Search query matching by title and performer
  - Genre-based and platform-based drop-down filtering aligned with unified select styling
  - Instant play overlays and real-time playback control
- **Pusat Administrasi & Sekretariat:**
  - Dynamic SOPs, guidelines, archives, and reports compiled from Notion
  - Online self-service request forms (Surat Aktif Organisasi, Peminjaman Alat Musik)
  - Contextual citations and references resolved natively in real-time
- **Internal Admin Tools:**
  - **Notion Context Rooms:** Real-time multi-admin workspace leveraging Supabase for compilation, collaboration, and instant webhooks.
  - **Instagram Grid Planner:** 3-column planner featuring canvas parsing, Canva API integration, and automatic `sharp` image-slicing.

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Package Manager:** PNPM
- **Styling:** Tailwind CSS v4, Vanilla CSS
- **Animations:** GSAP (ScrollTrigger) & Framer Motion
- **CMS / Data Source:** Notion API (Data Sources paradigm, SDK v5.22.0)
- **Realtime & Storage:** Supabase (Realtime Channels & Bucket Storage)
- **Integrations & Services:**
  - **Groq API:** AI-assisted text processing
  - **Brevo (Sendinblue) Transactional Email:** Automatic submission receipt emails sent to respondents after Karya form submission (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`)
  - **Canva Graph API & Sharp:** Automation for grid slice exports
  - **Discord Webhooks:** Unified notification and error channels (`DISCORD_ADUAN_WEBHOOK_URL`, `DISCORD_FORMS_WEBHOOK_URL`)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- pnpm (v10+ recommended)

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env.local` file in the project root and configure the necessary environment variables:

   ```bash
   # --- AI & LLM Services ---
   GROQ_API_KEY=your_groq_api_key

   # --- Form Notifications to Discord ---
   DISCORD_ADUAN_WEBHOOK_URL=your_aduan_discord_webhook_url
   DISCORD_PENDAFTARAN_WEBHOOK_URL=your_pendaftaran_discord_webhook_url
   DISCORD_FORMS_WEBHOOK_URL=your_forms_discord_webhook_url
   DISCORD_FAQ_WEBHOOK_URL=your_faq_discord_webhook_url
   DISCORD_ERROR_WEBHOOK_URL=your_error_discord_webhook_url
   DISCORD_AGENDA_WEBHOOK_URL=your_agenda_discord_webhook_url
   DISCORD_KARYA_WEBHOOK_URL=your_karya_discord_webhook_url

   # --- Email Service (Brevo) ---
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=your_verified_sender@yourdomain.com

   # --- Notion Integration (7 Database CMS Final) ---
   NOTION_INTEGRATION_TOKEN=your_notion_integration_token
   NOTION_WEBHOOK_VERIFICATION_TOKEN=your_webhook_verification_token
   NOTION_BERANDA_PAGE_ID=your_beranda_page_id
   NOTION_PROFIL_PAGE_ID=your_profil_page_id
   NOTION_KKM_PAGE_ID=your_kkm_page_id
   NOTION_AGENDA_PAGE_ID=your_agenda_page_id
   NOTION_KARYA_PAGE_ID=your_karya_page_id
   NOTION_FAQ_PAGE_ID=your_faq_page_id
   NOTION_SEKRETARIAT_PAGE_ID=your_sekretariat_page_id
   NOTION_REDIRECT_PAGE_ID=your_redirect_page_id
   NOTION_ADUAN_PAGE_ID=your_aduan_page_id

   # --- Supabase Realtime & Keepalive ---
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_KEEPALIVE_TABLE=keepalive
   CRON_SECRET=your_cron_secret

   # --- Instagram Webhook to Discord ---
   VERIFY_TOKEN=your_verify_token
   DISCORD_WEBHOOK_URL=your_instagram_discord_webhook_url
   DISCORD_PARSED_WEBHOOK_URL=your_instagram_parsed_discord_webhook_url
   DISCORD_RAW_WEBHOOK_URL=your_instagram_raw_discord_webhook_url
   INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
   HIMA_INSTAGRAM_ID=your_instagram_account_id

   # --- Canva API ---
   CANVA_CLIENT_ID=your_canva_client_id
   CANVA_CLIENT_SECRET=your_canva_client_secret
   CANVA_ACCESS_TOKEN=your_canva_access_token
   CANVA_REFRESH_TOKEN=your_canva_refresh_token
   CANVA_REDIRECT_URI=your_canva_redirect_uri

   # --- Telegram API Credentials ---
   TG_API_ID=your_telegram_api_id
   TG_API_HASH=your_telegram_api_hash
   TG_PHONE=your_telegram_phone
   TG_CODE=your_telegram_code
   TG_CHAT_ID=your_telegram_chat_id
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Available Scripts

- `pnpm dev` – Start the local development server with hot-reloading
- `pnpm build` – Compile the application for production deployment
- `pnpm start` – Run the built production server locally
- `pnpm lint` – Audit the codebase for styling and type safety rules

## Project Structure

Routes are organized into semantic **Next.js Route Groups** matching the portal's public-facing sections and administrative workflows:

- `app/` – Core Next.js App Router structure:
  - `(public)/` – All public-facing pages:
    - `profil/` – HIMA Musik organizational profile (redirects from `/about`)
    - `kkm/` – Kelompok Kegiatan Mahasiswa community pages
    - `agenda/` – Events calendar and individual event pages (redirects from `/events`)
    - `faq/` – FAQ & Tanya Jawab board (Notion-backed)
    - `aduan/` – Student advocacy and complaint pipeline
    - `sekretariat/` – Documents, SOPs, archives, and self-service forms
  - `(internal)/` – Restricted administrator utilities (`instagram-secret-page/`, `notion-secret-page/`)
  - `(legal)/` – Regulatory pages (`data-deletion/`, `privacy-policy/`, `terms-of-service/`)
  - `api/` – Next.js API route handlers:
    - `webhook/` – Instagram webhook receiver (`GET` for hub verification, `POST` to parse events and forward embeds to Discord)
    - `notion/webhook/` – Generic Notion webhook endpoint. Performs real-time room sync and on-demand Next.js cache revalidation for CMS pages.
    - `webhooks/notion/` – Primary Notion webhook receiver (`GET` for healthcheck, `POST` to intercept Agenda form submissions, forward to Discord, trigger instant revalidation, and fall back to room sync and CMS revalidation)
  - `layout.tsx` & `page.tsx` – Global app layout and home view entry point
- `views/` – Page-level visual components, separating UI implementation from route declarations
- `components/` – Reusable layout shells and shared UI blocks (Navigation, Footer, Command Palette)
- `lib/` – Notion helper integrations, Supabase connectors, and custom hooks
- `services/` – Serverless parsing helpers and Groq AI text parsers

## Navigation

The navbar uses a flat 7-item structure (desktop & mobile):

| Label       | Route          | Notes                              |
| ----------- | -------------- | ---------------------------------- |
| Profil      | `/profil`      | Organizational profile & cabinet   |
| KKM         | `/kkm`         | Student interest groups            |
| Agenda      | `/agenda`      | Events & publications calendar     |
| FAQ         | `/faq`         | Q&A board                          |
| Sekretariat | `/sekretariat` | Admin portal & forms               |
| Aduan       | `/aduan`       | Advocacy channel                   |
| Kontak      | —              | Smooth-scrolls to footer `#kontak` |

Old URLs `/about` and `/events` redirect permanently to `/profil` and `/agenda` respectively.

## Content Model (Notion CMS Redesign)

The HIMA Musik portal features a dynamic Content Management System backed by **7 Notion Databases** managed exclusively by the Ketua. Below is the exact schema and property types defined in the Notion Teamspace:

### 1. Halaman Beranda Modular (`NOTION_BERANDA_PAGE_ID`)

Halaman utama Beranda dikelola secara modular melalui satu parent Notion Page ID yang menampung beberapa child databases di bawahnya. Sistem mendeteksi database-database ini secara dinamis berdasarkan urutan letaknya (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **Hero Section**
- **Database Kedua (Indeks 1)** bertindak sebagai **Jelajahi**

#### A. Database Hero Section (`t="Hero Section"`)

Konten dinamis untuk tombol CTA (Call to Action) dan deskripsi utama pada header.

- `Button Title` (Title) - Judul tombol utama.
- `Description` (Rich Text) - Deskripsi singkat di samping tombol.
- `Redirect` (Rich Text) - Link tujuan ketika tombol diklik.
- `Urutan` (Number) - Urutan prioritas tampilan.
- `Visible` (Checkbox) - Status visibilitas tombol.

#### B. Database Jelajahi (`t="Jelajahi"`)

Pintasan navigasi cepat menuju fitur-fitur portal HIMA Musik dengan grid responsif yang beradaptasi secara otomatis.

- `Button Title` (Title) - Nama layanan / tautan.
- `Description` (Rich Text) - Penjelasan singkat layanan.
- `Redirect` (Rich Text) - Link tujuan internal/eksternal.
- `Urutan` (Number) - Urutan urutan prioritas di dalam grid.
- `Visible` (Checkbox) - Mengontrol tampilan elemen di grid.

### 2. Halaman Profil Modular (`NOTION_PROFIL_PAGE_ID`)

Halaman Profil diakses melalui satu parent Notion Page ID yang menampung sub-databases dan mention database. Sistem mendeteksi elemen-elemen ini secara dinamis berdasarkan urutan letaknya (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **Profil Organisasi Section**
- **Database Kedua (Indeks 1)** bertindak sebagai **Struktur Kabinet**
- **Database Mention Pertama** bertindak sebagai **SDM & Evaluasi**

#### A. Database Profil Organisasi Section (`t="Profil Organisasi Section"`)

Konten paragraf deskripsi dan nama kabinet.

- `Item` (Title) - Nama item konfigurasi (misal: "Paragraf", "Nama Kabinet").
- `Deskripsi/Value` (Rich Text) - Nilai teks dari item terkait.

#### B. Database Struktur Kabinet (`t="Struktur Kabinet"`)

Mengatur batasan batch pengurus yang akan ditampilkan.

- `Isi` (Title) - Nama konfigurasi (misal: "Tampilkan Batch dari 1 Sampai").
- `Value` (Number) - Batas batch maksimal yang ingin ditampilkan.

#### C. Database SDM & Evaluasi (Database Mention)

Daftar seluruh pengurus, staf, dan lowongan posisi (kaderisasi). Database ini direferensikan sebagai database mention di dalam baris paragraf pada halaman Profil.

- `Nama Lengkap Staf` (Title) - Nama pengurus atau tag `[OPEN POSITION]`.
- `Jabatan Kabinet` (Multi-select) - Daftar jabatan di kabinet.
- `Divisi` (Relation) - Relasi ke database Divisi.
- `Batch` (Select) - Informasi batch pengurus (misal: "Batch 1 - Pendiri").
- `Status Keaktifan` (Select) - Status keaktifan (Aktif, Rekrutmen, Demisioner).

#### D. Fitur UX & Interaktivitas Divisi

Untuk menghadirkan pengalaman visual yang premium dan interaktif pada bagian Divisi:

- **Layout Grid Dua Kolom:** Menampilkan kartu-kartu divisi dalam layout grid 2 kolom (`md:grid-cols-2`).
- **Anchor "Terbuka" & Animasi Teks Berputar:** Ketika kursor diarahkan ke kartu divisi (hover), tulisan status lowongan berubah secara dinamis dengan efek transisi mewah. Kata `"Terbuka"` bertindak sebagai anchor statis di sebelah kiri, diikuti oleh badge/pill berwarna emas premium (`bg-gold-500/20`) yang memutar daftar posisi secara bergantian (misal: `Terbuka [Staf Acara]`, `Terbuka [Koordinator Event]`). Ketika idle (tidak dihover), badge tersebut kembali ke tulisan statis `"{slots} posisi terbuka"`.
- **Symmetric OrgChart & Smart Layout Control:** Menampilkan struktur BPH secara proporsional. BPH Batch 2 (seperti Co-Sekretaris atau Co-Bendahara) disembunyikan secara dinamis beserta garis penghubungnya jika melebihi batas batch maksimum yang dikonfigurasi di Notion, tanpa membuat kartu BPH utama meregang secara vertikal.

### 3. Halaman KKM Modular (`NOTION_KKM_PAGE_ID`)

Halaman utama KKM dikelola secara modular melalui satu parent Notion Page ID yang menampung sub-databases di bawahnya. Sistem mendeteksi database-database ini secara dinamis berdasarkan urutan letaknya (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **KKM: Hero Section**
- **Database Kedua (Indeks 1)** bertindak sebagai **KKM: Page Section**

#### A. Database KKM: Hero Section

Konten dinamis untuk judul dan deskripsi utama halaman KKM.

- `Name` (Title) - Nama elemen konfigurasi (misal: "Title", "Desc").
- `Value` (Rich Text) - Nilai teks dari konfigurasi terkait.

#### B. Database KKM: Page Section

Daftar seluruh unit KKM dan informasi profilnya.

- `Name` (Title) - Nama unit KKM (misal: `"OM"`, `"Studsy"`, `"Aksaratala"`).
- `Slug` (Rich Text) - Slug tautan halaman (misal: `"orkes-mahasiswa"`).
- `Urutan` / `Urutan Tampil` / `Order` (Number - Optional) - Prioritas urutan KKM di halaman grid. Urutan diurutkan secara menaik (ascending). Jika dikosongkan, unit KKM akan diurutkan secara alfabetis.
- `Jargon` (Rich Text) - Jargon atau tagline singkat.
- `Deskripsi Singkat` (Rich Text) - Deskripsi lengkap KKM.
- `Logo` (Files) - Logo atau avatar resmi KKM.
- `Instagram` (URL) - Link Instagram.
- `TikTok` (URL) - Link TikTok.
- `YouTube` (URL) - Link channel YouTube.

### 4. Halaman Agenda Modular (`NOTION_AGENDA_PAGE_ID`)

Halaman utama Agenda dikelola secara modular melalui satu parent Notion Page ID yang menampung child database `"Agenda: CMS dan Formulir"` di bawahnya (Indeks 0). Sistem mendeteksi database ini secara dinamis berdasarkan urutan letak (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **Agenda: CMS dan Formulir**

#### A. Database Agenda: CMS dan Formulir (`t="Agenda: CMS dan Formulir"`)

Daftar agenda kegiatan, program kerja, dan pengajuan acara KKM.

- `Nama Acara` (Title) - Nama kegiatan/acara.
- `Request Slug Khusus` (Rich Text) - Slug kustom untuk URL halaman detail.
- `Gambar` (Files) - Foto pamflet atau cover utama acara.
- `Tanggal Acara` (Date) - Rentang tanggal pelaksanaan acara.
- `Deskripsi Singkat Acara` (Rich Text) - Ringkasan singkat informasi kegiatan.
- `KKM Pengusul` (Rich Text) - Nama unit KKM yang mengajukan.
- `Lokasi Acara` (Rich Text) - Lokasi fisik atau virtual acara.
- `Submission time` (Created Time) - Waktu pengisian formulir.
- `Respondent` (Created By) - Identitas pengisi formulir.
- `Status` (Status: `Masuk` → `Diedit KKM` → `Published`)
  - **Masuk**: Baru diajukan, tersembunyi sepenuhnya dari publik.
  - **Diedit KKM**: Tersembunyi dari publik, namun dapat diulas oleh pengusul di `/agenda/preview/[slug]`.
  - **Published**: Ditampilkan secara penuh di `/agenda` dan dapat diakses langsung via `/agenda/[slug]`.

### 5. Halaman Karya Modular (`NOTION_KARYA_PAGE_ID`)

Halaman utama Karya dikelola secara modular melalui satu parent Notion Page ID yang menampung child database `"Karya: Formulir dan CMS"` di bawahnya (Indeks 0). Sistem mendeteksi database ini secara dinamis berdasarkan urutan letak (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **Karya: Formulir dan CMS**

#### A. Database Karya: Formulir dan CMS (`t="Karya: Formulir dan CMS"`)

Daftar karya mahasiswa, genre, dan tautan embed video/audio.

- `Judul Karya / Tayangan` (Title) - Judul karya/tayangan.
- `Pencipta / Penampil` (Rich Text) - Nama pencipta, penampil, atau grup mahasiswa.
- `Platform Utama` (Multi-select) - Platform pemutaran utama (YouTube, Spotify, SoundCloud, Apple Music, Lainnya).
- `Link Embed Utama (Full URL)` (URL) - Tautan URL lengkap karya untuk diembed dan diputar langsung.
- `Genre / Jenis Karya` (Multi-select) - Klasik, Jazz, Pop, Rock, Folk, Elektronik, Eksperimental, Lainnya.
- `NIM Penanggung Jawab` (Number) - NIM mahasiswa pengusul untuk keperluan verifikasi.
- `Respondent` (Created By) - Identitas pembuat halaman.
- `Submission time` (Created Time) - Waktu pengisian data.
- `Status` (Status: `Masuk` → `Di-review` → `Published`)
  - **Masuk**: Data baru disubmit, tersembunyi sepenuhnya dari publik.
  - **Di-review**: Sedang ditinjau oleh pengurus HIMA, belum ditampilkan.
  - **Published**: Karyamu terverifikasi dan muncul secara live di `/karya` dengan pemutar embed interaktif dan artwork oEmbed.
- **Email Konfirmasi Otomatis:** Setelah form Karya berhasil disubmit via `/api/submit-karya`, sistem secara otomatis mengirimkan salinan pengajuan (submission receipt) ke alamat email yang diisi oleh mahasiswa via layanan Brevo Transactional Email. Email ini mencakup detail karya, status awal (`Masuk`), dan waktu pengajuan dalam format WIB.

### 6. Halaman FAQ Modular (`NOTION_FAQ_PAGE_ID`)

Halaman FAQ dikelola secara modular melalui satu parent Notion Page ID yang menampung child database `"FAQ"` di bawahnya (Indeks 0). Sistem mendeteksi database ini secara dinamis berdasarkan urutan letak (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **Database FAQ**

#### A. Database FAQ

Pusat bantuan Tanya Jawab impromptu.

- `Judul Pertanyaan` (Title) - Pertanyaan dari mahasiswa.
- `Nama Penanya` (Rich Text) - Nama pengirim pertanyaan (default "Anonim").
- `Jawaban` (Rich Text) - Jawaban dari pengurus HIMA.
- `URL Referensi` (URL) - Tautan referensi informasi.
- `Status` (Status: `Masuk` → `Ditinjau` → `Dijawab` / `Dialihkan` / `Disembunyikan`)
- `Visibilitas` (Checkbox - Override manual)
- `Last Edited Time` (Last Edited Time - Native)
  _Aturan Tampil: `Visibilitas = true` AND `Status = Masuk OR Ditinjau OR Dijawab OR Dialihkan`._

### 7. Halaman Sekretariat Modular (`NOTION_SEKRETARIAT_PAGE_ID`)

Pusat dokumen organisasi, SOP, edaran, dan arsip HIMA Musik dikelola secara modular melalui satu parent Notion Page ID yang menampung sub-databases di bawahnya. Sistem mendeteksi database-database ini secara dinamis berdasarkan urutan letaknya (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **Sekretariat: Dokumen**
- **Database Kedua (Indeks 1)** bertindak sebagai **Sekretariat: Kategori**

#### A. Database Sekretariat: Dokumen (`t="Sekretariat: Dokumen"`)

Daftar dokumen, SOP, panduan, dan regulasi internal kabinet.

- `Nama Dokumen` (Title) - Judul atau nama dokumen.
- `Slug` (Rich Text) - Slug kustom URL halaman detail.
- `Kategori` (Relation) - Relasi ke database Sekretariat: Kategori.
- `Urutan Tampil` (Number) - Urutan prioritas tampilan.
- `Status` (Status: `Draft` → `Peninjauan` → `Publish` → `Arsip`)
  - **Draft / Peninjauan**: Disembunyikan sepenuhnya dari publik.
  - **Publish**: Ditampilkan live di grid sekretariat umum.
  - **Arsip**: Disajikan di portal histori `/sekretariat/archives`.

#### B. Database Sekretariat: Kategori (`t="Sekretariat: Kategori"`)

Mengelompokkan dokumen secara dinamis dengan deskripsi bantuan visual di landing page.

- `Name` (Title) - Nama kategori (misal: "Laporan Kinerja", "Panduan & SOP", "FAQ").
- `Deskripsi` (Rich Text) - Deskripsi ringkas alur birokrasi/layanan kategori terkait.

#### C. Fitur UX & Interaktivitas Sekretariat

Untuk menghadirkan pengalaman visual yang premium, rapi, dan terorganisir pada portal Sekretariat:

- **Card Layout yang Kompak:** Menggunakan kartu-kartu ber-border melengkung premium (`rounded-2xl`) dengan efek glassmorphic warna latar stone (`bg-stone-900/10`) dan highlight border transisi lembut saat di-hover.
- **Batas Maksimal Tampilan Dokumen:** Untuk mencegah visual "raksasa" yang berlebihan, setiap kartu kategori dibatasi hanya menampilkan maksimal **3 dokumen utama**. Sisa dokumen di bawah kategori tersebut dapat diakses melalui sidebar interaktif (`DocsSidebar`) yang selalu tampil di bagian kiri halaman portal dokumen.
- **Pill Indikator Dokumen Tambahan:** Jika dokumen melebihi batas 3, sistem secara dinamis menampilkan teks status tambahan seperti `"+X DOKUMEN LAINNYA"`.

### 8. Halaman Redirect Modular (`NOTION_REDIRECT_PAGE_ID`)

Mengelola aturan redirect dinamis/pintasan di website. Halaman Redirect diakses melalui satu parent Notion Page ID yang menampung sub-database di bawahnya. Sistem mendeteksi sub-database ini secara dinamis berdasarkan urutan letaknya (order of appearance) dalam halaman, sehingga kebal dari kesalahan akibat pengubahan nama (renaming) database di Notion:

- **Database Pertama (Indeks 0)** bertindak sebagai **Redirects Table**

#### A. Database Redirect (`t="Redirect"`)

Aturan pengalihan URL dari path internal ke URL tujuan eksternal/internal.

- `Name` (Title) - Nama pengenal atau deskripsi redirect (misal: "Formulir Agenda").
- `Modified` (Rich Text) - Path internal sumber yang akan diintersept (misal: `/agenda/submit`).
- `Destination URL` (Rich Text) - URL atau path tujuan redirect (misal: `https://pengajuan-agenda-himamusik.notion.site/...`).

### 9. Halaman Aduan Modular (`NOTION_ADUAN_PAGE_ID`)

Tempat pengarsipan keluhan, aspirasi, dan saran mahasiswa yang masuk melalui Ruang Advokasi. Halaman Aduan diakses melalui satu parent Notion Page ID yang menampung sub-database atau mention database di bawahnya. Sistem mendeteksi database ini secara dinamis berdasarkan urutan letaknya dalam halaman.

#### A. Database Aduan (`t="Aduan"`)

Menyimpan data laporan yang disubmit oleh mahasiswa untuk ditindaklanjuti oleh Divisi Advokasi.

- `Nama` (Title) - Nama pelapor (jika diisi, default "Anonim").
- `NIM` (Rich Text) - NIM pelapor (jika diisi, default "-").
- `Kategori` (Rich Text) - Kategori aduan (Akademik, Fasilitas, Organisasi, Lainnya).
- `Pesan` (Rich Text) - Isi pesan atau keluhan lengkap mahasiswa.
- `Status` (Status) - Status penanganan laporan (`Masuk` → `Diproses` → `Tidak Selesai` → `Selesai`).

---

### Notion Data Sources Alignment (SDK v5.22.0)

To fully align with the modern Notion API paradigm implemented in `@notionhq/client` v5.22.0, the portal interacts with Notion databases through **Data Sources**.

Legacy `.databases.query` is replaced with `.dataSources.query`. All database fetching routines automatically resolve database IDs to queryable Data Source IDs using `resolveDataSourceIdSafe()` before querying. Ensure the Notion Integration (e.g. "Fishing") has connection access shared to each database in the Notion UI.

---

### Notion Webhook & Instant Cache Revalidation

### Fully Dynamic Real-Time Notion Integration (Bypassed Caching)

To ensure that any updates made in the Notion Teamspace are reflected instantly across the entire portal without any lag, caching is completely bypassed:

- **Bypassed Next.js Cache (`unstable_cache`):** All Notion data-fetching routines (Profil, KKM, Agenda, Karya, Sekretariat, and Beranda) bypass the Next.js `unstable_cache` wrapper entirely, querying the Notion API directly on every request.
- **Dynamic Server-Side Rendering (`revalidate = 0`):** All public routes and API endpoints are configured as fully dynamic (`export const revalidate = 0`), forcing Next.js to server-render pages with the absolute latest data from Notion upon every visit.
- **Client-Side SWR (Stale-While-Revalidate):** To eliminate transition delays and loading animations entirely for navbar-linked pages, visual components implement instant client-side SWR rendering. The UI initializes from the server-rendered HTML or initial server props immediately with the latest data, while silently fetching fresh data in a background `useEffect` from dedicated API endpoints (`/api/profil`, `/api/kkm`, `/api/agenda`, `/api/faq`, `/api/sekretariat`) to keep the UI perfectly synchronized without visual loaders.

#### Manual Force-Sync & Preview Action Bar

For administrative preview scenarios or when automatic webhooks are not yet triggered:

- **Secure Revalidation Controller (`/api/notion/revalidate`):** A public, rate-limited endpoint that securely clears and revalidates all CMS caches (`events`, `beranda`, `profil`, `kkm`, `faq`) without exposing integration keys. Includes an in-memory **10-second rate-limiting cooldown** to protect Notion API rates.
- **Interactive Action Bar (`PreviewActionBar.tsx`):** A sleek glassmorphic floating controller rendered at the top of preview routes (e.g., `/agenda/preview/[slug]`). Admins can click a "Sync data" button to trigger manual Edge Cache invalidation, showing live edits instantly upon automatic reload.
