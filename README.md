## Overview

This repository contains the official portal for Himpunan Mahasiswa Musik (HIMA MUSIK).  
It is a single-page React application with a custom hash-based router, built with Vite and Tailwind CSS.

The portal focuses on:

- Presenting organizational information for the 2026 cabinet
- Showcasing events and visual documentation
- Providing a student feedback channel with AI-assisted text refinement
- Providing a real-time, Notion-integrated FAQ & Tanya Jawab service for members and the public

## Features

- Landing page with hero section and quick navigation
- About page with organizational profile and cabinet structure
- Events page for the academic calendar and programs
- Gallery page for visual documentation (placeholder content)
- Aduan (complaint/aspiration) form:
  - Optional identity fields (name and NIM)
  - Category selection (Akademik, Fasilitas, Organisasi, Lainnya)
  - Local draft autosave with recovery
  - AI-assisted refinement of the message text using Groq
  - Submission to Discord via a serverless API endpoint
- FAQ & Tanya Jawab Portal:
  - Unified FAQ database backed by Notion
  - Real-time display of public-submitted questions and answer statuses
  - Multi-category sorting (Pendaftaran, Kegiatan, Organisasi, Akademik, Lainnya)
  - Real-time question submission with local draft recovery and Discord alert integration
  - Notion-managed administrative workflow (Masuk, Ditinjau, Dijawab, Dialihkan, Disembunyikan)
- Online Secretariat Forms:
  - Self-service requests (Surat Aktif Organisasi, Peminjaman Alat Musik)
  - Real-time Discord notifications to coordinators

## Tech Stack

- React 19 with TypeScript
- Vite 6
- Tailwind CSS 4
- ESLint & TypeScript strictly configured for absolute type safety and clean, zero-warning builds
- Groq API for AI-assisted text refinement
- Vercel serverless function for Discord integration
- Notion API for dynamic content databases (SOPs, Events, FAQ, Presensi, SDM)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root and configure the environment variables:

   ```bash
   GROQ_API_KEY=your_groq_api_key
   DISCORD_ADUAN_WEBHOOK_URL=your_aduan_discord_webhook_url
   DISCORD_PENDAFTARAN_WEBHOOK_URL=your_pendaftaran_discord_webhook_url
   DISCORD_FORMS_WEBHOOK_URL=your_sekretariat_forms_discord_webhook_url
   DISCORD_ERROR_WEBHOOK_URL=optional_error_discord_webhook_url
   NOTION_INTEGRATION_TOKEN=your_notion_integration_token
   NOTION_FAQ_DATABASE_ID=your_notion_faq_database_id
   ```

   Alternatively, the Groq client also accepts `API_KEY` if you prefer that variable name.

3. Run the development server:
   ```bash
   npm run dev
   ```

The app runs using Vite; follow the terminal output to open the local URL in your browser.

## Available Scripts

- `npm run dev` – Start the development server
- `npm run build` – Build the app for production
- `npm run preview` – Preview the production build locally
- `npm run lint` – Lint the TypeScript and React codebase

## Project Structure

High-level structure:

- `App.tsx` – Root application shell with simple hash-based routing
- `pages/` – Top-level pages (Home, About, Events, Aduan, Gallery)
- `views/` – Complex interactive view components (e.g., `FAQ.tsx` for FAQ & Tanya Jawab)
- `components/` – Shared UI components (Navigation, Footer)
- `services/aiTextService.ts` – AI helpers for text refinement using Groq
- `app/api/submit/route.ts` – API endpoint that forwards Aduan submissions to Discord
- `app/api/faq/route.ts` – API endpoint for dynamic FAQ fetching and submissions
- `lib/faq.ts` – Notion API client wrapper for FAQ database entries

## Deployment Notes

The project is configured to work with Vercel serverless functions via the `api/submit.ts` file.  
Ensure the production environment has the same environment variables configured:

- `GROQ_API_KEY` or `API_KEY`
- `DISCORD_ADUAN_WEBHOOK_URL`
- `DISCORD_PENDAFTARAN_WEBHOOK_URL`
- `DISCORD_FORMS_WEBHOOK_URL`
- `DISCORD_ERROR_WEBHOOK_URL` (optional; falls back to the relevant form webhook)
- `NOTION_INTEGRATION_TOKEN`
- `NOTION_FAQ_DATABASE_ID`
