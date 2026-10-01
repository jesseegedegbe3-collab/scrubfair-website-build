// ============================================================================
// ScrubFair availability config — OWNER-EDITABLE, ALL PLACEHOLDERS
// ============================================================================
// ⚠️ EVERY value here is a placeholder the owner must replace with real
//    operating parameters. Nothing below is a business decision — edit freely.
//
// Timezone: America/Winnipeg (handles CDT/CST daylight saving). All times in
// the database are stored as UTC ms timestamps; the UI converts to Winnipeg
// local time for display. DST is handled by timezone-aware arithmetic in
// src/lib/scheduling.ts — never compute Winnipeg times by fixed offset.
// ============================================================================

export const AVAILABILITY = {
  /** 0 = Sunday … 6 = Saturday. e.g. [1,2,3,4,5,6] = Mon–Sat. [OWNER] */
  workingDays: [1, 2, 3, 4, 5, 6] as number[],

  /** Working day start/end in Winnipeg local wall-clock, 24h "HH:MM". [OWNER] */
  dayStart: "08:00",
  dayEnd: "17:00",

  /** Minutes between slot start times (also the schedule granularity). */
  startTimeInterval: 60,

  /** Number of cleaning teams = how many jobs may overlap at once. [OWNER] */
  teams: 1,

  /** Travel/buffer minutes appended after every job. [OWNER] */
  bufferMinutes: 30,

  /** Bookings must start at least this many days in the future. */
  minLeadDays: 2,
  /** Bookings may start at most this many days in the future. */
  maxAdvanceDays: 60,

  /**
   * Dates the business is closed (holidays, days off). Winnipeg local dates
   * "YYYY-MM-DD". The owner can also block days from the admin page.
   */
  blackoutDates: [] as string[],

  /** If the owner hasn't acted on a request within this many hours, it is released. [OWNER] */
  holdHours: 48,

  /** Temporary customer hold while they finish the form (minutes). */
  tempHoldMinutes: 10,

  // ------------------------------------------------------------------------
  // Job duration model — PLACEHOLDERS the owner MUST replace with real times.
  // ------------------------------------------------------------------------
  /**
   * Minutes for ONE team by square footage (upper bound inclusive). [OWNER]
   * e.g. a 900 sq ft home falls into "up to 1400" = 180 minutes.
   */
  durationBySqft: [
    { upTo: 700, minutes: 120 },
    { upTo: 1400, minutes: 180 },
    { upTo: 2000, minutes: 240 },
    { upTo: 3000, minutes: 300 },
    { upTo: 4000, minutes: 360 },
  ] as { upTo: number; minutes: number }[],

  /** First cleans take longer than repeat cleans. [OWNER] */
  firstVisitMultiplier: 1.5,

  /** Extra minutes per add-on selected. [OWNER] */
  minutesPerAddon: 30,
} as const;

export type AvailabilityConfig = typeof AVAILABILITY;

/** Business timezone — all display + wall-clock scheduling uses this. */
export const TIMEZONE = "America/Winnipeg";

/** Minutes for one team to complete the cleaning itself (no buffer). */
export function baseDurationMinutes(sqft: number): number {
  for (const tier of AVAILABILITY.durationBySqft) {
    if (sqft <= tier.upTo) return tier.minutes;
  }
  const last = AVAILABILITY.durationBySqft[AVAILABILITY.durationBySqft.length - 1];
  return last.minutes;
}

/**
 * Total minutes a job occupies one team: cleaning time × first-visit
 * multiplier + add-on time. (Buffer is added separately at slot evaluation.)
 */
export function jobDurationMinutes(opts: {
  sqft: number;
  isFirstVisit: boolean;
  addonCount: number;
}): number {
  const base = baseDurationMinutes(opts.sqft);
  const scaled = opts.isFirstVisit
    ? base * AVAILABILITY.firstVisitMultiplier
    : base;
  return Math.round(scaled + opts.addonCount * AVAILABILITY.minutesPerAddon);
}
