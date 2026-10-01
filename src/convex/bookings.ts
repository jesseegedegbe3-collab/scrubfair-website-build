// ============================================================================
// Public booking functions — leads, availability, holds, submit
// ============================================================================
// Transactional anti-double-booking: every path that reserves time touches the
// scheduleDays document for the slot's Winnipeg date, so two simultaneous
// customers conflict under Convex OCC and one cleanly fails with
// "slot_taken". Availability is re-checked INSIDE mutations (never client
// only), and temp holds expire automatically.
// ============================================================================

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { AVAILABILITY, jobDurationMinutes } from "../config/availability";
import { estimate, PRICING } from "../config/pricing";
import { checkSlot, type BusySpan } from "../lib/scheduling";
import { winnipegDateKey, utcFromWpgDateAndTime, winnipegTimeKey } from "../lib/tz";
import {
  busySpansForDate,
  customerName,
  OCCUPYING_STATUSES,
  phoneDigits,
  releaseHoldsForBooking,
  touchScheduleDay,
} from "./bookingCore";

import { internalQuery } from "./_generated/server";

// ---------------------------------------------------------------------------
// Internal accessors (used by scheduled notification actions)
// ---------------------------------------------------------------------------
export const getByIdInternal = internalQuery({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ---------------------------------------------------------------------------
// Validation constants (server-side; the client mirrors these)
// ---------------------------------------------------------------------------
const POSTAL_RE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_MIN = 10;
const WINNIPEG_FSA = /^(R2|R3)/;

function isServiceArea(city: string, postal: string): boolean {
  const c = city.trim().toLowerCase();
  const p = postal.replace(/\s+/g, "").toUpperCase();
  return (c === "winnipeg" || c === "wpg") && WINNIPEG_FSA.test(p);
}

// ---------------------------------------------------------------------------
// Rate limiting (per IP, in-memory; resets per isolate)
// ---------------------------------------------------------------------------
const rateBucket = new Map<string, number[]>();
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (rateBucket.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) return false;
  arr.push(now);
  rateBucket.set(ip, arr);
  return true;
}

// ---------------------------------------------------------------------------
// Step 1 → save as lead (follow-up even if abandoned)
// ---------------------------------------------------------------------------
export const saveLead = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    addressStreet: v.string(),
    addressUnit: v.optional(v.string()),
    addressCity: v.string(),
    addressPostal: v.string(),
    consent: v.boolean(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.consent) throw new Error("Consent is required to continue.");
    if (!EMAIL_RE.test(args.email)) throw new Error("Invalid email address.");
    if (phoneDigits(args.phone).length < PHONE_DIGITS_MIN)
      throw new Error("Invalid phone number.");
    if (!args.addressStreet.trim()) throw new Error("Street address required.");

    const outsideArea = !isServiceArea(args.addressCity, args.addressPostal);
    const now = Date.now();

    // Abuse limit: one active request per email (status lead/requested).
    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .collect();
    const active = existing.find(
      (b) => b.status === "lead" || b.status === "requested" || b.status === "confirmed",
    );

    if (active && args.source !== "phone" && args.source !== "admin") {
      // Same customer returning: update the lead instead of duplicating.
      await ctx.db.patch(active._id, {
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        phone: args.phone.trim(),
        addressStreet: args.addressStreet.trim(),
        addressUnit: args.addressUnit?.trim(),
        addressCity: args.addressCity.trim(),
        addressPostal: args.addressPostal.replace(/\s+/g, "").toUpperCase(),
        outsideArea: outsideArea,
        outsideAreaFlag: outsideArea,
        consent: true,
        consentAt: now,
        updatedAt: now,
      });
      return { bookingId: active._id, reused: true };
    }

    const id = await ctx.db.insert("bookings", {
      status: "lead",
      createdAt: now,
      updatedAt: now,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: args.email.trim().toLowerCase(),
      phone: args.phone.trim(),
      consent: true,
      consentAt: now,
      addressStreet: args.addressStreet.trim(),
      addressUnit: args.addressUnit?.trim(),
      addressCity: args.addressCity.trim(),
      addressPostal: args.addressPostal.replace(/\s+/g, "").toUpperCase(),
      outsideArea: outsideArea,
      // Home details filled in step 2/3; validators need values now.
      sqft: 0,
      bedrooms: 0,
      fullBaths: 0,
      halfBaths: 0,
      homeType: "",
      serviceType: "",
      frequency: "one_time",
      addons: [],
      condition: "",
      pests: false,
      pets: false,
      entryMethod: "",
      needsReview: false,
      pestReview: false,
      quoteRequired: false,
      outsideAreaFlag: outsideArea,
      source: args.source ?? "website",
    });
    return { bookingId: id, reused: false };
  },
});

// ---------------------------------------------------------------------------
// Update home details + service (steps 2–3)
// ---------------------------------------------------------------------------
export const updateBookingDetails = mutation({
  args: {
    bookingId: v.id("bookings"),
    sqft: v.number(),
    sqftSource: v.optional(v.string()),
    bedrooms: v.number(),
    fullBaths: v.number(),
    halfBaths: v.number(),
    homeType: v.string(),
    serviceType: v.string(),
    frequency: v.string(),
    addons: v.array(v.string()),
    condition: v.string(),
  },
  handler: async (ctx, args) => {
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      sqft: args.sqft,
      sqftSource: args.sqftSource,
      bedrooms: args.bedrooms,
      fullBaths: args.fullBaths,
      halfBaths: args.halfBaths,
      homeType: args.homeType,
      serviceType: args.serviceType,
      frequency: args.frequency,
      addons: args.addons,
      condition: args.condition,
      needsReview: args.condition === "months" || args.condition === "year_plus",
      updatedAt: now,
    });
    return { ok: true };
  },
});

// ---------------------------------------------------------------------------
// Availability queries (reactive; customer-facing slot lists)
// ---------------------------------------------------------------------------

/** Computed estimate for the wizard (pure function, server-authoritative). */
export const quoteFor = query({
  args: {
    sqft: v.number(),
    bedrooms: v.number(),
    fullBaths: v.number(),
    halfBaths: v.number(),
    homeType: v.string(),
    frequency: v.string(),
    addons: v.array(v.string()),
    deepClean: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const base = estimate({
      sqft: args.sqft,
      bedrooms: args.bedrooms,
      fullBaths: args.fullBaths,
      halfBaths: args.halfBaths,
      homeType: args.homeType,
      frequency: args.frequency,
      addons: args.addons,
    });
    if (!base) return null;
    // Deep clean / move-in-out use the one-time price scaled up [OWNER note:
    // deep multiplier is a placeholder]. Kept explicit so the owner can tune.
    const deepMultiplier = 1.35;
    const firstVisit = args.deepClean
      ? Math.round(base.firstVisit * deepMultiplier)
      : base.firstVisit;
    return {
      firstVisit,
      perVisit: args.deepClean ? null : base.perVisit,
      configVersion: PRICING.configVersion,
    };
  },
});

/** Duration for THIS job (minutes incl. first-visit multiplier + add-ons). */
export const durationFor = query({
  args: { sqft: v.number(), addonCount: v.number() },
  handler: async (_ctx, args) => {
    return jobDurationMinutes({
      sqft: args.sqft,
      isFirstVisit: true, // first visit is always what's being scheduled
      addonCount: args.addonCount,
    });
  },
});

/** Bookable dates (for the calendar) for a given duration. */
export const availableDates = query({
  args: {
    durationMinutes: v.number(),
    days: v.optional(v.number()),
    nowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.nowMs ?? Date.now();
    const out: { dateKey: string; firstSlotUtc: number }[] = [];
    const seen = new Set<string>();
    const scan = Math.min(args.days ?? 21, AVAILABILITY.maxAdvanceDays);

    for (let offset = AVAILABILITY.minLeadDays; offset <= scan; offset++) {
      const dayStart = new Date(now + offset * 86_400_000);
      const dateKey = winnipegDateKey(dayStart.getTime());
      if (seen.has(dateKey)) continue;
      const spans = await busySpansForDate(ctx.db, dateKey);
      const dayFirst = firstSlotOnDate(dateKey, now, args.durationMinutes, spans);
      if (dayFirst != null) {
        seen.add(dateKey);
        out.push({ dateKey, firstSlotUtc: dayFirst });
      }
    }
    return out;
  },
});

/** Available start times for one date, for THIS job's duration. */
export const availableSlots = query({
  args: { dateKey: v.string(), durationMinutes: v.number(), nowMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = args.nowMs ?? Date.now();
    const spans = await busySpansForDate(ctx.db, args.dateKey);
    return slotsOnDate(args.dateKey, now, args.durationMinutes, spans);
  },
});

// Shared slot enumeration (mirrors src/lib/scheduling.generateSlots).
function slotsOnDate(
  dateKey: string,
  now: number,
  durationMinutes: number,
  busy: BusySpan[],
): { startUtc: number; timeKey: string }[] {
  const dayStartUtc = utcFromWpgDateAndTime(dateKey, AVAILABILITY.dayStart);
  const dayEndUtc = utcFromWpgDateAndTime(dateKey, AVAILABILITY.dayEnd);
  const step = AVAILABILITY.startTimeInterval * 60_000;
  const out: { startUtc: number; timeKey: string }[] = [];
  for (let t = dayStartUtc; t < dayEndUtc; t += step) {
    const reject = checkSlot({
      nowMs: now,
      startUtc: t,
      durationMinutes,
      busy,
    });
    if (reject === null) out.push({ startUtc: t, timeKey: winnipegTimeKey(t) });
  }
  return out;
}

function firstSlotOnDate(
  dateKey: string,
  now: number,
  durationMinutes: number,
  busy: BusySpan[],
): number | null {
  const s = slotsOnDate(dateKey, now, durationMinutes, busy);
  return s.length ? s[0].startUtc : null;
}

// ---------------------------------------------------------------------------
// Temp hold (10 minutes) when the customer picks a slot in Step 4b
// ---------------------------------------------------------------------------
export const holdSlot = mutation({
  args: {
    bookingId: v.id("bookings"),
    startUtc: v.number(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");

    const dateKey = winnipegDateKey(args.startUtc);
    const endUtc =
      args.startUtc + (args.durationMinutes + AVAILABILITY.bufferMinutes) * 60_000;

    // Serialize on the day document.
    await touchScheduleDay(ctx.db, dateKey);

    // Release any previous hold for this booking (they changed their pick).
    await releaseHoldsForBooking(ctx.db, args.bookingId);

    // Re-check availability INSIDE the mutation, including active holds.
    const busy = await busySpansForDate(ctx.db, dateKey);
    const reject = checkSlot({
      nowMs: now,
      startUtc: args.startUtc,
      durationMinutes: args.durationMinutes,
      busy,
    });
    if (reject !== null) return { ok: false as const, reason: reject };

    await ctx.db.insert("slotHolds", {
      slotStartUtc: args.startUtc,
      slotEndUtc: endUtc,
      durationMinutes: args.durationMinutes,
      bookingId: args.bookingId,
      expiresAt: now + AVAILABILITY.tempHoldMinutes * 60_000,
      email: b.email,
    });
    await ctx.db.patch(args.bookingId, {
      slotStartUtc: args.startUtc,
      slotEndUtc: endUtc,
      durationMinutes: args.durationMinutes,
      teamId: undefined,
      updatedAt: now,
    });
    return { ok: true as const };
  },
});

/** Release the customer's hold (they went back a step / changed pick). */
export const releaseHold = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    await releaseHoldsForBooking(ctx.db, args.bookingId);
    return { ok: true };
  },
});

// ---------------------------------------------------------------------------
// Final submit — transactional reserve + status "requested"
// ---------------------------------------------------------------------------
export const submitBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    pests: v.boolean(),
    pets: v.boolean(),
    petsNote: v.optional(v.string()),
    entryMethod: v.string(),
    specialRequests: v.optional(v.string()),
    honeypot: v.optional(v.string()),
    confirmVia: v.union(v.literal("email"), v.literal("sms")),
    utm: v.optional(
      v.object({
        source: v.optional(v.string()),
        medium: v.optional(v.string()),
        campaign: v.optional(v.string()),
        gclid: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Honeypot: silently accept but do nothing (bot trap).
    if (args.honeypot && args.honeypot.trim() !== "") {
      return { ok: true as const, bot: true };
    }

    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    if (b.status !== "lead") throw new Error("This request was already submitted.");

    // One active request per email and per phone.
    const byEmail = await ctx.db
      .query("bookings")
      .withIndex("by_email", (q) => q.eq("email", b.email))
      .collect();
    if (
      byEmail.some(
        (x) =>
          x._id !== b._id &&
          (x.status === "requested" || x.status === "confirmed"),
      )
    )
      return { ok: false as const, reason: "duplicate_email" };

    const byPhone = await ctx.db
      .query("bookings")
      .withIndex("by_phone", (q) => q.eq("phone", b.phone))
      .collect();
    if (
      byPhone.some(
        (x) =>
          x._id !== b._id &&
          (x.status === "requested" || x.status === "confirmed"),
      )
    )
      return { ok: false as const, reason: "duplicate_phone" };

    // Pricing snapshot + flags (server-authoritative recompute).
    const deep = b.serviceType === "deep" || b.serviceType === "move_in_out";
    const est = estimate({
      sqft: b.sqft,
      bedrooms: b.bedrooms,
      fullBaths: b.fullBaths,
      halfBaths: b.halfBaths,
      homeType: b.homeType,
      frequency: b.frequency,
      addons: b.addons,
    });
    const firstVisit = est ? (deep ? Math.round(est.firstVisit * 1.35) : est.firstVisit) : null;
    const perVisit = est && !deep ? est.perVisit : null;
    const quoteRequired = firstVisit === null || b.outsideArea === true;

    const patch: Record<string, unknown> = {
      status: "requested",
      pests: args.pests,
      pestReview: args.pests,
      pets: args.pets,
      petsNote: args.petsNote?.slice(0, 500),
      entryMethod: args.entryMethod,
      confirmVia: args.confirmVia,
      needsReview:
        b.needsReview || b.condition === "months" || b.condition === "year_plus",
      quoteRequired,
      priceFirstVisit: firstVisit ?? undefined,
      pricePerVisit: perVisit ?? undefined,
      configVersion: PRICING.configVersion,
      holdExpiresAt: now + AVAILABILITY.holdHours * 3_600_000,
      updatedAt: now,
    };
    if (!quoteRequired) {
      patch.slotStartUtc = b.slotStartUtc;
      patch.slotEndUtc = b.slotEndUtc;
      patch.durationMinutes = b.durationMinutes;
    } else {
      // Quote-required submissions carry no slot.
      patch.slotStartUtc = undefined;
      patch.slotEndUtc = undefined;
    }
    if (args.utm) patch.utm = args.utm;

    // Serialize + re-check the slot inside the same transaction.
    if (!quoteRequired && b.slotStartUtc != null) {
      const dateKey = winnipegDateKey(b.slotStartUtc);
      await touchScheduleDay(ctx.db, dateKey);
      await releaseHoldsForBooking(ctx.db, b._id); // own hold must not block us
      const busy = await busySpansForDate(ctx.db, dateKey);
      const reject = checkSlot({
        nowMs: now,
        startUtc: b.slotStartUtc,
        durationMinutes: b.durationMinutes ?? 120,
        busy,
      });
      if (reject !== null) {
        return { ok: false as const, reason: "slot_taken" };
      }
    } else {
      await releaseHoldsForBooking(ctx.db, b._id);
    }

    // ------------------------------------------------------------------
    // INSTANT CONFIRMATION (owner directive: the customer's pick IS the
    // booking — no owner approval step). Bookings WITH a slot are confirmed
    // in this same transaction. Only quote-required requests (no slot)
    // stay in "requested" for manual scheduling.
    // ------------------------------------------------------------------
    if (!quoteRequired) {
      patch.status = "confirmed";
      patch.confirmedAt = now;
      patch.finalPrice = firstVisit; // estimate becomes the booked price
      patch.holdExpiresAt = undefined; // no owner-action deadline
    }

    await ctx.db.patch(b._id, patch);

    // Notifications (never block the booking on provider failures).
    if (!quoteRequired) {
      await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyAutoConfirmed, {
        bookingId: b._id,
      });
    } else {
      await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyRequested, {
        bookingId: b._id,
        customerEmail: true,
      });
    }

    return { ok: true as const, bookingId: b._id, quoteRequired, confirmed: !quoteRequired };
  },
});

// ---------------------------------------------------------------------------
// Customer self-service confirmation — the customer's pick is the booking.
// ---------------------------------------------------------------------------
// Called automatically right after a successful submit. Status becomes
// "confirmed" so the slot is firm and future customers can't take it.
// The owner is still notified and can still decline/cancel/reschedule from
// /admin; flags (pests, condition, outside area) simply surface in Telegram
// as "review before the visit" instead of blocking the booking.
// ---------------------------------------------------------------------------
export const autoConfirmBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    if (b.status !== "requested") return { ok: true as const }; // idempotent
    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      confirmedAt: now,
      finalPrice: b.priceFirstVisit, // the estimate becomes the booked price
      holdExpiresAt: undefined, // no owner-action deadline anymore
      slotExpired: false,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyAutoConfirmed, {
      bookingId: args.bookingId,
    });
    return { ok: true as const };
  },
});

export { OCCUPYING_STATUSES, customerName, phoneDigits };
