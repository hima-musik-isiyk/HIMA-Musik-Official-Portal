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

- **Page Builder & Universal Registry CMS:** All public pages and deep dynamic routes (Home, FAQ, KKM, Agenda, Karya, Sekretariat, Pendaftaran, including dynamic detail views like `ArchiveDetail`, `EventDetail`, and `DocPage`) are entirely driven by a Notion-backed `<PageBuilder>` layout engine. This eliminates hardcoded JSX pages by injecting server-side data (`injectedProps`) precisely into a unified `Registry` of reusable components. Non-developers can rearrange, toggle, or modify layouts seamlessly directly from Notion while maintaining a strict, unified design system.
- **Dynamic Landing Page:** Sleek homepage featuring responsive layouts, kinetic typography, and fluid entrance animations.
- **Cabinet Profile & KKM:** Sourced directly from Notion, organizing divisions, cabinet hierarchies, and student interest groups.
- **Open Recruitment (Oprec):** Fully-featured landing page and a multi-step interactive application form (routes: `/pendaftaran`, `/pendaftaran/form`).
  - Interactive org chart detailing cabinet hierarchies (Chairman, Vice, Secretary, Treasurer, and assistant spots).
  - High-density division guides showing main tasks, skills, and commitments via GSAP collapsible panels.
  - Step-by-step registration wizard featuring local auto-save draft states, character counts, validation alerts, and step-by-step progress tracking.
  - Automatic submission receipt delivery powered by Brevo Transactional SMTP email with customized HTML/text layouts.
  - Multi-admin Discord webhook integration providing detailed embeds of newly submitted applications.
- **Kalender Agenda:** Live tracking of academic schedules, projects, and repost schedules categorized by lifecycle (route: `/agenda`).
- **FAQ & Tanya Jawab:** Impromptu, quick-response Q&A board backed by a Notion database (route: `/faq`).
  - Merged spreadsheet-inspired board showing both answered and unanswered questions clearly in a unified, high-density interactive grid table.
  - Submit new impromptu questions via a collapsible glassmorphic drawer panel that maximizes table visibility.
  - Active real-time background polling (every 5 seconds) paired with a pulsing live sync indicator.
  - Hand-crafted inline thin-stroke SVG icons matching the unified design system.
  - Search query filters across questions, askers, and answers, alongside category and status lifecycle filters.
  - Custom Minecraft Standard Galactic character scrambler obfuscation for hidden content.
  - Dynamic page-by-page rendering with custom retro-themed `PaginationControl` for the board.
  - AI-assisted message refinement utilizing Groq (Llama 3) to automatically polish, format, and translate casual input into polite, formal questions.
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

2. Create a `.env.local` file in the project root and configure the necessary environment variables (refer to `.env.example` for details).

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
  - `(public)/` – Public-facing page layers dynamically rendered via CMS definitions.
  - `(internal)/` – Restricted workspace utilities and admin configurations.
  - `(legal)/` – Regulatory pages.
  - `api/` – Next.js serverless API route handlers managing notifications, integration webhooks, and real-time workspace synchronization.
  - `layout.tsx` & `page.tsx` – Global app layout and home view entry point
- `views/` – Page-level visual components, separating UI implementation from route declarations
- `components/` – Reusable layout shells and shared UI blocks (Navigation, Footer, Command Palette)
- `lib/` – Notion helper integrations, Supabase connectors, and custom hooks
- `services/` – Serverless parsing helpers and Groq AI text parsers
- `proxy.ts` – Next.js network-level boundary (handles dynamic redirects, request headers, and routing fail-safes)

## Container CMS Layout Architecture (Notion Builder)

The HIMA Musik portal uses a fully dynamic layout engine that pulls page structure directly from Notion. This architecture allows administrators to construct complex layouts, use reusable components, and alter the page design directly from the Notion UI without changing code.

### Core Builder Flow

1. **`lib/notion-builder.ts`**: Fetches layout definitions from the central Notion workspace database structure. It standardizes the data into standard layout schemas for pages, sections, component registry blocks, and dynamic variables.
2. **`components/builder/PageBuilder.tsx`**: Resolves the requested page slug (e.g. `/profil`, `/aduan`), fetches the associated sections, and orchestrates rendering.
3. **`components/builder/SectionBuilder.tsx`**: Renders `div` wrappers for sections and parses grouped layout structures (e.g. `orderOrGroup` like `0-1`, `0-2` to create CSS Flex/Grid groupings).
4. **`components/builder/ComponentBuilder.tsx` & `Registry.tsx`**: Maps the string identifiers from Notion (e.g. `"Title"`, `"Button"`, `"Aduan Form"`) to specific React implementations.

### Component Registry

All components available to the CMS must be mapped in `Registry.tsx`.

- **Core Components** (`components/builder/core/`): Generic visual elements like `GenericTitle`, `GenericDescription`, and `GenericButton`. These apply unified styling and animations.
- **Special Components** (`components/builder/special/`): Complex, functional blocks such as `AduanForm`, `StrukturOrganisasiGraph`, `KaryaGrid`, `AgendaList`, `FAQList`, `SekretariatGrid`, and `BerandaTitle`. These have been successfully extracted from legacy static views into modular components that dynamically consume `value1`, `value2`, and `value3` configurations from the CMS, making them fully compatible with the new architecture.

### Title Decor Word Split Behavior

For components that support word-splitting decoration (like `GenericTitle` and `BerandaTitle`), the `Value 2` field maps to `"Title Decor Word Split"`. This configuration allows you to format title layouts beautifully:

- **1-Based Indexing**: `Value 2` represents the index at which the title text is divided. The first `N` words form **Part A** (rendered with default styling), and all subsequent words form **Part B** (rendered in an elegant, styled italic/golden highlight).
  - For example, if the full text `Value 1` is `"HIMA MUSIK"`, and `Title Decor Word Split` is `1`:
    - **Part A** (first word) = `"HIMA"`
    - **Part B** (remaining words) = `"MUSIK"`
  - For example, if the full text `Value 1` is `"text is fun"`, and `Title Decor Word Split` is `2`:
    - **Part A** (first 2 words) = `"text is"`
    - **Part B** (remaining words) = `"fun"`
- **Robust Legacy Fallback**: If the `Value 2` property is non-numeric or missing, the components cleanly revert to a legacy fallback mode:
  - For `BerandaTitle`: **Part A** defaults to `Value 1 || "HIMA"` and **Part B** defaults to `Value 2 || "MUSIK"`.
  - For `GenericTitle`: The layout defaults to standard inline rendering of the entire `Value 1` text.

### Layout Boundaries & Page Max-Width

To maintain a consistent and unified design grid, the maximum width of all foreground contents inside any page rendered by the `<PageBuilder>` layout engine is dynamically driven by the CMS:

- **CMS-Driven Max-Width (`maxWidthClass`)**: Configured dynamically in Notion (e.g., `7xl`, `6xl`, `max`), mapping dynamically inside `SectionBuilder.tsx` (defaulting to `max-w-7xl` or `max-w-none` for `max`).
- **Global Alignment & Dynamic Header/Footer**: The shared global header (`Navigation` component) and footer are dynamically compiled based on page definitions, using layout properties from Notion to render precise visual alignment and ordering.
- **Section Shell Structure**:
  ```tsx
  <section
    id={section.slug}
    className="relative flex flex-col justify-center px-6 ..."
  >
    {/* Optional background layers */}
    <div className={`relative z-10 mx-auto w-full ${maxWidthClass}`}>
      <div className="flex flex-col gap-12">
        {/* Rendered dynamic page components */}
      </div>
    </div>
  </section>
  ```

### Layout Layering & Stacking Context

To ensure modular background decorations and light pillars (e.g., `<BerandaTempArtwork>`) do not cover essential interactive boundaries, the portal uses a strict global stacking system:

- **Navigation Menu (`z-50`)**: Remains pinned at the top level of the user interface for universal accessibility.
- **Global Footer (`z-10`)**: Layered above the main container to guarantee that absolute overlays, floating particles, and negative-bottom ornaments in the page body slide _underneath_ its solid `#09090b`/`#0a0a0a` backdrop.
- **Main Content Container (`z-3`)**: Holds the primary page sections and dynamic component builders.
- **Global Ambient Canvas (`z-1`)**: The underlying backdrop where static backgrounds and canvas particles are rendered.

This architecture entirely replaces hardcoded page views, routing all static routes (e.g. `/`, `/profil`, `/aduan`) through the universal `<PageBuilder slug="..." />` component.

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
- **Active Background Polling (5-Second Interval):** Components that require high-density or real-time synchronization (`FAQList`, `KKMGrid`, `SekretariatGrid`, and `AgendaList`) implement active silent background polling via `setInterval` running every 5 seconds. In contrast, slower-moving content like the works gallery (`KaryaGrid`) only fetches once on mount to optimize network usage.

#### Manual Force-Sync & Preview Action Bar

For administrative preview scenarios or when automatic webhooks are not yet triggered:

- **Secure Revalidation Controller (`/api/notion/revalidate`):** A public, rate-limited endpoint that securely clears and revalidates all CMS caches (`events`, `beranda`, `profil`, `kkm`, `faq`) without exposing integration keys. Includes an in-memory **10-second rate-limiting cooldown** to protect Notion API rates.
- **Interactive Action Bar (`PreviewActionBar.tsx`):** A sleek glassmorphic floating controller rendered at the top of preview routes (e.g., `/agenda/preview/[slug]`). Admins can click a "Sync data" button to trigger manual Edge Cache invalidation, showing live edits instantly upon automatic reload.

---

### Animation Systems & Creative Coding

To deliver an immersive, premium, and responsive user experience, the HIMA Musik portal deploys a highly advanced hybrid animation system that bridges GPU-accelerated WebGL shaders, timeline orchestration, and spring-based physics libraries.

#### 1. Volumetric Raymarching Light Pillar (`LightPillar.tsx`)

- **Purpose:** Renders highly-stylized, organic, glowing volumetric light pillars that serve as ambient overlays throughout key public sections of the portal.
- **Library Used:** Three.js (`three` package v0.183.1) and custom GLSL vertex/fragment shaders.
- **Algorithm & Mathematical Mechanics:**
  - **Raymarching / Sphere Tracing:** Unlike conventional polygons, the light pillar is drawn on a full-screen flat mesh (`PlaneGeometry(2, 2)`) using a customized raymarching algorithm computed entirely in a fragment shader on the GPU. The camera rays origin is fixed at `ro = vec3(0.0, 0.0, -10.0)` and marches along direction `rd = normalize(vec3(uv, 1.0))`.
  - **Dynamic Volumetric Deformers (Waves):** Organic fluid-like movements are modeled using a multi-octave 3D sine/cosine coordinate distortion loop:
    $$q = \text{rotate}(p.xz); \quad q += \cos(q.zxy \times \text{freq} - \text{uTime} \times j \times 2.0) \times \text{amp}$$
    where frequency (`freq`) doubles and amplitude (`amp`) halves at each octave iteration to generate high-frequency micro-deformations.
  - **Signed Distance Function (SDF) and Soft Blending:** The boundary cylinder is defined using:
    $$d = \text{length}(\cos(q.xz)) - 0.2$$
    which is then smoothly blended with the pillar width limits using a soft-maximum approximation:
    $$d = \max(d, \text{bound}) + \frac{h^2 \times 0.0625}{k}$$
  - **Volumetric Glow Accumulation:** The ray loops through up to `80` steps on high quality. At each step, a vertical gradient determines the color mixture:
    $$\text{col} += \text{mix}(\text{uBottomColor}, \text{uTopColor}, \text{grad}) / d$$
  - **Premium Polish:** Colors are soft-clamped using hyperbolic tangent tone-mapping (`col = tanh(col * glowAmount / widthNorm)`) to avoid color blowout, and layered with high-frequency film grain noise using the standard GPU dot-product hash:
    $$\text{grain} = \text{fract}(\sin(\text{dot}(\text{FragCoord}.xy, \text{vec2}(12.9898, 78.233))) \times 43758.5453) - 0.5$$
  - **Adaptive Performance Scaling:** Based on user-agent detection and `navigator.hardwareConcurrency`, the engine selects:
    - **High Quality:** 80 iterations, 4 wave octaves, native high-DPI scaling (capped at 2.0).
    - **Medium Quality:** 40 iterations, 2 wave octaves, 0.65x render resolution scale.
    - **Low Quality / Mobile:** 24 iterations, 1 wave octave, 0.5x render resolution scale, capped at 30 FPS.

#### 2. Universal View Entrance System (`useViewEntrance.ts` and `RouteEntranceAnimator.tsx`)

- **Purpose:** Smoothly staggers elements as they enter the browser viewport or transition during route changes.
- **Library Used:** GSAP (`gsap` package v3.14.2) and the `ScrollTrigger` plugin.
- **Algorithm & Simulated Workflow:**
  - **DOM Stagger Separation:** In the Isomorphic Layout phase, the hook scans target subtrees for `[data-animate]`. Any child located under `[data-animate-stagger]` is detached from standalone rendering and compiled into a single unified ScrollTrigger group to drastically reduce scroll listeners and DOM overhead.
  - **FOUC Prevention:** Instantly applies an initial transform state (e.g. `opacity: 0, y: 20` for variant `up`) on frame zero before browser paints.
  - **Initial Viewport Detection:** Uses the element's bounding client rectangle to check if it's already above the trigger line (e.g., `88%` of viewport height). Elements already in the viewport animate immediately using sequential millisecond staggers, while elements below the fold register a lazy ScrollTrigger that runs `once: true`.
  - **GPU Optimization:** Binds `willChange: "transform, opacity"` on animation start and fully strips them on complete (`clearProps: "all"`) to keep the DOM tree clean for subsequent interactions.

#### 3. Minecraft Standard Galactic Character Scrambler (`FAQList.tsx`)

- **Purpose:** Obfuscates hidden/withheld FAQ questions and answers, rendering them as encrypted galactic symbols with an active decryption visual state.
- **Library Used:** Pure React and Javascript standard timers.
- **Algorithm & Simulated Workflow:**
  - When a question's status is set to `Disembunyikan` (Hidden), `ObfuscatedMinecraftText` intercepts standard string rendering and triggers an internal loop.
  - **Iterative Glyphic Substitution:** Spawns an interval timer ticking every `80ms`. In each tick, the algorithm iterates over the original string. Spaces are preserved, while any other alphanumeric character is replaced by a randomized index lookup in:
    $$\text{"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789§!@\#\$\%\^{}\&*()\_+-=[]\{\}|;':\",./<>?"}}$$
  - **Visual Decoration:** Wraps the scrambled string in monospace font styling, increases character tracking, applies a CSS blur overlay (`blur-[1px] select-none`), and scales down text opacity. Toggling the status to visible immediately clears the interval to display clear text.

#### 4. Fluid Spring Micro-Interactions (`SelectionTimelineCalendar.tsx`)

- **Purpose:** Powers spring-based hover tooltips, status pills, and overlay transitions.
- **Library Used:** Framer Motion (`motion` package v12.34.3, imported as `motion/react`).
- **Algorithm:** Uses spring-based physics interpolation (non-linear mass, friction, and damping constants) wrapped inside `<AnimatePresence>` for fluid, glitch-free exit/entry nodes. Handles mouse location offset calculations to anchor tooltips precisely near cursor hover coordinates.
