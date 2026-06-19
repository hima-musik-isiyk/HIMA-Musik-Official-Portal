# Codebase Knowledge — HIMA Musik Official Portal

> Generated: May 27, 2026
> Framework: Next.js 16.1.6 (App Router)
> Language: TypeScript

---

## 1. Project Identity & Purpose

- **What this project is:** The definitive digital presence of **HIMA MUSIK ISI JOGJA**. It serves as a public-facing portal and a private operational hub.
- **Audience:**
  - **Public:** Students, prospective members, and external partners (agenda, profile, KKM).
  - **Internal Admins:** Secretariat staff, PR (Humas), and Content teams (Secretariat Portal, Instagram Grid Planner, Real-time Rooms).
- **Core Problems Solved:** Centralizing organization documents (Notion-to-Web), automating student complaints (Aduan) via AI refinement, managing recruitment intakes, and coordinating social media content workflows.

---

## 2. Repository Structure

```
.
├── app/                  # Next.js routes, layouts, and API handlers.
├── components/           # Reusable UI building blocks and animated elements.
├── lib/                  # Shared utilities, Notion/Supabase clients, and static data.
├── services/             # External service wrappers and AI-specific parsers.
├── views/                # Page-level UI orchestration (Server Comps call these).
├── public/               # Static assets (logos, icons).
└── prisma/               # Database schema (if applicable).
```

- `app/`: Contains the routing structure using the App Router convention.
- `lib/`: Houses the core business logic, including complex Notion block parsing.
- `components/`: Purely UI/UX components, many using GSAP for sophisticated entries.
- `views/`: The "glue" components that define layout patterns for specific routes.

---

## 3. Tech Stack

### Core Framework & Runtime

- `next@16.1.6` — App Router, Server Components, and stable caching.
- `react@18.2.0` — UI framework.
- `typescript@5.8.2` — Type safety.

### UI & Styling

- `tailwindcss@4.1.18` — Utility-first styling with v4 features.
- `@tailwindcss/postcss@4.2.0` — CSS processing.
- `lucide-react@0.575.0` — Icon library.
- `class-variance-authority@0.7.1` — Type-safe component variants.

### Animation

- `gsap@3.14.2` — Primary engine for complex scroll-triggered and stagger animations.
- `motion@12.34.3` — Framer Motion for simple physics-based transitions.

### Storage & Realtime

- `@supabase/supabase-js@2.105.4` — Client for Storage (Canva assets) and Realtime (Collaboration rooms).

### CMS & Content

- `@notionhq/client@5.20.0` — Official Notion SDK for data fetching.
- `notion-to-md@3.1.9` — Utility to convert Notion blocks to Markdown for internal processing.

### External APIs & Integrations

- `Groq API` — Llama 3.1 models for text refinement in the Aduan form.
- `Canva API` — Design asset export and integration for social media planning.
- `Discord Webhooks` — Multi-channel notification routing (Error, Aduan, Pendaftaran).
- `Brevo` — Transactional email delivery (recruitment receipts).

### Dev Tooling

- `@locator/runtime` — Development tool for clicking elements to jump to source code.
- `eslint` & `prettier` — Code quality and formatting.
- `husky` — Git hooks for linting.

---

## 4. Configuration & Build

### `next.config.mjs`

- **Redirects:**
  - `/events` → `/agenda` (Permanent: true)
  - `/events/:slug` → `/agenda/:slug` (Permanent: true)
  - `/about` → `/profil` (Permanent: true)
- **Image Domains:** Proxies images via `/api/notion-image` to prevent S3 link expiration.
- **Webpack:** Injects `@locator/webpack-loader` in development for source mapping.

### TypeScript Path Aliases

- `@/*` → `./*` (Mapped to the root for clean imports).

---

## 5. Environment Variables

| Variable                     | Required | Used In                         | Description                              |
| ---------------------------- | -------- | ------------------------------- | ---------------------------------------- |
| `NOTION_INTEGRATION_TOKEN`   | Yes      | `lib/notion.ts`                 | Secret token for Notion API.             |
| `NOTION_SEKRETARIAT_PAGE_ID` | Yes      | `lib/notion.ts`                 | Modular parent Page ID for Docs portal.  |
| `NOTION_AGENDA_PAGE_ID`      | Yes      | `lib/notion.ts`                 | Modular parent Page ID for Agenda CMS.   |
| `GROQ_API_KEY`               | Yes      | `app/api/refine-aduan/route.ts` | API Key for Llama-3 text refinement.     |
| `DISCORD_ADUAN_WEBHOOK_URL`  | Yes      | `app/api/submit/route.ts`       | Webhook for student complaints.          |
| `NEXT_PUBLIC_SUPABASE_URL`   | Yes      | `lib/supabase.ts`               | Supabase endpoint.                       |
| `CRON_SECRET`                | No       | `api/cron/supabase-keepalive`   | Auth for external cron pings.            |
| `CANVA_CLIENT_ID/SECRET`     | No       | `lib/canva.ts`                  | OAuth credentials for Canva integration. |

---

## 6. Route Map

### 6a. Page Routes

| Route            | File Path                             | Type   | Data Source          | Description                             |
| ---------------- | ------------------------------------- | ------ | -------------------- | --------------------------------------- |
| `/`              | `app/page.tsx`                        | Mixed  | Static               | Landing page with Hero and Quick Links. |
| `/profil`        | `app/(public)/profil/page.tsx`        | Server | Static               | Organization profile and vision.        |
| `/agenda`        | `app/(public)/agenda/page.tsx`        | Server | Notion (Events)      | List of upcoming and past events.       |
| `/agenda/[slug]` | `app/(public)/agenda/[slug]/page.tsx` | Server | Notion (Events)      | Event detail with rich content.         |
| `/faq`           | `app/(public)/faq/page.tsx`           | Server | Notion (FAQ)         | Frequently Asked Questions.             |
| `/aduan`         | `app/(public)/aduan/page.tsx`         | Client | Mixed                | AI-powered complaint form.              |
| `/sekretariat`   | `app/(public)/sekretariat/page.tsx`   | Server | Notion (Sekretariat) | Secretariat portal landing.             |

### 6b. API Routes

**`/api/refine-aduan`**

- **Method:** POST
- **Input:** `{ message: string }`
- **Output:** `{ enhanced: string, error?: string }`
- **Side effects:** Calls Groq API for text refinement.
- **Auth:** Rate-limited by IP (15s cooldown).

**`/api/submit`**

- **Method:** POST
- **Input:** `{ intent: "submit-aduan", name, nim, message, ... }`
- **Output:** `{ success: boolean }`
- **Side effects:** Sends payload to Discord Webhook.

**`/api/notion-image`**

- **Method:** GET
- **Input:** `?url=[notion_s3_url]`
- **Output:** Binary Image
- **Side effects:** Caches images in `.next/cache/notion-images` for 14 days.

---

## 7. Content Model

### 7a. Notion Databases

- **Events Database:**
  - Env: `NOTION_AGENDA_PAGE_ID` (dynamically resolves child databases)
  - Properties: `Nama Acara` (Title), `Tanggal Acara` (Date), `Status` (Status), `Gambar` (Files).
  - Logic: Filtered by `Status` = "Published". Sorted by Date descending.
- **Sekretariat Database:**
  - Env: `NOTION_SEKRETARIAT_PAGE_ID` (dynamically resolves child databases)
  - Properties: `Nama Dokumen` (Title), `Slug` (Rich Text), `Kategori` (Relation), `Urutan Tampil` (Number).

---

## 8. Integrations & Data Flows

**AI Text Refinement (Aduan)**

- **Trigger:** User types in `Aduan` form and clicks "Bantu Perbaiki".
- **Flow:** `Aduan.tsx` (Client) → `/api/refine-aduan` → `refineParser.ts` → Groq API.
- **Payload:** Raw text content.
- **Response:** XML-wrapped enhanced text `<enhanced>...`.

**Canva-to-Instagram Planner**

- **Trigger:** Admin initiates "Fetch from Canva" in `/instagram-secret-page`.
- **Flow:** `canva.ts` (OAuth) → Canva API → S3 Storage (Supabase) → Image Slicing (Sharp).
- **Env Vars:** `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`.

---

## 9. Key Library Files

**`lib/notion.ts`**

- **Purpose:** Central Hub for Notion API interactions and ID resolution.
- **Exports:** `getNotionClient`, `resolveDataSourceIdSafe`, `fetchAllDocs`.
- **Caveats:** Uses a local cache for Data Source IDs to avoid repeated API calls.

**`lib/gsap.ts`**

- **Purpose:** Initializes GSAP with ScrollTrigger and exports global instances.

**`lib/discord.ts`**

- **Purpose:** Centralized Discord webhook forwarder.

---

## 10. Component Catalog

**`LocationInitializer`** (`components/LocatorInitializer.tsx`)

- Type: Client Component
- Responsibility: Injects LocatorJS in dev mode for UI-to-Code mapping.

**`NotionRenderer`** (`components/NotionRenderer.tsx`)

- Type: Client Component (renders Blocks)
- Responsibility: Maps Notion block types to Tailwind-styled React components.

**`SelectionTimelineCalendar`** (`components/SelectionTimelineCalendar.tsx`)

- Responsibility: Renders the OPREC timeline with GSAP staggers.

---

## 11. UI, Styling & Animation System

- **Colors:** Primary brand color is `gold-500` (`#D4A64D`). Secondary is `black`.
- **GSAP Logic:** Most views use `useViewEntrance` to coordinate stagger animations using `data-animate` attributes.
- **Typography:** `Inter` for body, `Playfair Display` for headings.

---

## 12. Feature Flags & Operational Caveats

- **`SHOW_DOCS_SIDEBAR`:** Hardcoded to `false` in `lib/feature-flags.ts`.
- **Hardcoded Strings:** Notion property names like `"Publish"`, `"Slug"`, and `"Order"` must exist in Notion databases for the portal to function.

---

## 13. Internal Tooling Routes

- **`/instagram-secret-page`**: Internal planner for Instagram grids. Uses Canva OAuth.

---

## 14. Most Critical Files

1. `lib/notion.ts`: The backbone of all CMS content fetching.
2. `lib/notion-shared.ts`: Contains the logic for parsing Notion's complex JSON blocks into clean Markdown/HTML.
3. `app/api/notion-image/route.ts`: Prevents broken images by proxying and caching.
4. `views/Home.tsx`: The primary entryway and showcase for the site's animation system.
5. `tailwind.config.mjs`: Defines the visual identity.

---

## 15. What Does NOT Exist

- **Public Authentication:** There are no user accounts for public users; everything is either public or "secret" by URL obscurity/env-token.
- **On-site Image Uploads:** Images for content are managed exclusively in Notion.

---

## 16. Recommended Entry Points

| Task Type             | Start Here                                               |
| --------------------- | -------------------------------------------------------- |
| Add a new public page | Create folder in `app/(public)/` and view in `views/`.   |
| Modify Notion sync    | Edit `lib/notion.ts` or `app/api/notion/sync-presensi/`. |
| Change brand colors   | Edit `tailwind.config.mjs`.                              |
| Update OPREC data     | Edit `lib/pendaftaran-data.ts`.                          |
