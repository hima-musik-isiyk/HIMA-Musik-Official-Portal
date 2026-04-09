"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  IconCalendar,
  IconChevronDown,
  IconExternalLink,
  IconMapPin,
} from "@/components/Icons";
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
const ITEMS_PER_PAGE = 5;
const ACTION_RADIUS = { borderRadius: "var(--radius-action)" } as const;

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

function getLifecycleLabel(entry: EventEntryMeta): string {
  switch (entry.lifecycle) {
    case "upcoming":
      return "Upcoming";
    case "ongoing":
      return "Ongoing";
    case "past":
      return "Archive";
    case "announcement":
      return "Bulletin";
    case "timeless":
      return "Note";
    default:
      return "Published";
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

type SortOption = "newest" | "oldest" | "nearest";

function getEntryTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getEventStartTimestamp(entry: EventEntryMeta): number {
  const parsed = parseEventDateValue(entry.eventDate);
  return parsed ? parsed.getTime() : Number.POSITIVE_INFINITY;
}

function sortEntries(
  entries: EventEntryMeta[],
  sortOption: SortOption,
): EventEntryMeta[] {
  return [...entries].sort((left, right) => {
    const leftEventTime = getEventStartTimestamp(left);
    const rightEventTime = getEventStartTimestamp(right);
    const leftEditedTime = getEntryTimestamp(left.lastEdited);
    const rightEditedTime = getEntryTimestamp(right.lastEdited);

    if (sortOption === "nearest") {
      const leftHasDate = Number.isFinite(leftEventTime);
      const rightHasDate = Number.isFinite(rightEventTime);

      if (leftHasDate && rightHasDate && leftEventTime !== rightEventTime) {
        return leftEventTime - rightEventTime;
      }
      if (leftHasDate !== rightHasDate) {
        return leftHasDate ? -1 : 1;
      }
      return rightEditedTime - leftEditedTime;
    }

    if (sortOption === "oldest") {
      if (leftEditedTime !== rightEditedTime) {
        return leftEditedTime - rightEditedTime;
      }
      return leftEventTime - rightEventTime;
    }

    if (leftEditedTime !== rightEditedTime) {
      return rightEditedTime - leftEditedTime;
    }
    return rightEventTime - leftEventTime;
  });
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
    <section
      data-animate="up"
      data-animate-duration="0.85"
      className="mb-20 hidden md:block"
    >
      <div className="relative overflow-hidden border border-white/8 bg-[linear-gradient(180deg,rgba(255,101,1,0.08)_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.01)_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,127,69,0.18)_0%,transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06)_0%,transparent_30%)]" />
        <div
          data-animate-stagger="0.1"
          className="relative z-10 p-6 md:p-8 lg:p-10"
        >
          <div
            data-animate="up"
            className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setActiveMonthIndex((index) => Math.max(0, index - 1))
                }
                disabled={activeMonthIndex === 0}
                className="hover:border-gold-500/40 cursor-pointer border border-white/10 px-2.5 py-1.5 text-sm text-stone-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                style={ACTION_RADIUS}
                aria-label="Bulan sebelumnya"
              >
                ←
              </button>
              <p className="min-w-40 text-center font-serif text-2xl text-white md:text-3xl">
                {activeMonth ? formatMonthLabel(activeMonth) : "—"}
              </p>
              <button
                type="button"
                onClick={() =>
                  setActiveMonthIndex((index) =>
                    Math.min(monthOptions.length - 1, index + 1),
                  )
                }
                disabled={activeMonthIndex === monthOptions.length - 1}
                className="hover:border-gold-500/40 cursor-pointer border border-white/10 px-2.5 py-1.5 text-sm text-stone-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                style={ACTION_RADIUS}
                aria-label="Bulan berikutnya"
              >
                →
              </button>
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
                    style={ACTION_RADIUS}
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
                              +{dayEntries.length - 3} lainnya
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
                      style={ACTION_RADIUS}
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
                        {entry.summary && (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-400">
                            {entry.summary}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
                {activeMonthEntries.length === 0 && (
                  <div
                    className="border border-white/8 bg-white/2 px-4 py-6 text-sm text-stone-500"
                    style={ACTION_RADIUS}
                  >
                    Belum ada agenda bertanggal pada bulan ini.
                  </div>
                )}
              </div>
            </div>

            <aside className="border border-white/8 bg-black/35 p-5 md:p-6">
              {selectedDate && selectedEntries.length > 0 ? (
                <>
                  <h3 className="font-serif text-2xl text-white">
                    {formatDate(selectedDate.toISOString())}
                  </h3>

                  <div className="mt-5 space-y-4">
                    {selectedEntries.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/events/${entry.slug}`}
                        className="group hover:border-gold-500/30 hover:bg-gold-500/6 block border border-white/8 bg-white/3 p-4 transition"
                        style={ACTION_RADIUS}
                      >
                        <span
                          className={`inline-block border px-2.5 py-1 text-[0.62rem] tracking-[0.18em] uppercase ${getEventTone(entry)}`}
                          style={ACTION_RADIUS}
                        >
                          {getLifecycleLabel(entry)}
                        </span>
                        <h4 className="group-hover:text-gold-200 mt-3 font-serif text-xl text-white transition">
                          {entry.title}
                        </h4>
                        {entry.summary && (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-400">
                            {entry.summary}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                          {entry.eventDate && (
                            <span>
                              {formatEventDateLabel(
                                entry.eventDate,
                                entry.eventDateEnd,
                              )}
                            </span>
                          )}
                          {entry.location && (
                            <>
                              <span className="text-white/15">·</span>
                              <span className="inline-flex items-center gap-1">
                                <IconMapPin width={11} height={11} />
                                {entry.location}
                              </span>
                            </>
                          )}
                          {entry.registrationLink && (
                            <>
                              <span className="text-white/15">·</span>
                              <span className="text-gold-400">
                                <IconExternalLink width={11} height={11} />
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-stone-600">
                  <IconCalendar width={24} height={24} />
                  <p className="mt-3 text-xs tracking-wide">Pilih tanggal</p>
                </div>
              )}

              {collection.announcements.length > 0 && (
                <div className="mt-6 border-t border-white/8 pt-5">
                  <div className="space-y-2">
                    {collection.announcements.slice(0, 3).map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/events/${entry.slug}`}
                        className="block border border-white/8 px-4 py-3 text-sm text-stone-300 transition hover:border-white/20 hover:text-white"
                        style={ACTION_RADIUS}
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
      style={ACTION_RADIUS}
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
        <div className="relative h-44 shrink-0 overflow-hidden border-b border-white/6 md:h-auto md:w-62 md:border-r md:border-b-0 lg:w-[18rem]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,101,1,0.12)_0%,transparent_60%)]" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="border-gold-500/30 bg-gold-500/10 text-gold-300 rounded-full border px-3 py-1 text-[0.62rem] font-medium tracking-[0.18em] uppercase">
            {getLifecycleLabel(entry)}
          </span>
          {entry.ownerUnit && (
            <span className="text-[0.68rem] tracking-[0.16em] text-stone-500 uppercase">
              {entry.ownerUnit}
            </span>
          )}
        </div>

        <div className="mb-auto">
          <h2 className="group-hover:text-gold-400 font-serif text-2xl text-white transition-colors md:text-[1.85rem]">
            {entry.title}
          </h2>
          <p className="mt-3 line-clamp-2 min-h-10.5 max-w-3xl text-sm leading-relaxed text-stone-400">
            {entry.summary || "\u00A0"}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          {entry.eventDate && (
            <span className="text-stone-300">
              {formatEventDateLabel(entry.eventDate, entry.eventDateEnd)}
            </span>
          )}
          {entry.location && (
            <>
              <span className="text-white/15">·</span>
              <span className="inline-flex items-center gap-1">
                <IconMapPin width={11} height={11} />
                {entry.location}
              </span>
            </>
          )}
          {entry.registrationLink && (
            <>
              <span className="text-white/15">·</span>
              <span className="text-gold-400">
                <IconExternalLink width={11} height={11} />
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function EventsView({
  collection,
}: {
  collection: EventsCollection;
}) {
  const scopeRef = useViewEntrance("/events");

  // Build a flat list of all entries with their entryKind for filtering
  const allEntries = useMemo(() => {
    return [
      ...collection.upcoming,
      ...collection.ongoing,
      ...collection.past,
      ...collection.announcements,
    ];
  }, [collection]);

  // Extract unique entryKind values for dynamic filter buttons
  const entryKindFilters = useMemo(() => {
    const kinds = new Map<string, number>();
    for (const entry of allEntries) {
      const kind = entry.entryKind || "Other";
      kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    }
    return [...kinds.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([kind, count]) => ({ kind, count }));
  }, [allEntries]);

  const [activeKindFilter, setActiveKindFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const hasEntries = allEntries.length > 0;

  const filteredEntries = useMemo(() => {
    const source =
      activeKindFilter === "all"
        ? allEntries
        : allEntries.filter(
            (entry) => (entry.entryKind || "Other") === activeKindFilter,
          );

    return sortEntries(source, sortOption);
  }, [activeKindFilter, allEntries, sortOption]);

  // Reset page when filters change
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEntries.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedEntries = filteredEntries.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleFilterChange = (kind: string) => {
    setActiveKindFilter(kind);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
    setCurrentPage(1);
  };

  return (
    <div
      ref={scopeRef}
      className="relative min-h-screen overflow-x-hidden px-6 pt-40 pb-32 md:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="relative mb-16 flex flex-col items-start justify-between border-b border-white/5 pb-10 md:flex-row md:items-end">
          <div className="bg-gold-500/50 absolute bottom-0 left-0 h-px w-32" />
          <div>
            <div data-animate="up" className="mb-6 flex items-center gap-4">
              <span
                className="bg-gold-500/40 block h-px w-8 md:w-12"
                aria-hidden="true"
              />
              <p className="text-gold-500 text-sm font-medium">Agenda</p>
            </div>
            <h1
              data-animate="up"
              data-animate-delay="0.1"
              className="font-serif text-5xl tracking-tight text-white md:text-7xl"
            >
              Agenda &{" "}
              <span className="text-gold-500/80 font-light italic">
                Kegiatan
              </span>
            </h1>
          </div>
          <p
            data-animate="up"
            data-animate-delay="0.2"
            className="mt-8 text-sm text-neutral-400 md:mt-0"
          >
            {allEntries.length > 0
              ? `${allEntries.length} Publikasi`
              : "Arsip Kegiatan"}
          </p>
        </header>

        {!hasEntries && (
          <div
            data-animate="up"
            className="flex flex-col items-center justify-center border border-dashed border-white/8 px-8 py-20 text-center"
          >
            <p className="text-sm text-stone-500">
              Belum ada agenda yang diterbitkan.
            </p>
          </div>
        )}

        <EventCalendar collection={collection} />

        {hasEntries && (
          <section
            id="events-archive-controls"
            aria-label="Kontrol arsip acara"
            className="mb-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange("all")}
                  style={ACTION_RADIUS}
                  className={`inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm transition ${
                    activeKindFilter === "all"
                      ? "border-gold-500/30 bg-gold-500/8 text-white"
                      : "hover:border-gold-500/30 hover:bg-gold-500/8 border-white/8 text-stone-400 hover:text-white"
                  }`}
                >
                  <span>All</span>
                  <span className="text-[0.62rem] text-stone-500">
                    {allEntries.length}
                  </span>
                </button>
                {entryKindFilters.map(({ kind, count }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => handleFilterChange(kind)}
                    style={ACTION_RADIUS}
                    className={`inline-flex items-center gap-2 border px-3.5 py-2.5 text-sm transition ${
                      activeKindFilter === kind
                        ? "border-gold-500/30 bg-gold-500/8 text-white"
                        : "hover:border-gold-500/30 hover:bg-gold-500/8 border-white/8 text-stone-400 hover:text-white"
                    }`}
                  >
                    <span>{kind}</span>
                    <span className="text-[0.62rem] text-stone-500">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="group relative">
                <select
                  value={sortOption}
                  onChange={(event) => handleSortChange(event.target.value)}
                  className="cursor-pointer appearance-none border border-white/10 bg-[#0d0d0d] px-3 py-2 pr-8 text-xs tracking-[0.15em] text-stone-400 uppercase transition outline-none hover:border-white/20 hover:text-stone-200"
                  style={ACTION_RADIUS}
                >
                  <option className="bg-[#111] text-neutral-300" value="newest">
                    Terbaru
                  </option>
                  <option
                    className="bg-[#111] text-neutral-300"
                    value="nearest"
                  >
                    Terdekat
                  </option>
                  <option className="bg-[#111] text-neutral-300" value="oldest">
                    Terlama
                  </option>
                </select>
                <div className="text-gold-500/60 group-focus-within:text-gold-300 pointer-events-none absolute top-0 right-0 bottom-0 flex items-center pr-2.5 transition-colors duration-300">
                  <IconChevronDown width={12} height={12} />
                </div>
              </div>
            </div>
          </section>
        )}

        {pagedEntries.length > 0 ? (
          <section className="space-y-4">
            {pagedEntries.map((entry, index) => (
              <EventCard key={entry.id} entry={entry} index={index} />
            ))}
          </section>
        ) : (
          hasEntries && (
            <div
              className="flex items-center justify-center border border-dashed border-white/8 px-5 py-12 text-sm text-stone-600"
              style={ACTION_RADIUS}
            >
              Tidak ada hasil.
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="border border-white/10 px-4 py-2 text-sm text-stone-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              style={ACTION_RADIUS}
            >
              ←
            </button>
            <span className="px-3 text-xs tracking-wide text-stone-500">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="border border-white/10 px-4 py-2 text-sm text-stone-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              style={ACTION_RADIUS}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
