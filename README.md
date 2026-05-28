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
- **FAQ & Tanya Jawab:** Public question-and-answer board backed by a Notion database (route: `/faq`).
  - Browse visible entries filtered by category and visibility status
  - Submit new questions with name and category; entries flow into Notion and trigger a Discord notification
  - Compact and highly-efficient layout for answered FAQ accordions and real-time public questions
  - Date and author metadata displayed on closed card previews (before expansion)
  - Custom Minecraft Standard Galactic character scrambler obfuscation for hidden content
  - Dynamic page-by-page rendering with custom retro-themed `PaginationControl` for both lists
- **Ruang Advokasi (Aduan):**
  - Category-based submission of complaints (Akademik, Fasilitas, Organisasi, Lainnya)
  - AI-assisted message refinement utilizing Groq (Llama 3)
  - Discord webhook integration for real-time administrator notifications
  - Local draft recovery using standard storage APIs
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
   # Core Integrations
   GROQ_API_KEY=your_groq_api_key
   NOTION_INTEGRATION_TOKEN=your_notion_integration_token

   # Notion Database & Page IDs (4 Database CMS Final + 3 Page IDs)
   NOTION_BERANDA_PAGE_ID=your_beranda_page_id          # Single Page ID containing child databases
   NOTION_PROFIL_PAGE_ID=your_profil_page_id            # Single Page ID containing child databases & database mentions
   NOTION_KKM_PAGE_ID=your_kkm_page_id                  # Single Page ID containing child databases
   NOTION_KKM_DATABASE_ID=your_kkm_database_id          # Optional legacy fallback
   NOTION_EVENTS_DATABASE_ID=your_events_database_id
   NOTION_FAQ_DATABASE_ID=your_faq_database_id          # Required for /faq route
   NOTION_SEKRETARIAT_DATABASE_ID=your_sekretariat_database_id

   # Webhooks & Discord
   DISCORD_ADUAN_WEBHOOK_URL=your_aduan_discord_webhook_url
   DISCORD_FAQ_WEBHOOK_URL=your_faq_discord_webhook_url
   DISCORD_FORMS_WEBHOOK_URL=your_sekretariat_forms_discord_webhook_url
   ```

   _(For full integration configurations including Canva, Supabase, and Notion webhooks, see `CODEBASE_KNOWLEDGE.md`.)_

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
  - `api/` – Next.js API route handlers
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

The HIMA Musik portal features a dynamic Content Management System backed by **6 Notion Databases** managed exclusively by the Ketua. Below is the exact schema and property types defined in the Notion Teamspace:

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

- `Name` (Title) - Nama unit KKM.
- `Slug` (Rich Text) - Slug tautan halaman (misal: "orkes-mahasiswa").
- `Jargon` (Rich Text) - Jargon atau tagline singkat.
- `Deskripsi Singkat` (Rich Text) - Deskripsi lengkap KKM.
- `Logo` (Files) - Logo atau avatar resmi KKM.
- `Instagram` (URL) - Link Instagram.
- `TikTok` (URL) - Link TikTok.
- `YouTube` (URL) - Link channel YouTube.

### 4. Database Agenda (`NOTION_EVENTS_DATABASE_ID`)

Kalender kegiatan, program kerja, dan agenda kolaboratif.

- `Judul Tayangan` (Title)
- `ID Konten` (Unique ID)
- `Slug` (Rich Text)
- `Tanggal Acara` (Date)
- `Lokasi` (Rich Text)
- `Tipe Acara` (Select: `Internal`, `Publik`, `Kolaborasi`)
- `Status Konten CMS` (Status: `Draf` → `Peninjauan` → `Dijadwalkan` → `Live` → `Arsip`)
- `Integritas Riwayat` (Date)

### 5. Database FAQ (`NOTION_FAQ_DATABASE_ID`)

Pusat bantuan Tanya Jawab publik dan internal HIMA.

- `Judul Pertanyaan` (Title)
- `Nama Penanya` (Rich Text)
- `Sumber` (Select: `Publik`, `Hima`)
- `Jawaban` (Rich Text)
- `URL Referensi` (URL)
- `Status` (Status: `Masuk` → `Ditinjau` → `Dijawab` / `Dialihkan` / `Disembunyikan`)
- `Visibilitas` (Checkbox - Override manual)
- `Last Edited Time` (Last Edited Time - Native)
  _Aturan Tampil: `Visibilitas = true` AND `Status = Dijawab OR Dialihkan`._

### 6. Database Sekretariat (`NOTION_SEKRETARIAT_DATABASE_ID`)

Pusat dokumen organisasi, SOP, edaran, dan arsip HIMA Musik.

- `Nama Dokumen` (Title)
- `ID Konten` (Unique ID)
- `Slug` (Rich Text)
- `Kategori` (Select: `SOP`, `Surat Edaran`, `Pengumuman`, `Panduan`)
- `Urutan Tampil` (Number)
- `Status Konten CMS` (Status: `Draf` → `Peninjauan` → `Live` → `Arsip`)
- `Integritas Riwayat` (Date)

---

### Notion Data Sources Alignment (SDK v5.22.0)

To fully align with the modern Notion API paradigm implemented in `@notionhq/client` v5.22.0, the portal interacts with Notion databases through **Data Sources**.

Legacy `.databases.query` is replaced with `.dataSources.query`. All database fetching routines automatically resolve database IDs to queryable Data Source IDs using `resolveDataSourceIdSafe()` before querying. Ensure the Notion Integration (e.g. "Fishing") has connection access shared to each database in the Notion UI.
