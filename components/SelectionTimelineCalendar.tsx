"use client";

import gsap from "gsap";
import React, { useEffect, useRef, useState } from "react";

const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface Event {
  title: string;
  dateStr: string;
  description: string;
  type:
    | "registration"
    | "interview-announcement"
    | "interview"
    | "final-announcement";
  start: Date;
  end: Date;
}

const SelectionTimelineCalendar: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDate] = useState(new Date("2026-02-27")); // Fixed today for demo/current context

  // Parse timeline data into actual Date objects
  // Note: This is a bit manual since the data in lib/pendaftaran-data.ts is strings
  const events: Event[] = [
    {
      title: "Pendaftaran",
      dateStr: "27 Feb – 03 Mar",
      description: "Deadline: 15:00 WIB",
      type: "registration",
      start: new Date("2026-02-27"),
      end: new Date("2026-03-03T15:00:00"),
    },
    {
      title: "Pengumuman Wawancara",
      dateStr: "03 Mar",
      description: "18:00 WIB",
      type: "interview-announcement",
      start: new Date("2026-03-03T18:00:00"),
      end: new Date("2026-03-03T18:00:00"),
    },
    {
      title: "Wawancara",
      dateStr: "04 Mar",
      description: "Waktu menyusul",
      type: "interview",
      start: new Date("2026-03-04"),
      end: new Date("2026-03-04"),
    },
    {
      title: "Pengumuman Akhir",
      dateStr: "10 Mar",
      description: "Selamat bergabung!",
      type: "final-announcement",
      start: new Date("2026-03-10"),
      end: new Date("2026-03-10"),
    },
  ];

  // Helper to generate days for the relevant weeks
  // We'll show Feb 23 to Mar 15
  const calendarDays: Date[] = [];
  const startDay = new Date("2026-02-23"); // Monday
  for (let i = 0; i < 21; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    calendarDays.push(d);
  }

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".calendar-day"),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.03,
          ease: "power3.out",
        },
      );
    }
  }, []);

  const isToday = (date: Date) => {
    return date.toDateString() === currentDate.toDateString();
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const start = new Date(event.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(event.end);
      end.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Desktop Calendar Grid */}
      <div className="hidden md:block">
        <div className="scrollbar-hide overflow-x-auto pb-4">
          <div className="min-w-[600px] lg:min-w-full">
            <div className="mb-4 grid grid-cols-7 gap-2 md:gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-semibold tracking-widest text-neutral-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px border border-white/5 bg-white/5 shadow-2xl">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDay(date);
                const active = isToday(date);
                const isCurrentMonth =
                  date.getMonth() === 1 || date.getMonth() === 2; // Feb or Mar

                return (
                  <div
                    key={index}
                    className={`calendar-day relative min-h-[120px] bg-[#0a0a0a] py-2 transition-colors hover:bg-white/[0.02] md:py-3 ${
                      !isCurrentMonth ? "opacity-30" : ""
                    } ${active ? "z-20 shadow-[0_0_20px_rgba(212,166,77,0.05)]" : ""}`}
                  >
                    <div className="mb-2 flex items-center justify-between px-2 md:px-3">
                      <div className="flex items-center gap-2">
                        {active && (
                          <span className="bg-gold-500 h-4 w-[2px] rounded-full" />
                        )}
                        <span
                          className={`font-serif text-sm transition-colors ${
                            active
                              ? "text-gold-500 font-bold"
                              : "text-neutral-500"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>
                      {active && (
                        <span className="text-gold-500/80 text-[8px] font-bold tracking-[0.1em] uppercase">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.map((event, i) => {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        const start = new Date(event.start);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(event.end);
                        end.setHours(0, 0, 0, 0);

                        const isStart = d.getTime() === start.getTime();
                        const isEnd = d.getTime() === end.getTime();
                        const isContinuous = start.getTime() !== end.getTime();

                        // For multi-day: show title only on start day or if it's Monday
                        const showTitle = isStart || date.getDay() === 1;
                        // Show description (deadline) only on the end day
                        const showDescription =
                          isEnd &&
                          event.description.toLowerCase().includes("deadline");

                        return (
                          <div
                            key={i}
                            className={`group relative flex h-[40px] flex-col justify-center overflow-hidden px-2 py-1 text-[10px] leading-tight transition-all md:h-[48px] md:text-xs ${
                              event.type === "registration"
                                ? "text-gold-200 bg-[#1a150e]" // Solid dark gold-ish background
                                : "bg-[#141414] text-neutral-300" // Solid dark neutral background
                            } ${
                              !isContinuous
                                ? "mx-2 rounded-sm border md:mx-3"
                                : `${isStart ? "mr-[-1px] ml-2 rounded-l-sm border-l md:ml-3" : ""} ${
                                    isEnd
                                      ? "mr-2 ml-[-1px] rounded-r-sm border-r md:mr-3"
                                      : ""
                                  } ${!isStart && !isEnd ? "mx-[-1px]" : ""} border-y`
                            } ${
                              event.type === "registration"
                                ? "border-gold-500/30"
                                : "border-white/10"
                            }`}
                            style={{
                              zIndex: isContinuous ? 10 : 1,
                            }}
                          >
                            <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                              <div
                                className={`truncate font-medium ${showDescription ? "max-w-[50%]" : "w-full"}`}
                              >
                                {showTitle ? event.title : "\u00A0"}
                              </div>
                              {showDescription && (
                                <div className="bg-gold-500 flex max-w-[50%] shrink-0 items-center gap-1 rounded-[2px] px-1.5 py-0.5 shadow-[0_2px_10px_rgba(212,166,77,0.3)]">
                                  <span className="shrink-0 text-[7px] leading-none font-bold text-black/40 uppercase">
                                    DL
                                  </span>
                                  <div className="truncate text-[8px] leading-none font-bold text-black">
                                    {event.description.replace(
                                      /deadline:?\s*/i,
                                      "",
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bg-gold-500/5 pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[10px] tracking-wide text-neutral-500 uppercase">
          <div className="flex items-center gap-2">
            <span className="border-gold-500/30 h-2 w-2 border bg-[#1a150e]" />
            <span>Masa Pendaftaran</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 border border-white/10 bg-[#141414]" />
            <span>Event & Pengumuman</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-gold-500 h-3 w-[2px] rounded-full" />
            <span>Hari Ini</span>
          </div>
        </div>
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="block px-2 md:hidden">
        <div className="relative">
          <div className="relative flex flex-col">
            {events.map((event, index) => {
              const isContinuous =
                event.start.getTime() !== event.end.getTime();
              const badgeShowsDeadline = event.description
                .toLowerCase()
                .includes("deadline");

              const startStr = event.start.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              });
              const endStr = event.end.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              });

              const isEventActive =
                currentDate >= event.start && currentDate <= event.end;
              const isEventPast = currentDate > event.end;
              const hasReachedEvent = currentDate >= event.start;

              // Progress logic for segments
              const isFirst = index === 0;
              const isLast = index === events.length - 1;

              return (
                <div key={index} className="group flex items-stretch gap-6">
                  {/* Timeline Node Container with built-in track segments */}
                  <div className="relative flex w-[15px] flex-shrink-0 flex-col items-center">
                    {/* Top Segment (connects to previous node) */}
                    <div
                      className={`z-0 -mb-2 w-[2px] flex-1 transition-colors duration-500 ${
                        isFirst
                          ? "bg-transparent"
                          : hasReachedEvent
                            ? "bg-gold-500"
                            : "bg-white/10"
                      }`}
                    />

                    {/* The Node itself */}
                    <div className="relative flex-shrink-0 py-2">
                      <div
                        className={`relative z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#0a0a0a] transition-all duration-500 ${
                          hasReachedEvent
                            ? event.type === "registration"
                              ? "bg-gold-500"
                              : "bg-[#d4a64d]"
                            : "bg-neutral-800"
                        } ${isEventActive ? "scale-125 shadow-[0_0_15px_rgba(212,166,77,0.6)]" : ""}`}
                      />
                    </div>

                    {/* Bottom Segment (connects to next node) */}
                    <div
                      className={`z-0 -mt-2 w-[2px] flex-1 transition-colors duration-500 ${
                        isLast
                          ? "bg-transparent"
                          : isEventPast
                            ? "bg-gold-500"
                            : "bg-white/10"
                      }`}
                    />
                  </div>

                  {/* Card content */}
                  <div className="flex-1 py-4">
                    <div
                      className={`rounded-[4px] border p-4 transition-all duration-500 ${
                        isEventActive
                          ? "border-gold-500/40 bg-[#1a150e] shadow-[0_4px_20px_rgba(212,166,77,0.05)]"
                          : "border-white/5 bg-[#0f0f0f]"
                      }`}
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <div>
                          <h4
                            className={`font-serif text-base transition-colors ${
                              isEventActive
                                ? "text-gold-300"
                                : "text-neutral-300"
                            }`}
                          >
                            {event.title}
                          </h4>
                          <div className="text-[10px] font-medium tracking-wide text-neutral-500">
                            {isContinuous
                              ? `${startStr} – ${endStr}`
                              : startStr}
                          </div>
                        </div>

                        {badgeShowsDeadline && (
                          <div
                            className={`flex shrink-0 items-center gap-1 rounded-[2px] px-1.5 py-0.5 transition-opacity ${isEventActive ? "opacity-100" : "opacity-30"} bg-gold-500`}
                          >
                            <span className="shrink-0 text-[7px] font-bold text-black/50 uppercase">
                              DL
                            </span>
                            <div className="text-[8px] font-bold text-black">
                              {event.description.replace(/deadline:?\s*/i, "")}
                            </div>
                          </div>
                        )}
                      </div>

                      {!badgeShowsDeadline && event.description && (
                        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-neutral-500">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionTimelineCalendar;
