"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import NotionRenderer, { extractHeadings } from "@/components/NotionRenderer";
import TableOfContents from "@/components/TableOfContents";
import { formatEventDateLabel } from "@/lib/event-dates";
import type { EventEntryMeta, NotionBlock } from "@/lib/notion";
import useViewEntrance from "@/lib/useViewEntrance";

function getLifecycleLabel(meta: EventEntryMeta): string {
  switch (meta.lifecycle) {
    case "upcoming":
      return "Pra-Acara";
    case "ongoing":
      return "Sedang Berlangsung";
    case "past":
      return "Pasca-Acara";
    case "announcement":
      return "Info & Pengumuman";
    case "timeless":
      return "Catatan Kegiatan";
    default:
      return "Publikasi";
  }
}

export default function EventDetailView({
  meta,
  blocks,
}: {
  meta: EventEntryMeta;
  blocks: NotionBlock[];
}) {
  const pathname = usePathname();
  const scopeRef = useViewEntrance(pathname || "");
  const headings = extractHeadings(blocks);

  return (
    <div ref={scopeRef} className="flex gap-8 px-6 py-10 md:px-10 lg:px-16">
      <article className="max-w-4xl min-w-0 flex-1">
        <nav
          className="mb-6 flex items-center gap-2 text-xs text-stone-500"
          data-animate="up"
        >
          <Link
            href="/events"
            className="transition-colors hover:text-stone-300"
          >
            Events
          </Link>
          <span>/</span>
          <span className="text-stone-400">{getLifecycleLabel(meta)}</span>
          <span>/</span>
          <span className="text-gold-400">{meta.title}</span>
        </nav>

        <header className="mb-10" data-animate="up" data-animate-delay="0.1">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="border-gold-500/30 bg-gold-500/10 text-gold-300 rounded-full border px-3 py-1 text-[0.62rem] font-medium tracking-[0.18em] uppercase">
              {getLifecycleLabel(meta)}
            </span>
            {meta.ownerUnit && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] font-medium tracking-[0.18em] text-stone-300 uppercase">
                {meta.ownerUnit}
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {meta.title}
          </h1>

          {meta.summary && (
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-stone-400">
              {meta.summary}
            </p>
          )}

          <dl className="mt-8 grid gap-4 border-y border-stone-800 py-5 text-sm md:grid-cols-2">
            {meta.eventDate && (
              <div>
                <dt className="mb-1 text-[0.62rem] tracking-[0.18em] text-stone-500 uppercase">
                  Tanggal Acara
                </dt>
                <dd className="text-stone-300">
                  {formatEventDateLabel(meta.eventDate, meta.eventDateEnd)}
                </dd>
              </div>
            )}
            {meta.ownerUnit && (
              <div>
                <dt className="mb-1 text-[0.62rem] tracking-[0.18em] text-stone-500 uppercase">
                  Penerbit
                </dt>
                <dd className="text-stone-300">{meta.ownerUnit}</dd>
              </div>
            )}
            {meta.location && (
              <div>
                <dt className="mb-1 text-[0.62rem] tracking-[0.18em] text-stone-500 uppercase">
                  Lokasi
                </dt>
                <dd className="text-stone-300">{meta.location}</dd>
              </div>
            )}
          </dl>

          {meta.registrationLink && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={meta.registrationLink}
                target="_blank"
                rel="noreferrer"
                className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 inline-flex items-center gap-2 border px-4 py-2 text-sm transition-colors"
              >
                Buka Pendaftaran
              </a>
            </div>
          )}
        </header>

        <div data-animate="up" data-animate-delay="0.2" className="prose-docs">
          <NotionRenderer
            blocks={blocks}
            basePath="/events"
            citationScope="events"
          />
        </div>

        <div
          data-animate="up"
          data-animate-delay="0.3"
          className="mt-16 border-t border-stone-800 pt-8"
        >
          <Link
            href="/events"
            className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
          >
            ← Kembali ke Events
          </Link>
        </div>
      </article>

      <div
        data-animate="left"
        data-animate-delay="0.3"
        className="hidden w-56 shrink-0 xl:block"
      >
        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}
