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
- **CMS / Data Source:** Notion API
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

   # Notion Database IDs
   NOTION_EVENTS_DATABASE_ID=your_events_database_id
   NOTION_KKM_DATABASE_ID=your_kkm_database_id
   NOTION_FAQ_DATABASE_ID=your_faq_database_id          # Required for /faq route
   NOTION_SEKRETARIAT_DATABASE_ID=your_sekretariat_database_id

   # Webhooks & Discord
   DISCORD_ADUAN_WEBHOOK_URL=your_aduan_discord_webhook_url
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
