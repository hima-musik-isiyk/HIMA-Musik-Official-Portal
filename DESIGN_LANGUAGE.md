# HIMA Musik — Design Language

> Pre-read reference for developers and AI agents working on this portal.
> All UI decisions should align with these standards.

---

## Color System

| Token                     | Value                                 | Usage                    |
| ------------------------- | ------------------------------------- | ------------------------ |
| Background                | `#0a0a0a`                             | Page background          |
| Surface elevated          | `bg-white/2` – `bg-white/5`           | Cards, panels            |
| Border default            | `border-white/6` – `border-white/10`  | Containers, dividers     |
| Border interactive        | `border-gold-500/30`                  | Hover/active states      |
| Gold 500 (primary accent) | `#ff6501`                             | CTAs, highlights, links  |
| Gold 300                  | `#ffa07a`                             | Active text, badge text  |
| Text primary              | `text-white`                          | Headings, selected items |
| Text secondary            | `text-stone-400` / `text-neutral-400` | Body copy                |
| Text muted                | `text-stone-500` / `text-neutral-500` | Metadata, captions       |

### Gold Palette (from `index.css` @theme)

```
50: #fff4ed → 100: #ffe5d6 → 200: #ffc7ad → 300: #ffa07a
400: #ff7f45 → 500: #ff6501 → 600: #e25500 → 700: #b74300
800: #8f3500 → 900: #742c00 → 950: #3f1600
```

---

## Typography

| Role             | Font             | Tailwind Class |
| ---------------- | ---------------- | -------------- |
| Sans (body)      | Inter            | `font-sans`    |
| Serif (headings) | Playfair Display | `font-serif`   |

### Heading Scale

- Page title: `font-serif text-5xl md:text-7xl`
- Section heading: `font-serif text-3xl md:text-4xl`
- Card title: `font-serif text-2xl md:text-[1.85rem]`
- Subsection: `font-serif text-xl`

### Body Text

- Default: `text-base text-neutral-400`
- Small: `text-sm text-stone-400`
- Micro / labels: `text-xs tracking-[0.18em] uppercase text-stone-500`

---

## Border Radius Policy

| Element Type                                             | Radius         | Method                                             |
| -------------------------------------------------------- | -------------- | -------------------------------------------------- |
| Interactive (buttons, inputs, selects, links-as-buttons) | `0.5rem`       | `style={{ borderRadius: "var(--radius-action)" }}` |
| Layout containers (cards, panels, sections)              | `0`            | No border-radius (sharp edges)                     |
| Badges / pills                                           | `rounded-full` | Tailwind class                                     |
| Calendar day events                                      | `rounded-sm`   | Tailwind class                                     |

The CSS variable `--radius-action: 0.5rem` is defined in `:root` in `index.css`.

---

## Select / Dropdown Standard

All `<select>` elements must follow this pattern:

```tsx
<div className="group relative">
  <select
    className="appearance-none ... ..."
    style={{ borderRadius: "var(--radius-action)" }}
  >
    <option className="bg-[#111] text-neutral-300" value="...">
      ...
    </option>
  </select>
  <div className="pointer-events-none absolute bottom-0 right-0 top-0 flex items-center pr-4 text-gold-500/60 transition-colors duration-300 group-focus-within:text-gold-300">
    <IconChevronDown />
  </div>
</div>
```

Key rules:

1. `appearance-none` to hide browser default chevron
2. Custom chevron via absolutely-positioned SVG icon (`<IconChevronDown />`)
3. Chevron color transitions on focus (`text-gold-500/60` → `text-gold-300`)
4. `pointer-events-none` on the chevron container
5. `borderRadius: var(--radius-action)` via inline style

---

## Icon Policy

- **No icon libraries** (no Lucide, Heroicons, FontAwesome, etc.)
- **No emojis** in rendered UI
- All icons are hand-crafted inline SVGs in `components/Icons.tsx`
- Default size: 14×14 or 16×16
- Stroke-based, `strokeWidth: 1.5`, inheriting `currentColor`
- Available icons: `IconMapPin`, `IconExternalLink`, `IconCalendar`, `IconCheck`, `IconDiamond`, `IconChevronDown`

> Note: Emojis in server-side API payloads (e.g. Telegram messages) are acceptable since they are not rendered in the portal UI.

---

## Card Anatomy (Event Cards)

```
┌─────────────────────────────────────────────────────┐
│  [Cover Image / Gradient Fallback]  │  Content      │
│  (18rem width on desktop)           │               │
│  (no entry.icon display)            │  [badge] [unit]
│                                     │  Title        │
│                                     │  Summary (2 lines, clamped)
│                                     │               │
│                                     │  date · location · ↗
└─────────────────────────────────────────────────────┘
```

Rules:

- Summary always reserves 2 lines (`line-clamp-2` + `min-h-[2.625rem]`)
- No explicit CTA text — the card itself is the link
- Metadata uses `·` separators with SVG icons
- No `entry.icon` rendering — unprofessional

---

## Interactive States

| State             | Treatment                                                       |
| ----------------- | --------------------------------------------------------------- |
| Default           | `border-white/8 text-stone-400`                                 |
| Hover             | `hover:border-gold-500/30 hover:bg-gold-500/8 hover:text-white` |
| Active / Selected | `border-gold-500/30 bg-gold-500/8 text-white`                   |
| Disabled          | `disabled:cursor-not-allowed disabled:opacity-25`               |
| Focus (inputs)    | `focus:border-gold-500 focus:ring-gold-500 focus:ring-1`        |

---

## Animation Attributes

| Attribute                      | Usage                                |
| ------------------------------ | ------------------------------------ |
| `data-animate="up"`            | Entrance animation (slide up + fade) |
| `data-animate="fade"`          | Entrance animation (fade only)       |
| `data-animate="left"`          | Entrance animation (slide from left) |
| `data-animate-delay="0.1"`     | Stagger delay in seconds             |
| `data-animate-duration="0.8"`  | Custom duration                      |
| `data-animate-stagger="0.1"`   | Auto-stagger children                |
| `data-animate-scroll="true"`   | Trigger on scroll into view          |
| `data-animate-start="top 92%"` | ScrollTrigger start position         |

---

## Section Header Convention

```tsx
<div className="mb-6 flex items-center gap-4">
  <span className="block h-px w-8 bg-gold-500/40 md:w-12" aria-hidden="true" />
  <p className="text-sm font-medium text-gold-500">Section Label</p>
</div>
```

---

## Naming Convention (Events)

| Lifecycle Value | Display Label |
| --------------- | ------------- |
| `upcoming`      | Upcoming      |
| `ongoing`       | Ongoing       |
| `past`          | Archive       |
| `announcement`  | Announcement  |
| `timeless`      | Note          |

Filters are based on `entryKind` (content type), not `lifecycle` (time status).
