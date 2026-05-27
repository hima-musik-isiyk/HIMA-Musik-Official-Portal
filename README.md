## Overview

This repository contains the official portal for Himpunan Mahasiswa Musik (HIMA MUSIK) ISI Yogyakarta.  
It is a modern web application built on the **Next.js App Router** framework, featuring dynamic content management, real-time collaboration rooms, automated administration sync, and highly-stylized user experiences powered by GSAP and Framer Motion.

The portal focuses on:

- Presenting organizational profile, cabinet structure, and vision for the 2026 cabinet
- Showcasing dynamic events, Kelompok Kegiatan Mahasiswa (KKM) portals, and visual galleries
- Providing an advocacy channel with AI-assisted text refinement for student aspirations
- Serving as a central, interactive Secretariat portal for documents, SOPs, archives, and self-service requests
- Enabling internal admin tools like Canva-to-Instagram grid planning and real-time Notion context rooms

## Features

- **Dynamic Landing Page:** Sleek homepage featuring responsive layouts, kinetic typography, and fluid entrance animations.
- **Cabinet Profile & KKM:** Sourced directly from Notion, organizing divisions, cabinet hierarchies, and student interest groups.
- **Events & Publications Calendar:** Live tracking of academic schedules, projects, and repost schedules categorized by lifecycle.
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
- **Styling:** Tailwind CSS v4, Vanilla CSS
- **Animations:** GSAP (ScrollTrigger) & Framer Motion
- **Database & ORM:** Prisma ORM connecting to PostgreSQL (e.g. Neon, via `DATABASE_URL_POOLED`).
  - **Aduan Storage:** Stores submitted complaints (`Aduan` table: `name`, `nim`, `category`, `message`, `createdAt`).
  - **Pendaftaran Storage:** Stores recruitment registrations (`Pendaftaran` table: personal details, division choice, motivation, availability, portfolio).
- **CMS / Data Source:** Notion API
- **Realtime & Storage:** Supabase (Realtime Channels & Bucket Storage)
- **Integrations & Services:**
  - **Groq API:** AI-assisted text processing
  - **Canva Graph API & Sharp:** Automation for grid slice exports
  - **Brevo SMTP & Telegram Bot API:** Transactional mailings and administrator logs
  - **Discord Webhooks:** Unified notification and error channels (`DISCORD_ADUAN_WEBHOOK_URL` & `DISCORD_PENDAFTARAN_WEBHOOK_URL`)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root and configure the necessary environment variables:

   ```bash
   # Core Integrations
   GROQ_API_KEY=your_groq_api_key
   NOTION_INTEGRATION_TOKEN=your_notion_integration_token

   # Databases
   DATABASE_URL=your_postgresql_database_url

   # Webhooks & Slack/Discord
   DISCORD_ADUAN_WEBHOOK_URL=your_aduan_discord_webhook_url
   DISCORD_PENDAFTARAN_WEBHOOK_URL=your_pendaftaran_discord_webhook_url
   DISCORD_FORMS_WEBHOOK_URL=your_sekretariat_forms_discord_webhook_url
   ```

   _(For full integration configurations including Canva, Supabase buckets, and Instagram webhooks, see `CODEBASE_KNOWLEDGE.md`)._

3. Initialize your database schema:

   ```bash
   npx prisma generate
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Available Scripts

- `npm run dev` – Start the local development server with hot-reloading
- `npm run build` – Compile the application for production deployment
- `npm run start` – Run the built production server locally
- `npm run lint` – Audit the codebase for styling and type safety rules

## Project Structure

The project routes have been organized into semantic **Next.js Route Groups** matching the portal's headers and administrative workflows to maintain a clean layout:

- `app/` – Core Next.js App Router structure:
  - `(profil)/` – HIMA Musik profile page (`about/`)
  - `(kkm)/` – Kelompok Kegiatan Mahasiswa community pages (`kkm/`)
  - `(layanan)/` – Services, complaint pipelines, forms, and archives (`aduan/`, `pendaftaran/`, `sekretariat/`)
  - `(publikasi)/` – Events schedules, repost systems, and media galleries (`events/`, `gallery/`)
  - `(secret)/` – Restricted administrator utilities (`instagram-secret-page/`, `notion-secret-page/`)
  - `(legal)/` – Regulatory pages and developer policy compliance (`data-deletion/`, `privacy-policy/`, `terms-of-service/`)
  - `api/` – Next.js API route handlers
  - `layout.tsx` & `page.tsx` – Global app layout and home view entry point
- `views/` – Page-level visual components, separating UI implementation from route declarations
- `components/` – Reusable layout shells and shared UI blocks (Navigation, Footer, Command Palette)
- `lib/` – Prisma clients, Notion helper integrations, Supabase connectors, and custom hooks
- `services/` – Serverless parsing helpers and Groq AI text parsers
- `prisma/` – Relational database configurations, models, and migrations
- `migration/` – Historical scraping scripts, session files, python environments, and scraped JSONL data dumps
