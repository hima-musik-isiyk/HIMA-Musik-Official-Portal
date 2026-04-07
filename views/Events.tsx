"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  formatEventDateLabel,
  getDateOnly,
  getEventDateKeysInRange,
  getEventMonthKeysInRange,
  parseEventDateValue,
} from "@/lib/event-dates";
import type { EventEntryMeta, EventsCollection } from "@/lib/notion";
import useViewEntrance from "@/lib/useViewEntrance";

const DAYS_OF_WEEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function formatDate(date: string): string {
  const parsed = parseEventDateValue(date);
  if (!parsed) return "";

  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function getEventLabel(entry: EventEntryMeta): string {
  switch (entry.lifecycle) {
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

function getEventTone(entry: EventEntryMeta): string {
  switch (entry.lifecycle) {
    case "upcoming":
      return "border-gold-500/30 bg-gold-500/10 text-gold-200";
    case "ongoing":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "past":
      return "border-white/10 bg-white/6 text-stone-300";
    case "announcement":
      return "border-sky-400/20 bg-sky-400/10 text-sky-100";
    default:
      return "border-white/10 bg-white/5 text-stone-300";
  }
}

function EventCalendar({ collection }: { collection: EventsCollection }) {
  const datedEntries = useMemo(() => {
    return [...collection.upcoming, ...collection.ongoing, ...collection.past]
      .map((entry) => {
        const startDate = parseEventDateValue(entry.eventDate);
        const endDate = parseEventDateValue(
          entry.eventDateEnd || entry.eventDate,
        );
        const dayKeys = getEventDateKeysInRange(
          entry.eventDate,
          entry.eventDateEnd,
        );
        return startDate && dayKeys.length > 0
          ? {
              entry,
              startDate,
              endDate: endDate ?? startDate,
              dayKeys,
            }
          : null;
      })
      .filter(
        (
          item,
        ): item is {
          entry: EventEntryMeta;
          startDate: Date;
          endDate: Date;
          dayKeys: string[];
        } => item !== null,
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [collection]);

  const monthOptions = useMemo(() => {
    const uniqueMonths = new Map<string, Date>();
    const todayMonth = startOfMonth(new Date());

    uniqueMonths.set(toMonthKey(todayMonth), todayMonth);

    for (const item of datedEntries) {
      for (const monthKey of getEventMonthKeysInRange(
        item.entry.eventDate,
        item.entry.eventDateEnd,
      )) {
        const [year, month] = monthKey.split("-").map(Number);
        const monthDate = new Date(Date.UTC(year, month - 1, 1));
        uniqueMonths.set(monthKey, monthDate);
      }
    }

    return [...uniqueMonths.values()].sort((a, b) => a.getTime() - b.getTime());
  }, [datedEntries]);

  const initialMonthIndex = useMemo(() => {
    if (monthOptions.length === 0) return 0;

    const todayMonthKey = toMonthKey(startOfMonth(new Date()));
    const activeIndex = monthOptions.findIndex(
      (month) => toMonthKey(month) === todayMonthKey,
    );

    return activeIndex >= 0
      ? activeIndex
      : Math.max(0, monthOptions.length - 1);
  }, [monthOptions]);

  const [activeMonthIndex, setActiveMonthIndex] = useState(initialMonthIndex);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const activeMonth = monthOptions[activeMonthIndex] ?? null;

  const calendarDays = useMemo(() => {
    if (!activeMonth) return [];

    const year = activeMonth.getUTCFullYear();
    const month = activeMonth.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    const dayOffset = (firstDay.getUTCDay() + 6) % 7;
    const gridStart = new Date(Date.UTC(year, month, 1 - dayOffset));

    return Array.from({ length: 35 }, (_, index) => {
      return new Date(
        Date.UTC(
          gridStart.getUTCFullYear(),
          gridStart.getUTCMonth(),
          gridStart.getUTCDate() + index,
        ),
      );
    });
  }, [activeMonth]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, EventEntryMeta[]>();

    for (const { entry, dayKeys } of datedEntries) {
      for (const key of dayKeys) {
        const current = map.get(key) ?? [];
        current.push(entry);
        map.set(key, current);
      }
    }

    return map;
  }, [datedEntries]);

  const activeMonthEntries = useMemo(() => {
    if (!activeMonth) return [];
    const monthKey = toMonthKey(activeMonth);
    return datedEntries.filter(({ dayKeys }) =>
      dayKeys.some((key) => key.slice(0, 7) === monthKey),
    );
  }, [activeMonth, datedEntries]);

  const getFirstDayInActiveMonth = (dayKeys: string[]) => {
    const monthKey = activeMonth ? toMonthKey(activeMonth) : "";
    return (
      dayKeys.find((key) => key.slice(0, 7) === monthKey) ?? dayKeys[0] ?? null
    );
  };

  const activeDateKey =
    selectedDateKey && entriesByDay.has(selectedDateKey)
      ? selectedDateKey
      : activeMonthEntries[0]
        ? getFirstDayInActiveMonth(activeMonthEntries[0].dayKeys)
        : null;

  const selectedEntries = activeDateKey
    ? (entriesByDay.get(activeDateKey) ?? [])
    : [];
  const selectedDate = activeDateKey
    ? parseEventDateValue(activeDateKey)
    : null;

  if (datedEntries.length === 0) return null;

  return (
    <section data-animate="up" data-animate-duration="0.85" className="mb-20">
      <div className="relative overflow-hidden border border-white/8 bg-[linear-gradient(180deg,rgba(255,101,1,0.08)_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.01)_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,127,69,0.18)_0%,transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06)_0%,transparent_30%)]" />
        <div
          data-animate-stagger="0.1"
          className="relative z-10 p-6 md:p-8 lg:p-10"
        >
          <div
            data-animate="up"
            className="mb-8 flex flex-col gap-6 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <p className="text-gold-400 text-xs font-medium tracking-[0.28em] uppercase">
                Kalender Agenda
              </p>
              <h2 className="mt-3 font-serif text-3xl text-white md:text-5xl">
                Peta waktu kegiatan HIMA Musik
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-400 md:text-base">
                Jelajahi agenda per bulan untuk melihat ritme kegiatan, tanggal
                pelaksanaan, dan publikasi yang sedang aktif.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start lg:self-auto">
              <button
                type="button"
                onClick={() =>
                  setActiveMonthIndex((index) => Math.max(0, index - 1))
                }
                disabled={activeMonthIndex === 0}
                className="hover:border-gold-500/40 cursor-pointer border border-white/10 px-4 py-2 text-sm text-stone-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                ← Bulan sebelumnya
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveMonthIndex((index) =>
                    Math.min(monthOptions.length - 1, index + 1),
                  )
                }
                disabled={activeMonthIndex === monthOptions.length - 1}
                className="hover:border-gold-500/40 cursor-pointer border border-white/10 px-4 py-2 text-sm text-stone-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Bulan berikutnya →
              </button>
            </div>
          </div>

          <div
            data-animate="up"
            className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="font-serif text-2xl text-white md:text-3xl">
                {activeMonth
                  ? formatMonthLabel(activeMonth)
                  : "Belum ada bulan"}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {activeMonthEntries.length} agenda bertanggal pada bulan ini
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {monthOptions.map((month, index) => {
                const isActive = index === activeMonthIndex;
                return (
                  <button
                    key={toMonthKey(month)}
                    type="button"
                    onClick={() => setActiveMonthIndex(index)}
                    className={`cursor-pointer border px-3 py-2 text-xs tracking-[0.18em] uppercase transition ${
                      isActive
                        ? "border-gold-500/50 bg-gold-500/12 text-gold-200"
                        : "border-white/8 text-stone-500 hover:border-white/20 hover:text-stone-200"
                    }`}
                  >
                    {month.toLocaleDateString("id-ID", {
                      month: "short",
                      year: "2-digit",
                      timeZone: "Asia/Jakarta",
                    })}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            data-animate="up"
            className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.95fr)]"
          >
            <div className="overflow-hidden border border-white/8 bg-black/30">
              <div className="hidden md:grid md:grid-cols-7 md:border-b md:border-white/8">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="px-4 py-4 text-center text-[0.68rem] tracking-[0.22em] text-stone-500 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="hidden md:grid md:grid-cols-7 md:gap-px md:bg-white/8">
                {calendarDays.map((date, index) => {
                  const dateKey = getDateOnly(date.toISOString());
                  const dayEntries = entriesByDay.get(dateKey) ?? [];
                  const isCurrentMonth =
                    activeMonth &&
                    date.getUTCMonth() === activeMonth.getUTCMonth() &&
                    date.getUTCFullYear() === activeMonth.getUTCFullYear();
                  const isSelected = activeDateKey === dateKey;
                  const isToday = isSameDay(date, new Date());
                  const dayColumn = index % 7;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() =>
                        dayEntries.length > 0 && setSelectedDateKey(dateKey)
                      }
                      className={`min-h-38 text-left transition ${
                        isCurrentMonth ? "bg-[#090909]" : "bg-[#090909]/70"
                      } ${
                        dayEntries.length > 0
                          ? "cursor-pointer hover:bg-white/4"
                          : "cursor-default"
                      } ${
                        isSelected ? "ring-gold-500/50 ring-1 ring-inset" : ""
                      }`}
                    >
                      <div className="flex h-full flex-col px-4 py-4">
                        <div className="mb-4 flex items-center justify-between">
                          <span
                            className={`font-serif text-lg ${
                              isCurrentMonth ? "text-white" : "text-stone-600"
                            } ${isToday ? "text-gold-400" : ""}`}
                          >
                            {date.getUTCDate()}
                          </span>
                          {isToday && (
                            <span className="text-gold-400 text-[0.58rem] tracking-[0.22em] uppercase">
                              Hari ini
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {dayEntries.slice(0, 3).map((entry) => {
                            const rangeKeys = getEventDateKeysInRange(
                              entry.eventDate,
                              entry.eventDateEnd,
                            );
                            const isRangeEvent = rangeKeys.length > 1;
                            const isActualStart = rangeKeys[0] === dateKey;
                            const isActualEnd =
                              rangeKeys[rangeKeys.length - 1] === dateKey;
                            const continuesFromPreviousDay =
                              rangeKeys.includes(dateKey) && !isActualStart;
                            const continuesToNextDay =
                              rangeKeys.includes(dateKey) && !isActualEnd;
                            const isSegmentStart =
                              !continuesFromPreviousDay || dayColumn === 0;
                            const isSegmentEnd =
                              !continuesToNextDay || dayColumn === 6;
                            const showTitle =
                              !isRangeEvent || isActualStart || dayColumn === 0;

                            return (
                              <span
                                key={entry.id}
                                className={`relative block border px-2.5 py-2 text-[0.72rem] leading-snug ${
                                  isRangeEvent
                                    ? [
                                        isSegmentStart
                                          ? "ml-0 rounded-l-sm border-l"
                                          : "-ml-px rounded-none border-l-0",
                                        isSegmentEnd
                                          ? "mr-0 rounded-r-sm border-r"
                                          : "-mr-px rounded-none border-r-0",
                                        "border-y",
                                      ].join(" ")
                                    : "rounded-sm"
                                } ${getEventTone(entry)}`}
                              >
                                <span className="block truncate">
                                  {showTitle ? entry.title : "\u00A0"}
                                </span>
                              </span>
                            );
                          })}
                          {dayEntries.length > 3 && (
                            <span className="block px-1 text-[0.7rem] text-stone-500">
                              +{dayEntries.length - 3} agenda lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 md:hidden">
                {activeMonthEntries.map(({ entry, dayKeys }) => {
                  const dateKey = getFirstDayInActiveMonth(dayKeys) ?? "";
                  const isSelected = activeDateKey === dateKey;
                  const listDate = parseEventDateValue(dateKey);

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedDateKey(dateKey)}
                      className={`flex w-full items-start gap-4 border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-gold-500/40 bg-gold-500/10"
                          : "border-white/8 bg-white/2"
                      }`}
                    >
                      <div className="min-w-14 border-r border-white/8 pr-4">
                        <p className="font-serif text-2xl text-white">
                          {listDate?.getUTCDate() ?? "--"}
                        </p>
                        <p className="mt-1 text-[0.62rem] tracking-[0.18em] text-stone-500 uppercase">
                          {listDate
                            ? listDate.toLocaleDateString("id-ID", {
                                month: "short",
                                timeZone: "Asia/Jakarta",
                              })
                            : "tgl"}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-lg text-white">
                          {entry.title}
                        </p>
                        <p className="text-gold-300 mt-1 text-[0.72rem] tracking-[0.18em] uppercase">
                          {formatEventDateLabel(
                            entry.eventDate,
                            entry.eventDateEnd,
                          )}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-stone-400">
                          {entry.summary ||
                            "Agenda bertanggal yang sudah diterbitkan."}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {activeMonthEntries.length === 0 && (
                  <div className="border border-white/8 bg-white/2 px-4 py-6 text-sm text-stone-500">
                    Belum ada agenda bertanggal pada bulan ini.
                  </div>
                )}
              </div>
            </div>

            <aside className="border border-white/8 bg-black/35 p-5 md:p-6">
              <p className="text-gold-400 text-xs tracking-[0.22em] uppercase">
                Detail Tanggal
              </p>
              {selectedDate && selectedEntries.length > 0 ? (
                <>
                  <h3 className="mt-3 font-serif text-2xl text-white">
                    {formatDate(selectedDate.toISOString())}
                  </h3>
                  <p className="mt-2 text-sm text-stone-500">
                    {selectedEntries.length} agenda dipublikasikan untuk tanggal
                    ini
                  </p>

                  <div className="mt-6 space-y-4">
                    {selectedEntries.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/events/${entry.slug}`}
                        className="group hover:border-gold-500/30 hover:bg-gold-500/6 block border border-white/8 bg-white/3 p-4 transition"
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`border px-2.5 py-1 text-[0.62rem] tracking-[0.18em] uppercase ${getEventTone(entry)}`}
                          >
                            {getEventLabel(entry)}
                          </span>
                          {entry.ownerUnit && (
                            <span className="text-[0.68rem] tracking-[0.16em] text-stone-500 uppercase">
                              {entry.ownerUnit}
                            </span>
                          )}
                        </div>
                        <h4 className="group-hover:text-gold-200 font-serif text-xl text-white transition">
                          {entry.title}
                        </h4>
                        <p className="mt-3 text-sm leading-relaxed text-stone-400">
                          {entry.summary ||
                            "Buka detail agenda untuk informasi lengkap."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-500">
                          {entry.eventDate && (
                            <span>
                              Jadwal:{" "}
                              {formatEventDateLabel(
                                entry.eventDate,
                                entry.eventDateEnd,
                              )}
                            </span>
                          )}
                          {entry.location && (
                            <span>Lokasi: {entry.location}</span>
                          )}
                          {entry.registrationLink && (
                            <span className="text-gold-300">
                              Pendaftaran tersedia
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-4 border border-dashed border-white/10 px-4 py-6 text-sm leading-relaxed text-stone-500">
                  Pilih tanggal pada kalender untuk melihat agenda yang terbit
                  pada hari tersebut.
                </div>
              )}

              {collection.announcements.length > 0 && (
                <div className="mt-8 border-t border-white/8 pt-6">
                  <p className="text-xs tracking-[0.22em] text-stone-500 uppercase">
                    Info tanpa tanggal acara
                  </p>
                  <div className="mt-4 space-y-3">
                    {collection.announcements.slice(0, 3).map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/events/${entry.slug}`}
                        className="block border border-white/8 px-4 py-3 text-sm text-stone-300 transition hover:border-white/20 hover:text-white"
                      >
                        {entry.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function EventCard({ entry, index }: { entry: EventEntryMeta; index: number }) {
  return (
    <Link
      href={`/events/${entry.slug}`}
      className="group hover:border-gold-500/25 relative flex w-full flex-col overflow-hidden border border-white/6 bg-white/2 transition-[border-color,background-color,color] duration-300 hover:bg-white/4 md:flex-row"
      data-animate="up"
      data-animate-duration="0.8"
      data-animate-delay={String(Math.min(index * 0.05, 0.35))}
      data-animate-start="top 92%"
      data-animate-scroll="true"
    >
      {entry.coverImageUrl ? (
        <div className="relative h-44 shrink-0 overflow-hidden border-b border-white/6 md:h-auto md:w-62 md:border-r md:border-b-0 lg:w-[18rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.coverImageUrl}
            alt={entry.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      ) : (
        <div className="relative flex h-44 shrink-0 items-center justify-center border-b border-white/6 bg-[radial-gradient(circle_at_top,rgba(212,166,77,0.08)_0%,transparent_70%)] md:h-auto md:w-62 md:border-r md:border-b-0 lg:w-[18rem]">
          <span className="text-gold-500/60 font-serif text-xl">
            {entry.icon || entry.ownerUnit || "Acara"}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="border-gold-500/30 bg-gold-500/10 text-gold-300 rounded-full border px-3 py-1 text-[0.62rem] font-medium tracking-[0.18em] uppercase">
            {getEventLabel(entry)}
          </span>
          {entry.ownerUnit && (
            <span className="text-[0.68rem] tracking-[0.16em] text-stone-500 uppercase">
              {entry.ownerUnit}
            </span>
          )}
        </div>

        <div className="mb-4">
          <h2 className="group-hover:text-gold-400 font-serif text-2xl text-white transition-colors md:text-[1.85rem]">
            {entry.title}
          </h2>
          {entry.summary && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-400">
              {entry.summary}
            </p>
          )}
        </div>

        <dl className="mb-5 grid gap-3 text-xs text-stone-500 sm:grid-cols-2 xl:grid-cols-3">
          {entry.eventDate && (
            <div>
              <dt className="mb-1 tracking-[0.18em] uppercase">Tanggal</dt>
              <dd className="text-sm text-stone-300">
                {formatEventDateLabel(entry.eventDate, entry.eventDateEnd)}
              </dd>
            </div>
          )}
          {entry.ownerUnit && (
            <div>
              <dt className="mb-1 tracking-[0.18em] uppercase">Penerbit</dt>
              <dd className="text-sm text-stone-300">{entry.ownerUnit}</dd>
            </div>
          )}
          {entry.location && (
            <div>
              <dt className="mb-1 tracking-[0.18em] uppercase">Lokasi</dt>
              <dd className="text-sm text-stone-300">{entry.location}</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/6 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-gold-400 group-hover:text-gold-300 text-sm transition-colors">
            Buka detail acara →
          </span>
          <div className="flex flex-wrap gap-3 text-xs text-stone-500">
            {entry.registrationLink && (
              <span className="text-gold-300">Pendaftaran tersedia</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EventSection({
  id,
  title,
  description,
  entries,
}: {
  id: string;
  title: string;
  description: string;
  entries: EventEntryMeta[];
}) {
  if (entries.length === 0) return null;

  return (
    <section id={id} className="mb-16 scroll-mt-28">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/6 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-gold-400 text-[0.65rem] tracking-[0.28em] uppercase">
            Rubrik Acara
          </p>
          <h2 className="mt-2 font-serif text-3xl text-white md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-500">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[0.65rem] tracking-[0.24em] uppercase">
          <span className="border border-white/8 px-3 py-2 text-stone-400">
            {entries.length} entri
          </span>
          <a
            href="#events-sections-nav"
            className="text-stone-600 transition hover:text-stone-300"
          >
            Lihat navigasi
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <EventCard key={entry.id} entry={entry} index={index} />
        ))}
      </div>
    </section>
  );
}

export default function EventsView({
  collection,
}: {
  collection: EventsCollection;
}) {
  const scopeRef = useViewEntrance("/events");
  const sectionLinks = [
    {
      id: "upcoming-events",
      title: "Pra-Acara",
      count: collection.upcoming.length,
    },
    {
      id: "live-events",
      title: "Sedang Berlangsung",
      count: collection.ongoing.length,
    },
    {
      id: "announcement-events",
      title: "Info & Pengumuman",
      count: collection.announcements.length,
    },
    {
      id: "past-events",
      title: "Pasca-Acara",
      count: collection.past.length,
    },
  ].filter((section) => section.count > 0);
  const hasEntries =
    collection.upcoming.length > 0 ||
    collection.ongoing.length > 0 ||
    collection.past.length > 0 ||
    collection.announcements.length > 0;

  return (
    <div
      ref={scopeRef}
      className="relative min-h-screen overflow-x-hidden px-6 pt-28 pb-24 md:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-18 border-b border-white/5 pb-10">
          <div data-animate="fade" className="mb-5 flex items-center gap-4">
            <span
              className="bg-gold-500/40 block h-px w-8 md:w-12"
              aria-hidden="true"
            />
            <p className="text-gold-500 text-sm font-medium">Publikasi Acara</p>
          </div>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h1
                data-animate="up"
                data-animate-delay="0.1"
                className="font-serif text-5xl tracking-tight text-white md:text-7xl"
              >
                Agenda &{" "}
                <span className="text-gold-500/80 font-light italic">
                  Catatan Kegiatan
                </span>
              </h1>
              <p
                data-animate="up"
                data-animate-delay="0.2"
                className="mt-6 max-w-3xl text-base leading-relaxed text-stone-400"
              >
                Ruang publikasi resmi HIMA MUSIK dan KKM untuk pengumuman,
                rangkaian pra-acara, dokumentasi pasca-acara, serta catatan
                kegiatan internal yang dikelola langsung oleh organisasi.
              </p>
            </div>
            <p
              data-animate="up"
              data-animate-delay="0.25"
              className="text-sm text-stone-500"
            >
              Diklasifikasikan otomatis berdasarkan tanggal acara dan tanggal
              publikasi
            </p>
          </div>
        </header>

        {!hasEntries && (
          <div
            data-animate="up"
            className="group hover:border-gold-500/30 relative overflow-hidden border border-white/5 bg-white/1 px-8 py-24 text-center transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.05)_0%,transparent_50%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <div className="relative z-10 mx-auto max-w-2xl">
              <p className="text-sm tracking-wide text-neutral-400">
                Database acara sudah terhubung, tetapi belum ada entri yang
                terbit untuk ditampilkan.
              </p>
              <p className="mt-3 text-sm text-neutral-500">
                Isi kolom `Publish` dan `Event Date` di Notion untuk mulai
                membentuk kategori acara secara otomatis.
              </p>
            </div>
          </div>
        )}

        <EventCalendar collection={collection} />

        {sectionLinks.length > 0 && (
          <nav
            id="events-sections-nav"
            aria-label="Navigasi rubrik acara"
            className="mb-10 overflow-hidden border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)]"
          >
            <div className="flex flex-col gap-5 px-5 py-5 md:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-gold-400 text-xs tracking-[0.24em] uppercase">
                  Navigasi Cepat
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
                  Lompat ke rubrik yang ingin dibaca tanpa perlu menelusuri
                  seluruh daftar acara satu per satu.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {sectionLinks.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group hover:border-gold-500/30 hover:bg-gold-500/8 inline-flex items-center gap-3 border border-white/8 px-4 py-3 text-sm text-stone-300 transition hover:text-white"
                  >
                    <span>{section.title}</span>
                    <span className="group-hover:border-gold-500/20 group-hover:text-gold-200 border border-white/8 px-2 py-1 text-[0.62rem] tracking-[0.2em] text-stone-500 uppercase transition">
                      {section.count}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </nav>
        )}

        <EventSection
          id="upcoming-events"
          title="Pra-Acara"
          description="Pengumuman, pengantar rangkaian, dan publikasi yang terhubung dengan agenda yang masih akan datang."
          entries={collection.upcoming}
        />

        <EventSection
          id="live-events"
          title="Sedang Berlangsung"
          description="Acara yang saat ini masih berada dalam rentang pelaksanaan."
          entries={collection.ongoing}
        />

        <EventSection
          id="announcement-events"
          title="Info & Pengumuman"
          description="Informasi resmi yang tidak terikat langsung pada tanggal acara tertentu."
          entries={collection.announcements}
        />

        <EventSection
          id="past-events"
          title="Pasca-Acara"
          description="Publikasi dokumentasi, rekap, dan jejak kegiatan setelah acara selesai berlangsung."
          entries={collection.past}
        />
      </div>
    </div>
  );
}
