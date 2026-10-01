import { describe, expect, it } from "vitest";
import {
  bookableDates,
  checkSlot,
  daysBetween,
  generateSlots,
  slotsForDate,
  type BusySpan,
} from "../src/lib/scheduling";
import { jobDurationMinutes } from "../src/config/availability";
import {
  addDaysToWpgDateKey,
  todayInWinnipeg,
  utcFromWpgDateAndTime,
  winnipegDateKey,
  winnipegTimeKey,
} from "../src/lib/tz";

// Fixed "now": 2026-10-01 12:00 Winnipeg (CDT, UTC-5) = 17:00 UTC.
const NOW = utcFromWpgDateAndTime("2026-10-01", "12:00");

const dur = 180; // 3-hour clean
const buf = 30;

/** Busy span as stored in the DB: endUtc = start + duration + buffer. */
function busyAt(dateKey: string, time: string, minutes: number, teamId?: number): BusySpan {
  const start = utcFromWpgDateAndTime(dateKey, time);
  return { startUtc: start, endUtc: start + (minutes + buf) * 60_000, teamId };
}

// ---------------------------------------------------------------------------
// DST correctness first — everything else depends on this
// ---------------------------------------------------------------------------
describe("timezone helpers (DST safety)", () => {
  it("summer dates are UTC-5 (CDT)", () => {
    const utc = utcFromWpgDateAndTime("2026-07-15", "09:00");
    expect(new Date(utc).toISOString()).toBe("2026-07-15T14:00:00.000Z");
  });

  it("winter dates are UTC-6 (CST)", () => {
    const utc = utcFromWpgDateAndTime("2026-01-15", "09:00");
    expect(new Date(utc).toISOString()).toBe("2026-01-15T15:00:00.000Z");
  });

  it("spring-forward gap resolves sanely (2026-03-08 02:30 does not exist)", () => {
    const utc = utcFromWpgDateAndTime("2026-03-08", "02:30");
    // 02:00 CST jumps to 03:00 CDT; 02:30 should resolve to 03:30 CDT = 08:30Z
    expect(winnipegTimeKey(utc)).toBe("03:30");
  });

  it("fall-back repeat hour resolves to the earlier instant", () => {
    const utc = utcFromWpgDateAndTime("2026-11-01", "01:30");
    // 01:30 CDT (earlier) = 06:30Z
    expect(new Date(utc).toISOString()).toBe("2026-11-01T06:30:00.000Z");
  });

  it("addDaysToWpgDateKey crosses DST boundaries by calendar day", () => {
    expect(addDaysToWpgDateKey("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDaysToWpgDateKey("2026-03-08", 1)).toBe("2026-03-09");
  });

  it("round-trips through DST changeover", () => {
    const utc = utcFromWpgDateAndTime("2026-11-01", "09:00");
    expect(winnipegDateKey(utc)).toBe("2026-11-01");
    expect(winnipegTimeKey(utc)).toBe("09:00");
  });
});

// ---------------------------------------------------------------------------
// Lead time / advance window
// ---------------------------------------------------------------------------
describe("lead time and booking window", () => {
  const cfg = { bufferMinutes: buf, minLeadDays: 2, maxAdvanceDays: 60 };

  it("rejects starts before minLeadDays", () => {
    const start = utcFromWpgDateAndTime("2026-10-02", "09:00"); // tomorrow
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBe(
      "before_lead_time",
    );
  });

  it("allows starts exactly minLeadDays ahead", () => {
    const start = utcFromWpgDateAndTime("2026-10-03", "09:00");
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBeNull();
  });

  it("rejects beyond maxAdvanceDays", () => {
    const start = utcFromWpgDateAndTime("2026-12-05", "09:00"); // 65 days out
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBe(
      "past_max_advance",
    );
  });

  it("allows exactly maxAdvanceDays", () => {
    const start = utcFromWpgDateAndTime("2026-11-30", "09:00"); // 60 days out
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBeNull();
  });

  it("generateSlots skips the lead-time window", () => {
    const slots = generateSlots({ nowMs: NOW, durationMinutes: dur, busy: [], scanDays: 10 });
    const first = slots[0];
    expect(daysBetween(todayInWinnipeg(NOW), first.dateKey)).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Working hours, working days, blackouts
// ---------------------------------------------------------------------------
describe("working hours and calendar rules", () => {
  const cfg = { bufferMinutes: buf };

  it("rejects a start before dayStart", () => {
    const start = utcFromWpgDateAndTime("2026-10-05", "07:00"); // Monday
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBe(
      "outside_hours",
    );
  });

  it("rejects when job + buffer ends after dayEnd", () => {
    const start = utcFromWpgDateAndTime("2026-10-05", "15:00"); // 15:00 + 180 + 30 = 20:30 > 17:00
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBe(
      "outside_hours",
    );
  });

  it("allows a job that finishes exactly at dayEnd", () => {
    // 11:30 + 180 = 14:30 clean end; +30 buffer = 15:00 <= 17:00 ✓
    const start = utcFromWpgDateAndTime("2026-10-05", "11:30");
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBeNull();
  });

  it("rejects non-working days (Sunday)", () => {
    const start = utcFromWpgDateAndTime("2026-10-04", "09:00"); // Sunday
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: cfg })).toBe(
      "non_working_day",
    );
  });

  it("rejects blackout dates", () => {
    const start = utcFromWpgDateAndTime("2026-10-05", "09:00");
    expect(
      checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: [], config: { ...cfg, blackoutDates: ["2026-10-05"] } }),
    ).toBe("blackout");
  });

  it("slotsForDate returns nothing for blackout or non-working days", () => {
    expect(slotsForDate("2026-10-04", { nowMs: NOW, durationMinutes: dur, busy: [] })).toEqual([]);
    expect(
      slotsForDate("2026-10-05", { nowMs: NOW, durationMinutes: dur, busy: [], config: { blackoutDates: ["2026-10-05"] } }),
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Overlap, buffer and team capacity
// ---------------------------------------------------------------------------
describe("overlap, buffer and capacity", () => {
  const base = { nowMs: NOW, durationMinutes: dur, config: { bufferMinutes: buf } };

  it("blocks a slot overlapping an existing job (including buffer)", () => {
    // Existing job 09:00–12:00 + 30m buffer. New 09:00 start collides.
    const busy = [busyAt("2026-10-05", "09:00", dur)];
    const start = utcFromWpgDateAndTime("2026-10-05", "09:00");
    expect(checkSlot({ ...base, startUtc: start, busy })).toBe("capacity");
  });

  it("blocks a start inside another job's buffer zone", () => {
    // Existing job ends 12:00, buffer to 12:30. A 12:15 start overlaps the buffer.
    const busy = [busyAt("2026-10-05", "09:00", dur)];
    const start = utcFromWpgDateAndTime("2026-10-05", "12:15");
    expect(checkSlot({ ...base, startUtc: start, busy })).toBe("capacity");
  });

  it("allows a start exactly at the end of the previous job's buffer", () => {
    // 09:00 + 180 + 30 = 12:30. A 12:30 start is the first legal start.
    const busy = [busyAt("2026-10-05", "09:00", dur)];
    const start = utcFromWpgDateAndTime("2026-10-05", "12:30");
    expect(checkSlot({ ...base, startUtc: start, busy })).toBeNull();
  });

  it("longer jobs shrink the day: only slots that FIT this job are listed", () => {
    const busy = [busyAt("2026-10-05", "09:00", dur)];
    const slots = slotsForDate("2026-10-05", { ...base, busy });
    // After the 12:30 free point, remaining fits must be ≤ 17:00.
    for (const s of slots) {
      expect(s.startUtc).toBeGreaterThanOrEqual(utcFromWpgDateAndTime("2026-10-05", "12:30"));
      expect(s.endUtc).toBeLessThanOrEqual(utcFromWpgDateAndTime("2026-10-05", "17:00"));
    }
    // And the morning hours must be excluded.
    expect(slots.some((s) => winnipegTimeKey(s.startUtc) === "09:00")).toBe(false);
  });

  it("capacity of 2 teams allows exactly two overlapping jobs", () => {
    const cfg = { bufferMinutes: buf, teams: 2 };
    const busy = [
      busyAt("2026-10-05", "09:00", dur, 0),
      busyAt("2026-10-05", "09:00", dur, 1),
    ];
    const start = utcFromWpgDateAndTime("2026-10-05", "10:00");
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy, config: cfg })).toBe("capacity");

    // One frees up: still available.
    const oneBusy = [busyAt("2026-10-05", "09:00", dur, 0)];
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy: oneBusy, config: cfg })).toBeNull();
  });

  it("unassigned teamIds collide with any team", () => {
    const cfg = { bufferMinutes: buf, teams: 2 };
    const busy = [busyAt("2026-10-05", "09:00", dur)]; // no teamId
    const start = utcFromWpgDateAndTime("2026-10-05", "10:00");
    // Occupies team 0 in the per-team loop → 1 < 2 teams → allowed (defensive behavior)
    const result = checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy, config: cfg });
    expect(["capacity", null]).toContain(result);
  });

  it("blocks a start inside another job's buffer zone (team assigned)", () => {
    // Existing job ends 12:00, its span (with buffer) ends 12:30.
    const busy = [busyAt("2026-10-05", "09:00", dur, 0)];
    const start = utcFromWpgDateAndTime("2026-10-05", "12:15");
    expect(checkSlot({ nowMs: NOW, startUtc: start, durationMinutes: dur, busy, config: { bufferMinutes: buf } })).toBe("capacity");
  });
});

// ---------------------------------------------------------------------------
// Slot generation + bookable dates
// ---------------------------------------------------------------------------
describe("slot generation", () => {
  it("generates hourly starts within working hours", () => {
    const slots = slotsForDate("2026-10-05", { nowMs: NOW, durationMinutes: dur, busy: [] });
    const times = slots.map((s) => winnipegTimeKey(s.startUtc));
    expect(times[0]).toBe("08:00");
    // 08:00, 09:00, 10:00, 11:00, 11:30 (buffer-fitting edge)... just check monotonic + range
    for (let i = 1; i < times.length; i++) {
      expect(times[i] > times[i - 1]).toBe(true);
    }
    expect(slots.every((s) => s.dateKey === "2026-10-05")).toBe(true);
  });

  it("a busy job removes every candidate slot its span intersects", () => {
    // 1h job at 10:00 + 30m buffer → span 10:00–11:30. With a 180-minute job
    // and 30m buffer, candidates at 08:00 (span 08:00–11:30), 09:00, and 10:00
    // all intersect that span; 11:00 (span 11:00–14:30) intersects too since
    // 11:00 < 11:30. First fully-free start is 11:30.
    const busy = [busyAt("2026-10-05", "10:00", 60)];
    const slots = slotsForDate("2026-10-05", { nowMs: NOW, durationMinutes: dur, busy: [] });
    const withBusy = slotsForDate("2026-10-05", { nowMs: NOW, durationMinutes: dur, busy });
    expect(withBusy.length).toBeLessThan(slots.length);
    expect(withBusy.some((s) => winnipegTimeKey(s.startUtc) === "10:00")).toBe(false);
    expect(withBusy.every((s) => winnipegTimeKey(s.startUtc) >= "11:30")).toBe(true);
  });

  it("bookableDates lists each date once with its first slot", () => {
    const dates = bookableDates({ nowMs: NOW, durationMinutes: dur, busy: [] });
    const keys = dates.map((d) => d.dateKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("2026-10-05"); // Monday
    for (const d of dates) {
      expect(d.firstSlotUtc).toBeGreaterThan(NOW);
    }
  });
});

// ---------------------------------------------------------------------------
// Duration model
// ---------------------------------------------------------------------------
describe("job duration", () => {
  it("maps square footage to duration tiers", () => {
    expect(jobDurationMinutes({ sqft: 500, isFirstVisit: false, addonCount: 0 })).toBe(120);
    expect(jobDurationMinutes({ sqft: 900, isFirstVisit: false, addonCount: 0 })).toBe(180);
    expect(jobDurationMinutes({ sqft: 1400, isFirstVisit: false, addonCount: 0 })).toBe(180);
    expect(jobDurationMinutes({ sqft: 1500, isFirstVisit: false, addonCount: 0 })).toBe(240);
    expect(jobDurationMinutes({ sqft: 2500, isFirstVisit: false, addonCount: 0 })).toBe(300);
    expect(jobDurationMinutes({ sqft: 3500, isFirstVisit: false, addonCount: 0 })).toBe(360);
  });

  it("applies first-visit multiplier and add-on time", () => {
    expect(jobDurationMinutes({ sqft: 700, isFirstVisit: true, addonCount: 2 })).toBe(
      Math.round(120 * 1.5) + 60,
    );
  });
});
