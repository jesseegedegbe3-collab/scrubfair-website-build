// ============================================================================
// Booking core — shared helpers used by public + admin booking functions
// ============================================================================
// The anti-double-booking pattern (spec §3c):
//   Every reservation path (customer hold, customer submit, owner manual
//   booking, admin reschedule) must touch the `scheduleDays` document for the
//   Winnipeg date of the slot. Convex mutations are transactional under OCC:
//   two simultaneous transactions touching the same day document conflict,
//   one retries, re-checks availability and fails cleanly. Availability is
//   ALWAYS re-checked inside the mutation — never client-side only.
// ============================================================================

import { internal } from "./_generated/api";
import { Id, Doc, DataModel } from "./_generated/dataModel";
import { GenericDatabaseReader, GenericDatabaseWriter } from "convex/server";
import { AVAILABILITY } from "../config/availability";
import { winnipegDateKey, utcFromWpgDateAndTime } from "../lib/tz";
import type { BusySpan } from "../lib/scheduling";

type DBReader = GenericDatabaseReader<DataModel>;
type DBWriter = GenericDatabaseWriter<DataModel>;

// ---------------------------------------------------------------------------
// Busy spans: everything that occupies a team
// ---------------------------------------------------------------------------

/** Booking statuses that occupy a team's schedule. */
export const OCCUPYING_STATUSES = ["requested", "confirmed", "completed"] as const;

/**
 * All busy spans (start, end, team) for a date, from bookings + temp holds +
 * admin calendar blocks. `endUtc` on bookings/holds ALREADY includes the
 * buffer (stored that way at write time); calendar blocks are raw ranges.
 */
export async function busySpansForDate(
  db: DBReader,
  dateKey: string,
): Promise<BusySpan[]> {
  const dayStart = utcFromWpgDateAndTime(dateKey, "00:00");
  const dayEnd = utcFromWpgDateAndTime(dateKey, "23:59");
  const spans: BusySpan[] = [];

  // Bookings with a slot on this date.
  const bookings = await db
    .query("bookings")
    .withIndex("by_slotStart", (q) =>
      q.gte("slotStartUtc", dayStart).lte("slotStartUtc", dayEnd),
    )
    .collect();
  for (const b of bookings) {
    if (!(OCCUPYING_STATUSES as readonly string[]).includes(b.status)) continue;
    if (b.slotStartUtc == null || b.slotEndUtc == null) continue;
    spans.push({
      startUtc: b.slotStartUtc,
      endUtc: b.slotEndUtc,
      teamId: b.teamId,
    });
  }

  // Active temp holds (not yet expired).
  const now = Date.now();
  const holds = await db.query("slotHolds").collect();
  for (const h of holds) {
    if (h.expiresAt <= now) continue;
    if (winnipegDateKey(h.slotStartUtc) !== dateKey) continue;
    spans.push({
      startUtc: h.slotStartUtc,
      endUtc: h.slotEndUtc,
      teamId: undefined,
    });
  }

  // Admin blocks.
  const blocks = await db
    .query("calendarBlocks")
    .withIndex("by_startUtc", (q) =>
      q.gte("startUtc", dayStart).lte("startUtc", dayEnd),
    )
    .collect();
  for (const bl of blocks) {
    spans.push({ startUtc: bl.startUtc, endUtc: bl.endUtc, teamId: undefined });
  }

  return spans;
}

/**
 * Serialize on the schedule-day document: get/create it and mark it modified.
 * Under Convex OCC, two simultaneous mutations for the same day will conflict
 * here; the losing transaction retries from scratch and re-evaluates.
 */
export async function touchScheduleDay(db: DBWriter, dateKey: string): Promise<void> {
  // NOTE: deliberately .collect() instead of .unique() — .unique() THROWS when
  // two concurrent first-touches inserted duplicate day docs, which surfaced
  // to customers as a false "slot taken" error. This version self-heals any
  // existing duplicates and keeps the OCC serialization intact.
  const existing = await db
    .query("scheduleDays")
    .withIndex("by_dateKey", (q) => q.eq("dateKey", dateKey))
    .collect();
  if (existing.length > 0) {
    // Heal duplicates: keep the first doc, delete any extras.
    for (const dup of existing.slice(1)) {
      await db.delete(dup._id);
    }
    await db.patch(existing[0]._id, {
      version: existing[0].version + 1,
      updatedAt: Date.now(),
    });
  } else {
    await db.insert("scheduleDays", {
      dateKey,
      version: 1,
      updatedAt: Date.now(),
    });
  }
}

/** Release all active holds for a booking (on submit, cancel, decline). */
export async function releaseHoldsForBooking(db: DBWriter, bookingId: Id<"bookings">): Promise<void> {
  const holds = await db
    .query("slotHolds")
    .withIndex("by_booking", (q) => q.eq("bookingId", bookingId))
    .collect();
  for (const h of holds) {
    await db.delete(h._id);
  }
}

/** Contact helper for notifications. */
export function customerName(b: {
  firstName: string;
  lastName: string;
}): string {
  return `${b.firstName} ${b.lastName}`.trim();
}

/** Phone digits only (for abuse-limit checks). */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Re-export config values commonly needed by booking functions.
export { AVAILABILITY };
export type { Doc };
