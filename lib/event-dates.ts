const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export interface EventDateRange {
  start: string;
  end: string;
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function getDateOnly(value: string): string {
  return value.trim().slice(0, 10);
}

export function parseEventDateValue(value: string): Date | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = isDateOnly(normalized)
    ? new Date(`${normalized}T12:00:00+07:00`)
    : new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateOnlyLabel(value: string): string {
  const parsed = parseEventDateValue(value);
  if (!parsed) return "";

  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: JAKARTA_TIME_ZONE,
  });
}

function formatTimeLabel(value: string): string {
  const parsed = parseEventDateValue(value);
  if (!parsed || isDateOnly(value)) return "";

  return parsed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: JAKARTA_TIME_ZONE,
  });
}

export function formatEventDateLabel(start: string, end = ""): string {
  if (!start) return "";

  const startDate = formatDateOnlyLabel(start);
  const endDate = end ? formatDateOnlyLabel(end) : "";
  const startTime = formatTimeLabel(start);
  const endTime = end ? formatTimeLabel(end) : "";

  if (!end) {
    return startTime ? `${startDate}, ${startTime} WIB` : startDate;
  }

  const isSameDay = getDateOnly(start) === getDateOnly(end);

  if (isSameDay) {
    if (startTime && endTime) {
      return `${startDate}, ${startTime} - ${endTime} WIB`;
    }
    if (startTime) {
      return `${startDate}, ${startTime} WIB`;
    }
    return startDate;
  }

  const startLabel = startTime ? `${startDate}, ${startTime} WIB` : startDate;
  const endLabel = endTime ? `${endDate}, ${endTime} WIB` : endDate;
  return `${startLabel} - ${endLabel}`;
}

export function getEventDateSortValue(
  start: string,
  end = "",
  preferEnd = false,
): number {
  const primary = preferEnd && end ? end : start || end;
  const parsed = primary ? parseEventDateValue(primary) : null;
  return parsed?.getTime() ?? Number.POSITIVE_INFINITY;
}

export function getEventDateKeysInRange(start: string, end = ""): string[] {
  const startKey = getDateOnly(start);
  const endKey = getDateOnly(end || start);

  if (!startKey) return [];

  const keys = [startKey];
  if (!endKey || endKey <= startKey) return keys;

  const startDate = parseEventDateValue(startKey);
  const endDate = parseEventDateValue(endKey);
  if (!startDate || !endDate) return keys;

  const cursor = new Date(startDate.getTime());
  while (cursor.getTime() < endDate.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    keys.push(getDateOnly(cursor.toISOString()));
  }

  return keys;
}

export function getEventMonthKeysInRange(start: string, end = ""): string[] {
  const dayKeys = getEventDateKeysInRange(start, end);
  return [...new Set(dayKeys.map((key) => key.slice(0, 7)))];
}

export function classifyEventLifecycle(
  entryKind: string,
  dateRange: EventDateRange,
  today: string,
): "upcoming" | "ongoing" | "past" | "timeless" | "announcement" {
  if (!dateRange.start) {
    return entryKind.toLowerCase() === "announcement"
      ? "announcement"
      : "timeless";
  }

  const startKey = getDateOnly(dateRange.start);
  const endKey = getDateOnly(dateRange.end || dateRange.start);

  if (today < startKey) return "upcoming";
  if (today > endKey) return "past";
  return "ongoing";
}

export function hasEventTime(value: string): boolean {
  return Boolean(value) && !isDateOnly(value);
}
