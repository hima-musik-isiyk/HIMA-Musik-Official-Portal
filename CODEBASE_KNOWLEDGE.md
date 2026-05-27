# HIMA Musik Official Portal Codebase Knowledge

This document serves as a comprehensive, agent-oriented map of the project. It describes architecture, tech stack, integrations, workflows, and operational caveats, allowing new developers or AI agents to get productive quickly without reverse-engineering the entire repository.

## 1. Project Identity & Purpose

- **Project name:** `hima-musik---official-portal`
- **Framework:** Next.js App Router
- **Language:** TypeScript (with some isolated JS files like `api/webhook.js`)
- **Main Purpose:**
  - Present HIMA MUSIK public information (Profile, Events, KKM).
  - Serve as a transparent Secretariat portal (Docs, SOPs, Archives).
  - Collect student aspirations (`aduan`) and recruitment registrations (`pendaftaran`).
  - **Internal Tooling:** Real-time Notion collaboration rooms, automated attendance (Presensi) syncing, Instagram DM/Comment routing to Discord, and Canva-to-Instagram grid planning.

## 2. High-Level Architecture

- `app/`: Next.js routes, layouts, and API endpoints.
- `views/`: Page-level React UI components, keeping route files clean.
- `components/`: Reusable UI building blocks, interactive elements, and GSAP-animated components.
- `lib/`: Shared utilities, Notion API wrappers, Supabase clients, static data, animation hooks, and Prisma singletons.
- `services/`: AI text refinement parsers and integrations.
- `prisma/`: Database schema and migration files.
- `public/`: Static assets (SVG logos).

**Architectural Pattern:** Server Components fetch data (e.g., from Notion or Prisma) and pass it to Client Components located in `views/` or `components/` for interactivity and GSAP animations.

## 3. Tech Stack

- **Core:** Next.js 14/15, React 18, TypeScript, Tailwind CSS v4.
- **Database:** Prisma ORM connecting to PostgreSQL (e.g., Neon).
- **Storage & Realtime:** Supabase (Postgres, Realtime Channels, Storage Buckets).
- **CMS / Data Source:** Notion API (for docs, events, KKM, attendance, and realtime rooms).
- **Animations:** GSAP (ScrollTrigger) and Framer Motion / Motion.
- **Integrations:**
  - **Canva API:** Direct export and image slicing for Instagram grid planning.
  - **Instagram Graph API:** Webhook processing for DMs/Comments.
  - **Discord Webhooks:** Notification routing and error logging.
  - **Brevo SMTP:** Transactional emails (recruitment receipts).
  - **Groq API:** LLM text refinement (Llama 3).
  - **Telegram Bot API:** Admin notifications for form submissions.
  - **Sharp:** Image processing and slicing in Node.js.

## 4. Current Route Map

### Public & Secretariat Routes

- `/` -> Home (Hero, About summary, Quick Links).
- `/about` -> Organization profile, vision, and cabinet structure.
- `/events` -> Event listing grouped by lifecycle (Upcoming, Ongoing, Past, Announcement).
- `/events/[slug]` -> Event detail page sourced from Notion.
- `/kkm` -> Kelompok Kegiatan Mahasiswa (KKM) portal.
- `/kkm/[slug]` -> KKM detail page.
- `/aduan` -> Student complaint and aspiration form with AI text refinement.
- `/pendaftaran` -> Open Recruitment landing page.
- `/pendaftaran/form` -> Multi-step recruitment registration form.
- `/sekretariat` -> Docs portal landing (Guidelines, SOPs, FAQ, Monthly Reports).
- `/sekretariat/[slug]` -> Sourced Notion document rendering with Table of Contents.
- `/sekretariat/archives` -> Transparency archives listing.
- `/sekretariat/archives/[id]` -> Archive detail view.
- `/sekretariat/forms/surat-aktif` & `/peminjaman-alat` -> Admin request forms.
- `/privacy-policy`, `/terms-of-service`, `/data-deletion` -> Legal pages.

### Internal Secret Tooling Routes

- `/notion-secret-page` & `/notion-secret-page/[slug]` -> Real-time collaborative context rooms to compile Notion blocks into Markdown for AI/Admin usage.
- `/instagram-secret-page` -> Internal Instagram grid planner. Supports manual image uploads or direct Canva fetching & auto-splicing.

## 5. Content Model (Databases & CMS)

The project heavily utilizes external CMS alongside a traditional relational database.

### Prisma (PostgreSQL)

Defined in `prisma/schema.prisma`.

- **Aduan:** Stores complaints (`name`, `nim`, `category`, `message`).
- **Pendaftaran:** Stores recruitment applications (`firstChoice`, `secondChoice`, `angkatan`, `pddSubfocus`, `fullName`, `nim`, `email`, `phone`, `motivation`, etc.).

### Notion Databases

Managed via `lib/notion.ts` and `lib/notion-room/server.ts`.

- **Sekretariat / Projects:** SOPs, Guidelines, Archives. Uses custom Markdown tags (`cite://`, `block://`, `[#anchor]`) for cross-linking.
- **Events:** Calendar events containing date ranges, locations, registration links, and lifecycles.
- **KKM:** Profiles of student communities.
- **Rapat & Keputusan:** Meeting records.
- **Rekam Presensi & SDM:** Automated attendance tracking.

### Supabase Storage

- **`instagram-secret-page` Bucket:** Stores Canva session tokens (`canva-session.json`), Grid manifest (`manifest.json`), and spliced image assets.

## 6. Important Integrations and Workflows

### A. Aduan & Pendaftaran (Intake Flows)

- **Aduan:** Users submit complaints. They can optionally use Groq AI (`/api/refine-aduan`) to refine text politely. On submit, data is written to Postgres and notifications are sent via Discord/Telegram.
- **Pendaftaran:** Multi-step form with auto-save (Local Storage). Validates criteria (e.g., Angkatan restrictions). Upon submission, it writes to Postgres, sends an HTML receipt via Brevo SMTP, and notifies admins.

### B. Secretariat & Notion Docs Portal

- Uses `unstable_cache` with revalidation for fetching Notion docs.
- **Citation Resolution:** API (`/api/citation`) fetches specific blocks using anchors (`[#anchor-id]`) and renders them dynamically in tooltips or quote blocks.
- **Image Proxying:** `/api/notion-image` proxies AWS S3 Notion images to bypass URL expiration, caching them locally or passing them through on Vercel.

### C. Instagram Secret Page & Canva Integration

- **Frontend:** `/instagram-secret-page` shows a 3-column Instagram grid.
- **Canva Integration:** Allows admins to paste a Canva link. The API (`/api/instagram-secret-page`) resolves the design, exports specific pages to PNG via Canva API, and uses `sharp` to slice the image based on its aspect ratio (e.g., splitting a 3240x1080 image into three 1080x1080 segments).
- **Persistence:** Metadata is saved in a JSON manifest in Supabase Storage.

### D. Notion Context Rooms (Secret Page)

- **Frontend:** `/notion-secret-page`. A realtime dashboard where multiple admins can select Notion blocks/pages to compile context.
- **Realtime:** Uses Supabase Channels (`room-[id]`) for presence tracking (who is online, what blocks they selected).
- **Webhooks:** Listens to Notion updates (`/api/webhooks/notion`) and broadcasts changes to the UI via Supabase to trigger auto-refreshes.

### E. Automated Attendance (Sync Presensi)

- **API:** `/api/notion/sync-presensi`.
- **Flow:** Triggered by Notion webhooks when a Meeting (Rapat) is created/updated. It looks at the invited members, cross-references the SDM database to verify active status, and automatically creates entries in the Presensi (Attendance) database with "Belum Hadir" status. Uses locking to prevent race conditions.

### F. Instagram Webhooks to Discord

- **API:** `/api/webhook.js` (Node.js runtime).
- **Flow:** Receives Instagram webhooks (DMs, comments, mentions, story replies). Formats them into rich Discord Embeds, handling identity matching (showing real usernames if cached/fetched), and forwards them to specific Discord channels. Includes raw JSON chunking for debugging.

## 7. Major API Endpoints

- **`/api/submit`**: Handles Aduan creation.
- **`/api/pendaftaran`**: Handles Open Recruitment creation and emails.
- **`/api/refine-aduan`**: Proxies requests to Groq LLM.
- **`/api/citation`**: Resolves custom Notion `cite://` anchor blocks.
- **`/api/sekretariat/forms`**: Processes admin requests (e.g., Surat Aktif, Peminjam Alat) to Telegram.
- **`/api/canva/auth` & `/callback`**: Handles Canva OAuth 2.0 flow.
- **`/api/instagram-secret-page`**: GET/POST/DELETE for Instagram Grid manifest and image slicing.
- **`/api/notion-image`**: Notion S3 image caching and proxying.
- **`/api/events/[slug]/cover`**: Proxies event cover images.
- **`/api/notion/*`**: Suite of endpoints for Notion Rooms (`/rooms`, `/pages`, `/create`, `/compile`).
- **`/api/notion/sync-presensi`**: Trigger for Rapat attendance synchronization.
- **`/api/webhooks/notion`**: Generic listener for Notion database changes, bridging into Supabase Realtime.
- **`/api/cron/supabase-keepalive`**: Pings the Supabase database to prevent auto-pausing on free tiers.

## 8. UI, UX, and Animation Patterns

- **Styling:** Tailwind CSS with extensive custom configuration (see `DESIGN_LANGUAGE.md`). Dark background (`#0a0a0a`), warm gold accents (`#D4A64D`).
- **Typography:** Fraunces (Serif) for headings, standard sans for body. Heavy use of tracking (letter-spacing) for uppercase labels.
- **GSAP Animations:** Controlled primarily via `lib/useViewEntrance.ts`.
  - Elements use `data-animate="up|fade|scale|scale-x"` to trigger scroll-bound or immediate entrance animations.
  - Staggering is supported via `data-animate-stagger`.
- **TextPressure & BlurText:** Custom React components for kinetic, typography-heavy hero sections based on mouse/pointer proximity.
- **Shortcuts:** Global command palette (`Cmd/Ctrl+K`) for fast documentation search.

## 9. Feature Flags & Operational Caveats

- **Feature Flags:** `lib/feature-flags.ts`.
  - `ALLOW_PENDAFTARAN`: Currently set to `process.env.NODE_ENV === "development"`. In production, the `/pendaftaran` routes will redirect to `/` unless toggled.
  - `SHOW_DOCS_SIDEBAR`: Toggles the advanced sidebar on the Secretariat portal.
- **Notion Structure Coupling:** Code relies heavily on specific property names in Notion (e.g., `Slug`, `Category`, `Publish`, `(AUT) Daftar Undangan`, `Status Keaktifan`). Changing property names in Notion _will_ break parsers.
- **Supabase Realtime:** Requires RLS policies or Anon Key access configured correctly for `notion_rooms` table and Storage buckets.
- **Gemini Service:** `services/geminiService.ts` is a misnomer; it actually uses Groq (Llama 3) identical to `aiTextService.ts`.

## 10. Environment Variables

_(Ensure these are set in Vercel / `.env`)_

- **Database:** `DATABASE_URL_POOLED`
- **Notion:** `NOTION_INTEGRATION_TOKEN`, `NOTION_SEKRETARIAT_DATABASE_ID`, `NOTION_EVENTS_DATABASE_ID`, `NOTION_KKM_DATABASE_ID`, `NOTION_DATABASE_ID_RAPAT`, `NOTION_DATABASE_ID_PRESENSI`, `NOTION_DATABASE_ID_SDM`.
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Canva:** `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`.
- **Discord:** `DISCORD_WEBHOOK_URL`, `DISCORD_PARSED_WEBHOOK_URL`, `DISCORD_RAW_WEBHOOK_URL`, `DISCORD_ADUAN_WEBHOOK_URL`, `DISCORD_PENDAFTARAN_WEBHOOK_URL`.
- **Instagram:** `VERIFY_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`, `HIMA_INSTAGRAM_ID`.
- **AI/SMTP/Telegram:** `GROQ_API_KEY`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

## 11. Most Important Files for Orientation

If you only have a few minutes, read these:

1. `app/layout.tsx` & `lib/useViewEntrance.ts` (App shell and animation engine).
2. `lib/notion.ts` & `lib/notion-shared.ts` (Core content parsers and citation logic).
3. `components/NotionRenderer.tsx` (How Notion blocks map to UI).
4. `app/api/pendaftaran/route.ts` & `app/api/submit/route.ts` (Main intake mutations).
5. `app/api/instagram-secret-page/route.ts` (Complex Sharp/Canva splicing logic).
6. `app/notion-secret-page/page.tsx` (Realtime Supabase/Notion collaboration).
7. `api/notion/sync-presensi/route.ts` (Advanced automated Notion linking workflow).

## 12. Recommended Tasks for Future Agents

- **Cleanup Debt:** Rename `geminiService.ts` or consolidate it into `aiTextService.ts`. Convert `api/webhook.js` to TypeScript.
- **Testing:** Introduce Playwright or Cypress for E2E testing of the Pendaftaran multi-step form.
- **Gallery Implementation:** Replace the `/gallery` placeholder with an actual Notion gallery parser utilizing `NOTION_GALLERY_DATABASE_ID`.
