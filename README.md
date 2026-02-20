## Overview

This repository contains the official portal for Himpunan Mahasiswa Musik (HIMA MUSIK).  
It is a single-page React application with a custom hash-based router, built with Vite and Tailwind CSS.

The portal focuses on:

- Presenting organizational information for the 2026 cabinet
- Showcasing events and visual documentation
- Providing a student feedback channel with AI-assisted text refinement

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
  - Submission to Telegram via a serverless API endpoint

## Tech Stack

- React 19 with TypeScript
- Vite 6
- Tailwind CSS 4
- ESLint for linting
- Groq API for AI-assisted text refinement
- Vercel serverless function for Telegram integration

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
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
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
- `components/` – Shared UI components (Navigation, Footer)
- `services/aiTextService.ts` – AI helpers for text refinement using Groq
- `api/submit.ts` – Serverless endpoint that forwards Aduan submissions to Telegram

## Deployment Notes

The project is configured to work with Vercel serverless functions via the `api/submit.ts` file.  
Ensure the production environment has the same environment variables configured:

- `GROQ_API_KEY` or `API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
