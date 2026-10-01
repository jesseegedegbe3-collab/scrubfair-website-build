// ============================================================================
// Scheduling engine — slot generation + capacity rules (pure, testable)
// ============================================================================
// A slot is available when, for the WHOLE span [start, start + duration +
// buffer), fewer than `teams` other jobs overlap it, the start falls inside
// working hours, the date is not blacked out, and the date is between
// minLeadDays and maxAdvanceDays from "now".
//
// Pure functions only — no Convex imports — so the same rules run on the
// client (reactive display) and on the server (authoritative re-check inside
// the booking mutation). Unit-tested in tests/scheduling.test.ts.
// ============================================================================

import { AVAILABILITY, jobDurationMinutes, TIMEZONE } from "../config/availability";
import {
  addDaysToWpgDateKey,
  todayInWinnipeg,
  utcFromWpgDateAndTime,
  winnipegDateKey,
  winnipegDayOfWeek,
  winnipegTimeKey,
} from "./tz";

export interface BusySpan {
  /** UTC ms job start (already includes duration+buffer occupancy). */
  startUtc: number;
  /** UTC ms when the job's span ends (start + duration + buffer). */
  endUtc: number;
  /** Which team slot the job occupies; undefined/absent = any team. */
  teamId?: number;
}

export interface Slot {
  startUtc: number;
  endUtc: number;
  /** Display strings precomputed in Winnipeg time. */
  dateKey: string; // "YYYY-MM-DD"
  timeKey: string; // "HH:MM"
}

export interface SlotGenerationInput {
  nowMs: number;
  /** Cleaning minutes for THIS job (from jobDurationMinutes). */
  durationMinutes: number;
  busy: BusySpan[];
  /** Owner overrides (admin can edit these live via calendarBlocks config or defaults). */
  config?: {
    workingDays?: number[];
    dayStart?: string;
    dayEnd?: string;
    startTimeInterval?: number;
    teams?: number;
    bufferMinutes?: number;
    minLeadDays?: number;
    maxAdvanceDays?: number;
    blackoutDates?: string[];
  };
  /** How many candidate days to scan forward when looking for slots. */
  scanDays?: number;
}

// ---------------------------------------------------------------------------
// Core availability rule (shared by slot generation and server re-check)
// ---------------------------------------------------------------------------

/**
 * Maximum number of jobs running concurrently during the candidate span
 * [spanStart, spanEnd), counting the candidate job itself. This is the exact
 * team-capacity requirement: if it exceeds `teams`, the slot is unavailable.
 * Spans are half-open, so a job ending at T and another starting at T do not
 * collide (ends sort before starts at identical timestamps).
 */
export function maxConcurrentJobs(
  spanStart: number,
  spanEnd: number,
  busy: BusySpan[],
): number {
  // The candidate job occupies the whole span: +1 at start, -1 at end.
  const events: [number, number][] = [
    [spanStart, 1],
    [spanEnd, -1],
  ];
  for (const b of busy) {
    if (b.startUtc < spanEnd && spanStart < b.endUtc) {
      events.push([b.startUtc, 1], [b.endUtc, -1]);
    }
  }
  // Sweep line: at identical timestamps, process ends (-1) before starts (+1).
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0;
  let max = 0;
  for (const [, delta] of events) {
    cur += delta;
    if (cur > max) max = cur;
  }
  return max;
}

export interface SlotFeasibilityInput {
  nowMs: number;
  startUtc: number;
  durationMinutes: number;
  busy: BusySpan[];
  config?: SlotGenerationInput["config"];
}

export type SlotRejection =
  | "before_lead_time"
  | "past_max_advance"
  | "non_working_day"
  | "blackout"
  | "outside_hours"
  | "capacity";

/**
 * The authoritative availability rule. Returns null when the slot IS
 * available, or a rejection reason otherwise. Used by both the reactive
 * client query and the transactional server mutation.
 */
export function checkSlot(input: SlotFeasibilityInput): SlotRejection | null {
  const cfg = { ...defaults(), ...input.config };
  const dateKey = winnipegDateKey(input.startUtc);
  const timeKey = winnipegTimeKey(input.startUtc);
  const todayKey = todayInWinnipeg(input.nowMs);

  // Lead time / advance window (calendar days in Winnipeg).
  const daysAhead = daysBetween(todayKey, dateKey);
  if (daysAhead < cfg.minLeadDays!) return "before_lead_time";
  if (daysAhead > cfg.maxAdvanceDays!) return "past_max_advance";

  // Blackout + working day.
  if ((cfg.blackoutDates ?? []).includes(dateKey)) return "blackout";
  if (!cfg.workingDays!.includes(winnipegDayOfWeek(dateKey)))
    return "non_working_day";

  // Working hours: start must be >= dayStart and the whole job (duration +
  // buffer) must finish by dayEnd.
  const startMin = toMinutes(timeKey);
  const dayStartMin = toMinutes(cfg.dayStart!);
  const dayEndMin = toMinutes(cfg.dayEnd!);
  if (startMin < dayStartMin) return "outside_hours";
  if (startMin + input.durationMinutes + cfg.bufferMinutes! > dayEndMin)
    return "outside_hours";

  // Capacity: fewer than `teams` jobs may overlap our whole span.
  const endUtc =
    input.startUtc + (input.durationMinutes + cfg.bufferMinutes!) * 60_000;
  if (maxConcurrentJobs(input.startUtc, endUtc, input.busy) > cfg.teams!)
    return "capacity";

  return null;
}

// ---------------------------------------------------------------------------
// Slot generation
// ---------------------------------------------------------------------------

function defaults() {
  return {
    workingDays: AVAILABILITY.workingDays as number[],
    dayStart: AVAILABILITY.dayStart,
    dayEnd: AVAILABILITY.dayEnd,
    startTimeInterval: AVAILABILITY.startTimeInterval,
    teams: AVAILABILITY.teams,
    bufferMinutes: AVAILABILITY.bufferMinutes,
    minLeadDays: AVAILABILITY.minLeadDays,
    maxAdvanceDays: AVAILABILITY.maxAdvanceDays,
    blackoutDates: AVAILABILITY.blackoutDates as string[],
  };
}

function toMinutes(timeKey: string): number {
  const [h, m] = timeKey.split(":").map(Number);
  return h * 60 + m;
}

/** Whole calendar days from a to b (both Winnipeg date keys). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000,
  );
}

/**
 * Generate bookable start times for a window of dates. Only returns slots
 * that pass checkSlot for THIS job's duration. Caller filters to a
 * specific date when the customer has picked one.
 */
export function generateSlots(input: SlotGenerationInput): Slot[] {
  const cfg = { ...defaults(), ...input.config };
  const slots: Slot[] = [];
  const todayKey = todayInWinnipeg(input.nowMs);
  const scan = input.scanDays ?? 21;

  for (let offset = cfg.minLeadDays!; offset <= scan; offset++) {
    const dateKey = addDaysToWpgDateKey(todayKey, offset);
    if ((cfg.blackoutDates ?? []).includes(dateKey)) continue;
    if (!cfg.workingDays!.includes(winnipegDayOfWeek(dateKey))) continue;
    if (offset > cfg.maxAdvanceDays!) break;

    const dayStartUtc = utcFromWpgDateAndTime(dateKey, cfg.dayStart!);
    const dayEndUtc = utcFromWpgDateAndTime(dateKey, cfg.dayEnd!);
    const stepMs = cfg.startTimeInterval! * 60_000;

    for (let t = dayStartUtc; t < dayEndUtc; t += stepMs) {
      if (checkSlot({ ...input, startUtc: t }) === null) {
        slots.push({
          startUtc: t,
          endUtc: t + (input.durationMinutes + cfg.bufferMinutes!) * 60_000,
          dateKey,
          timeKey: winnipegTimeKey(t),
        });
      }
    }
  }
  return slots;
}

/** Convenience: slots for one Winnipeg date only. */
export function slotsForDate(
  dateKey: string,
  input: Omit<SlotGenerationInput, "scanDays">,
): Slot[] {
  const cfg = { ...defaults(), ...input.config };
  const todayKey = todayInWinnipeg(input.nowMs);
  const offset = daysBetween(todayKey, dateKey);
  if (offset < cfg.minLeadDays! || offset > cfg.maxAdvanceDays!) return [];
  if ((cfg.blackoutDates ?? []).includes(dateKey)) return [];
  if (!cfg.workingDays!.includes(winnipegDayOfWeek(dateKey))) return [];

  const dayStartUtc = utcFromWpgDateAndTime(dateKey, cfg.dayStart!);
  const dayEndUtc = utcFromWpgDateAndTime(dateKey, cfg.dayEnd!);
  const stepMs = cfg.startTimeInterval! * 60_000;
  const slots: Slot[] = [];
  for (let t = dayStartUtc; t < dayEndUtc; t += stepMs) {
    if (checkSlot({ ...input, startUtc: t }) === null) {
      slots.push({
        startUtc: t,
        endUtc: t + (input.durationMinutes + cfg.bufferMinutes!) * 60_000,
        dateKey,
        timeKey: winnipegTimeKey(t),
      });
    }
  }
  return slots;
}

/**
 * Dates within the booking window that have at least one bookable slot for
 * this job — used to grey out unavailable days on the calendar.
 */
export function bookableDates(
  input: Omit<SlotGenerationInput, "scanDays">,
): { dateKey: string; firstSlotUtc: number }[] {
  const out: { dateKey: string; firstSlotUtc: number }[] = [];
  const seen = new Map<string, number>();
  for (const s of generateSlots({ ...input, scanDays: input.config?.maxAdvanceDays ?? AVAILABILITY.maxAdvanceDays })) {
    if (!seen.has(s.dateKey)) seen.set(s.dateKey, s.startUtc);
  }
  for (const [dateKey, firstSlotUtc] of seen) out.push({ dateKey, firstSlotUtc });
  return out.sort((a, b) => a.firstSlotUtc - b.firstSlotUtc);
}

/** True when `a` and `b` spans overlap. */
export function spansOverlap(aStart: number, aEnd: number, b: BusySpan): boolean {
  return aStart < b.endUtc && b.startUtc < aEnd;
}

export { AVAILABILITY, jobDurationMinutes, TIMEZONE };
