// ============================================================================
// Timezone-safe helpers for America/Winnipeg scheduling
// ============================================================================
// All persisted times are UTC ms. These helpers convert between UTC and
// Winnipeg wall-clock ("YYYY-MM-DD" / "HH:MM") using Intl.DateTimeFormat with
// the IANA timezone, so daylight-saving transitions are handled correctly on
// both the server (Convex) and the client.
// ============================================================================

export const WINNIPEG_TZ = "America/Winnipeg";

// Intl formatters are stateless; construct once.
const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: WINNIPEG_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: WINNIPEG_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: WINNIPEG_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "YYYY-MM-DD" of `utcMs` in Winnipeg. */
export function winnipegDateKey(utcMs: number): string {
  return dateFmt.format(new Date(utcMs));
}

/** "HH:MM" (24h) of `utcMs` in Winnipeg. */
export function winnipegTimeKey(utcMs: number): string {
  return timeFmt.format(new Date(utcMs)).replace(/^24:/, "00:");
}

export interface WpgParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
}

/** Split a UTC instant into Winnipeg wall-clock parts. */
export function winnipegParts(utcMs: number): WpgParts {
  const parts = partsFmt.formatToParts(new Date(utcMs));
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
  };
}

/**
 * Winnipeg UTC offset (ms) at a given instant: instant − (its wall clock
 * interpreted as UTC). Positive = west of UTC (e.g. +5h for CDT, +6h CST).
 */
function wpgOffsetMs(instant: number): number {
  const p = winnipegParts(instant);
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return instant - wallAsUtc;
}

/**
 * Convert Winnipeg wall-clock parts to a UTC instant.
 *
 * Uses offset probing: compute the offset shortly before and shortly after
 * the target, build a candidate instant for each, and resolve:
 *  - both candidates display the target time (fall-back ambiguity) → return
 *    the EARLIER instant (first occurrence of the wall clock);
 *  - exactly one matches → return it;
 *  - neither matches (spring-forward gap; the wall clock doesn't exist) →
 *    return the LATER candidate (the instant just after the gap).
 */
export function utcFromWinnipeg(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
): number {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const probe = 36 * 3600_000; // far enough to sit outside a DST transition
  const pastOff = wpgOffsetMs(naive - probe);
  const futureOff = wpgOffsetMs(naive + probe);

  const cPast = naive + pastOff;
  const cFuture = naive + futureOff;

  const showsTarget = (instant: number) => {
    const p = winnipegParts(instant);
    return (
      p.year === year && p.month === month && p.day === day &&
      p.hour === hour && p.minute === minute
    );
  };

  const pastOk = showsTarget(cPast);
  const futureOk = showsTarget(cFuture);

  if (pastOk && futureOk) return Math.min(cPast, cFuture); // ambiguous → earlier
  if (pastOk) return cPast;
  if (futureOk) return cFuture;
  return Math.max(cPast, cFuture); // gap → instant just after the gap
}

/** Convert "YYYY-MM-DD" + "HH:MM" (Winnipeg wall clock) to UTC ms. */
export function utcFromWpgDateAndTime(dateKey: string, timeKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = timeKey.split(":").map(Number);
  return utcFromWinnipeg(y, m, d, hh, mm);
}

/** Day-of-week (0=Sun..6=Sat) of a Winnipeg date. */
export function winnipegDayOfWeek(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utcNoon = Date.UTC(y, m - 1, d, 18); // noon UTC is always same day in WPG (UTC-5/-6)
  return new Date(utcNoon).getUTCDay();
}

/** Add `days` to a Winnipeg date key, returning a new "YYYY-MM-DD". */
export function addDaysToWpgDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days, 12));
  return dateFmt.format(next);
}

/** UTC ms of Winnipeg midnight (day start) for a given date key. */
export function wpgDayStartUtc(dateKey: string): number {
  return utcFromWpgDateAndTime(dateKey, "00:00");
}

/**
 * "Now" in Winnipeg, as a date key — useful for lead-time comparisons.
 * Pass `nowMs` explicitly so scheduling logic is testable.
 */
export function todayInWinnipeg(nowMs: number): string {
  return winnipegDateKey(nowMs);
}
