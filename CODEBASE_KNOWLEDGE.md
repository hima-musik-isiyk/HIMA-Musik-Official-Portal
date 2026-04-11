# HIMA Musik Official Portal Codebase Knowledge

This file is an agent-oriented map of the current project state. It is meant to help a new agent get productive quickly without reverse-engineering the whole repository first.

## 1. Project Identity

- Project name: `hima-musik---official-portal`
- Current framework: Next.js App Router
- Language: TypeScript
- Runtime style: hybrid server-rendered pages plus client-side interactive views
- Main purpose:
  - present HIMA MUSIK public information
  - publish events and internal documentation
  - expose Sekretariat and KKM content sourced from Notion
  - collect student complaints (`aduan`)
  - collect recruitment registrations (`pendaftaran`)
  - handle sekretariat service request forms

Important note:

- The current root `README.md` is stale. It still describes the app as a Vite SPA with hash routing, but the actual codebase is now a Next.js app using the `app/` directory.

## 2. High-Level Architecture

The project is organized around this split:

- `app/`
  - Next.js routes, layouts, API endpoints
- `views/`
  - page-level React UI components used by route files
- `components/`
  - reusable UI building blocks
- `lib/`
  - shared utilities, Notion integration, animation helpers, static data, Prisma bootstrap
- `services/`
  - AI text refinement helpers and parsing logic
- `prisma/`
  - schema and migrations for PostgreSQL
- `public/`
  - static assets like logo/icon

Architectural pattern used repeatedly:

- route file in `app/.../page.tsx`
- fetch data on server if needed
- render a page-level component from `views/...`

Examples:

- `app/events/page.tsx` -> fetches events collection -> renders `views/Events.tsx`
- `app/sekretariat/[slug]/page.tsx` -> fetches Notion doc -> renders `views/DocPage.tsx`
- `app/kkm/[slug]/page.tsx` -> fetches KKM entry -> renders `views/DocPage.tsx` with different props

## 3. Tech Stack

- Next.js `^16.1.6`
- React `^18.2.0`
- TypeScript `~5.8.2`
- Tailwind CSS `^4.1.18`
- GSAP for entrance/scroll animations
- Prisma `^7.4.1`
- PostgreSQL via `@prisma/adapter-pg`
- Notion API via `@notionhq/client`
- `notion-to-md` for Notion content handling
- Telegram Bot API for notifications
- Brevo SMTP API for registration confirmation email
- Groq API for complaint text refinement

## 4. Current Route Map

### Public pages

- `/` -> Home
- `/about` -> organization profile and cabinet
- `/events` -> event listing with lifecycle grouping
- `/events/[slug]` -> event detail page from Notion
- `/gallery` -> currently placeholder page, directs users to Instagram
- `/aduan` -> complaint/aspiration form
- `/pendaftaran` -> recruitment landing page
- `/pendaftaran/form` -> recruitment submission form
- `/kkm` -> KKM portal
- `/kkm/[slug]` -> KKM detail page from Notion

### Sekretariat pages

- `/sekretariat` -> docs portal landing page
- `/sekretariat/[slug]` -> detail page for a Notion-backed Sekretariat document
- `/sekretariat/archives` -> archive listing
- `/sekretariat/archives/[id]` -> archive detail page
- `/sekretariat/forms/surat-aktif` -> student active-organization letter request
- `/sekretariat/forms/peminjaman-alat` -> equipment borrowing request

### API routes

- `/api/submit`
  - receives aduan submissions
  - sends message to Telegram
  - writes to Prisma `Aduan`
- `/api/refine-aduan`
  - refines complaint text via Groq
  - includes rate limiting by request identity
- `/api/pendaftaran`
  - validates recruitment data
  - sends confirmation email with Brevo
  - writes to Prisma `Pendaftaran`
  - sends Telegram success/error notifications
- `/api/citation`
  - resolves custom Notion citation anchors
- `/api/sekretariat/search`
  - searches Notion docs
- `/api/sekretariat/forms`
  - handles sekretariat request forms
  - optionally creates a Notion kanban card
  - optionally sends Telegram notification

## 5. Content Model: What Lives Where

The project mixes static in-repo content and dynamic external content.

### Static in code

- Home page hero and marketing copy: `views/Home.tsx`
- About page executive list and narrative: `views/About.tsx`
- Recruitment content:
  - divisions and timeline: `lib/pendaftaran-data.ts`
  - landing and form UX: `views/PendaftaranLanding.tsx`, `views/Pendaftaran.tsx`
- KKM ordering rules: `lib/kkm-data.ts`
- Sekretariat footer copy: `lib/site-copy.ts`
- Gallery page placeholder copy: `views/Gallery.tsx`

### Dynamic from Notion

- Sekretariat docs
- Sekretariat archives
- KKM entries
- Events

The Notion integration is centralized in `lib/notion.ts`.

Key environment-based Notion sources:

- `NOTION_SEKRETARIAT_DATABASE_ID` or fallback `NOTION_PROJECT_DATABASE_ID`
- `NOTION_KKM_DATABASE_ID`
- `NOTION_EVENTS_DATABASE_ID`

Common Notion fields used by the code:

- `Slug`
- `Category`
- `Order`
- `Publish`
- `Summary`
- `Tags`
- `Date`
- `Name`
- `Entry Kind`
- `Event Date`
- `Owner Unit`
- `Location`
- `Registration Link`
- `Link Sosmed`
- `Jargon`
- `Deskripsi Singkat`

### Dynamic from database

- `Aduan` submissions
- `Pendaftaran` submissions

These are persisted via Prisma to PostgreSQL.

## 6. Prisma / Database Model

Defined in `prisma/schema.prisma`.

### `Aduan`

- `id`
- `name`
- `nim`
- `category`
- `message`
- `createdAt`

### `Pendaftaran`

- `id`
- `firstChoice`
- `secondChoice`
- `angkatan`
- `pddSubfocus`
- `fullName`
- `nim`
- `email`
- `phone`
- `instagram`
- `motivation`
- `experience`
- `availability` as string array
- `portfolio`
- `submittedAt`

Database bootstrap:

- `lib/prisma.ts`
- requires `DATABASE_URL_POOLED`

## 7. Important Integrations and Flows

### Aduan flow

Frontend:

- page: `app/aduan/page.tsx`
- UI: `views/Aduan.tsx`
- local autosave in browser storage
- optional AI refinement call to `/api/refine-aduan`

Backend:

- `/api/refine-aduan` calls Groq and parses XML-like output using `services/refineParser.ts`
- `/api/submit` sends Telegram message and then writes to Prisma
- if DB write fails after Telegram succeeds, a Telegram error notification may be sent to a dedicated error topic

### Pendaftaran flow

Frontend:

- gated by `FEATURES.ALLOW_PENDAFTARAN`
- landing page: `app/pendaftaran/page.tsx`
- form page: `app/pendaftaran/form/page.tsx`
- form UI includes autosave and multi-step validation

Backend:

- `/api/pendaftaran`
- validates division choice, angkatan restrictions, PDD subfocus, NIM/email/phone format, motivation length, availability
- sends registration proof email using Brevo
- writes submission to Prisma
- sends Telegram notification
- if DB write fails, sends Telegram error alert

Important behavior:

- recruitment pages redirect to `/` when `ALLOW_PENDAFTARAN` is false
- currently `ALLOW_PENDAFTARAN` is development-only in `lib/feature-flags.ts`

### Sekretariat forms flow

Frontend:

- `views/SuratAktifForm.tsx`
- `views/PeminjamanAlatForm.tsx`

Backend:

- `/api/sekretariat/forms`
- can create a card in Notion kanban if `NOTION_KANBAN_DATABASE_ID` exists
- can notify Telegram if form env vars exist

### Sekretariat / KKM / Events content flow

- server page requests data through `lib/notion.ts`
- Notion data is cached with `unstable_cache` and revalidated every 60 seconds in most pages
- detail pages fetch blocks recursively from Notion
- `components/NotionRenderer.tsx` renders the block content
- `components/TableOfContents.tsx` uses extracted headings
- custom citation/anchor resolution is supported through `cite://` and `block://` conventions

## 8. Notion Integration Details

This is one of the most important subsystems in the repo.

Core file:

- `lib/notion.ts`

Key exported functions:

- `fetchAllDocs()`
- `fetchDocBySlug(slug)`
- `fetchArchives(tag?)`
- `fetchArchiveById(id)`
- `fetchKKMGroups()`
- `fetchKKMEntryBySlug(slug)`
- `fetchEventsCollection()`
- `fetchAllEventEntries()`
- `fetchEventBySlug(slug)`
- `searchDocs(query)`
- `resolveCitation(scope, slug, anchorId)`

Important implementation details:

- supports both legacy database IDs and newer Notion data source IDs
- normalizes and resolves IDs via `resolveDataSourceId`
- recursively fetches block trees
- uses cached queries heavily
- treats docs as published by default unless `Publish` is explicitly false

Custom content-linking behavior:

- implemented in `lib/notion-shared.ts`
- supports anchor tags embedded in content like `[#anchor-id]` and `[#anchor-id+]`
- supports inline custom links:
  - `block://...`
  - `cite://doc-slug#anchor-id`

This means agent changes involving Notion rendering or editorial linking should inspect:

- `lib/notion.ts`
- `lib/notion-shared.ts`
- `components/NotionRenderer.tsx`
- `app/api/citation/route.ts`

## 9. UI / UX Structure

Global shell lives in `app/layout.tsx`.

Shared shell pieces:

- `components/Navigation.tsx`
- `components/Footer.tsx`
- `components/CommandPalette.tsx`
- `components/RouteEntranceAnimator.tsx`
- `components/LocatorInitializer.tsx`

Sekretariat nested layout:

- `app/sekretariat/layout.tsx`
- fetches docs and renders `components/DocsSidebar.tsx`

Design system reference:

- `DESIGN_LANGUAGE.md`

Key design rules from that file:

- dark background aesthetic with orange-gold accent
- serif headings and sans body text
- sharp container edges, rounded interactive controls
- custom inline SVG icons preferred over icon-library usage in rendered UI
- animation conventions use `data-animate` attributes

## 10. Animation and Interaction Patterns

This repo uses a custom entrance animation system.

Primary files:

- `lib/useViewEntrance.ts`
- `lib/view-entrance.ts`
- `lib/gsap.ts`

Pattern:

- page/view attaches `const scopeRef = useViewEntrance(pathname)`
- wrapper receives `ref={scopeRef}`
- child elements opt into animation with `data-animate="up|fade|left|right|scale|scale-x"`

Additional interaction patterns:

- command palette shortcut helpers in `lib/shortcut.ts`
- route transition wrapper via `components/RouteEntranceAnimator.tsx`
- some pages use GSAP directly for accordions/timelines

## 11. Folder Hierarchy Reference

High-value folders and their roles:

```text
app/
  layout.tsx                     Global layout shell
  page.tsx                       Home route
  about/page.tsx                 About route
  aduan/page.tsx                 Complaint route
  events/                        Event index + detail routes
  gallery/page.tsx               Gallery route
  kkm/                           KKM index + detail routes
  pendaftaran/                   Recruitment landing + form routes
  sekretariat/                   Docs portal, archives, forms, nested layout
  api/                           All server endpoints

views/
  Home.tsx
  About.tsx
  Aduan.tsx
  Events.tsx
  EventDetail.tsx
  DocsPortal.tsx
  DocPage.tsx
  Archives.tsx
  ArchiveDetail.tsx
  KKMPortal.tsx
  PendaftaranLanding.tsx
  Pendaftaran.tsx
  SuratAktifForm.tsx
  PeminjamanAlatForm.tsx

components/
  Navigation.tsx
  Footer.tsx
  DocsSidebar.tsx
  NotionRenderer.tsx
  TableOfContents.tsx
  CommandPalette.tsx
  SelectionTimelineCalendar.tsx
  Icons.tsx

lib/
  notion.ts
  notion-shared.ts
  prisma.ts
  pendaftaran-data.ts
  kkm-data.ts
  event-dates.ts
  feature-flags.ts
  useViewEntrance.ts
  view-entrance.ts
  shortcut.ts

services/
  aiTextService.ts
  geminiService.ts
  refineParser.ts

prisma/
  schema.prisma
  migrations/
```

## 12. Environment Variables

From `.env.example` and code usage, the important env vars are:

### AI

- `GROQ_API_KEY`
- fallback legacy name: `API_KEY`

### Telegram

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_GROUP_CHAT_ID`
- `TELEGRAM_TOPIC_ID_COMPLAINTS`
- `TELEGRAM_TOPIC_ID_REGISTRATION`
- also used in code but not listed in `.env.example`:
  - `TELEGRAM_TOPIC_ID`
  - `TELEGRAM_PENDAFTARAN_TOPIC_ID`
  - `TELEGRAM_ERROR_TOPIC_ID`
  - `TELEGRAM_CHAT_ID`
  - `TELEGRAM_FORMS_TOPIC_ID`

### Email

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- also used in code:
  - `ADMIN_EMAIL`

### Database

- `DATABASE_URL_POOLED`

### Notion

- `NOTION_INTEGRATION_TOKEN`
- `NOTION_EVENTS_DATABASE_ID`
- `NOTION_GALLERY_DATABASE_ID`
- `NOTION_SEKRETARIAT_DATABASE_ID`
- `NOTION_KKM_DATABASE_ID`
- also used in code:
  - `NOTION_PROJECT_DATABASE_ID`
  - `NOTION_KANBAN_DATABASE_ID`

### Dev tooling

- `ENABLE_LOCATOR`
- `NEXT_PUBLIC_ENABLE_LOCATOR`

Recommendation:

- keep `.env.example` updated because it currently does not list every variable referenced by the code

## 13. Feature Flags and Operational Caveats

In `lib/feature-flags.ts`:

- `SHOW_DOCS_SIDEBAR` is hardcoded `false`
- `ALLOW_PENDAFTARAN` is `process.env.NODE_ENV === "development"`

Operational effect:

- recruitment routes are effectively disabled in production unless this flag logic is changed
- some Sekretariat sidebar behavior appears intentionally hidden for now

## 14. Known Inconsistencies / Things To Watch

These are useful for any future agent:

- `README.md` is outdated and still describes Vite/hash routing
- `services/geminiService.ts` is not actually Gemini-based; it duplicates Groq logic from `services/aiTextService.ts`
- `.env.example` is incomplete compared with actual env usage in API routes
- `NOTION_GALLERY_DATABASE_ID` exists in `.env.example`, but the current gallery page is still a static placeholder
- some Telegram env variable names differ by feature and are not fully standardized

## 15. Most Important Files for Orientation

If a future agent only has a few minutes, these files give the fastest understanding:

- `package.json`
- `app/layout.tsx`
- `app/sekretariat/layout.tsx`
- `lib/notion.ts`
- `lib/notion-shared.ts`
- `lib/prisma.ts`
- `prisma/schema.prisma`
- `lib/feature-flags.ts`
- `lib/pendaftaran-data.ts`
- `views/Pendaftaran.tsx`
- `views/Aduan.tsx`
- `views/DocsPortal.tsx`
- `components/NotionRenderer.tsx`
- `DESIGN_LANGUAGE.md`

## 16. Recommended Additions Beyond Basic Hierarchy

You asked for content, hierarchy, structure, and "what's inside it." Those are covered above. These are the next most useful additions if you want this knowledge base to become even better for future agents:

- Add a "Notion schema contract" section
  - list exact expected property names and types for each database: Sekretariat, Events, KKM, Kanban
- Add API request/response examples
  - especially for `/api/pendaftaran`, `/api/submit`, `/api/sekretariat/forms`
- Add a deployment/runtime section
  - Vercel assumptions, production env requirements, ISR behavior, failure modes
- Add an ownership/editorial workflow section
  - who updates Notion content, how slugs are chosen, what categories are valid
- Add a testing section
  - current test coverage is effectively absent, so documenting manual verification flows would help a lot
- Add a change-risk map
  - explain which files are safe to edit for copy-only changes vs integration-sensitive changes
- Add a "common tasks for agents" section
  - example: add a new Sekretariat doc type, add a new event field, adjust recruitment opening logic, add a new Telegram notification path
- Add a "stale docs and debt" section
  - keep a running list of mismatches like the stale README, duplicate service file, or env drift

## 17. Suggested Future Markdown Files

If you want to split documentation by concern later, these files would be high-value:

- `docs/architecture.md`
- `docs/notion-content-model.md`
- `docs/api-contracts.md`
- `docs/deployment-env.md`
- `docs/agent-playbook.md`
- `docs/manual-test-checklist.md`

## 18. Quick Summary

This codebase is a Next.js portal for HIMA MUSIK that combines:

- static organization/recruitment UI
- Notion-driven content portals for Sekretariat, KKM, and Events
- Prisma-backed intake flows for complaints and recruitment
- Telegram, Brevo, and Groq integrations

The two most critical subsystems to understand before making major changes are:

- `lib/notion.ts` for content architecture
- the API routes plus Prisma schema for operational workflows
