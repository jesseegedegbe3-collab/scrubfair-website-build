// ============================================================================
// Admin booking functions — owner workflow (token-guarded)
// ============================================================================
// Security model: ADMIN_TOKEN env var; the owner's URL is
//   /admin?token=<ADMIN_TOKEN>
// Every admin mutation/query re-verifies the token server-side. The page is
// noindex (robots.txt + meta) and never linked publicly.
// ============================================================================

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { AVAILABILITY } from "../config/availability";
import { checkSlot } from "../lib/scheduling";
import { winnipegDateKey, utcFromWpgDateAndTime } from "../lib/tz";
import {
  busySpansForDate,
  phoneDigits,
  touchScheduleDay,
  releaseHoldsForBooking,
} from "./bookingCore";

// ---------------------------------------------------------------------------
// Token guard
// ---------------------------------------------------------------------------
function assertAdmin(token: string | undefined): void {
  if (!token || token !== process.env.ADMIN_TOKEN) {
    throw new Error("Unauthorized: invalid admin token.");
  }
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------
export const listRequests = query({
  args: { token: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const rows =
      args.status && args.status !== "all"
        ? await ctx.db
            .query("bookings")
            .withIndex("by_status_createdAt", (q) => q.eq("status", args.status as any))
            .collect()
        : await ctx.db.query("bookings").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, 500);
  },
});

/** Everything the dashboard needs in one call. */
export const adminSummary = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const all = await ctx.db.query("bookings").collect();
    const now = Date.now();
    const counts = {
      leads: all.filter((b) => b.status === "lead").length,
      requested: all.filter((b) => b.status === "requested").length,
      confirmed: all.filter((b) => b.status === "confirmed").length,
      completed: all.filter((b) => b.status === "completed").length,
      declinedCancelled: all.filter(
        (b) => b.status === "declined" || b.status === "cancelled",
      ).length,
      needsReview: all.filter(
        (b) => b.status === "requested" && (b.needsReview || b.pestReview),
      ).length,
    };
    const expiringSoon = all.filter(
      (b) =>
        b.status === "requested" &&
        b.holdExpiresAt != null &&
        b.holdExpiresAt > now &&
        b.holdExpiresAt - now < 6 * 3600_000,
    ).length;
    const withSlot = all.filter((b) => b.slotStartUtc != null && b.status !== "declined" && b.status !== "cancelled" && b.status !== "lead");
    return { counts, expiringSoon, upcoming: withSlot.sort((a, b) => (a.slotStartUtc ?? 0) - (b.slotStartUtc ?? 0)).slice(0, 20) };
  },
});

// ---------------------------------------------------------------------------
// Owner actions
// ---------------------------------------------------------------------------

/** Confirm: sets final price + booked time; releases holds; emails customer. */
export const confirmBooking = mutation({
  args: {
    token: v.string(),
    bookingId: v.id("bookings"),
    finalPrice: v.number(),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    if (b.status !== "requested" && b.status !== "lead")
      throw new Error(`Cannot confirm a booking in status "${b.status}".`);
    const now = Date.now();

    if (b.slotStartUtc != null) {
      // Re-verify the slot is still free (owner may confirm late).
      const dateKey = winnipegDateKey(b.slotStartUtc);
      await touchScheduleDay(ctx.db, dateKey);
      const busy = await busySpansForDate(ctx.db, dateKey);
      const reject = checkSlot({
        nowMs: now,
        startUtc: b.slotStartUtc,
        durationMinutes: b.durationMinutes ?? 120,
        busy,
      });
      // The booking's own row counts as busy here; treat self-overlap as OK.
      const selfOnly = reject === "capacity" &&
        busy.filter(
          (x) => x.startUtc < (b.slotEndUtc ?? 0) && b.slotStartUtc! < x.endUtc,
        ).length <= 1;
      if (reject !== null && !selfOnly) {
        throw new Error(
          "The requested slot is no longer available — reschedule first, then confirm.",
        );
      }
      await releaseHoldsForBooking(ctx.db, b._id);
    }

    await ctx.db.patch(b._id, {
      status: "confirmed",
      finalPrice: args.finalPrice,
      confirmedAt: Date.now(),
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyConfirmed, {
      bookingId: b._id,
    });
    return { ok: true };
  },
});

/** Decline: releases the slot, emails a polite message. */
export const declineBooking = mutation({
  args: { token: v.string(), bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    await releaseHoldsForBooking(ctx.db, b._id);
    await ctx.db.patch(b._id, {
      status: "declined",
      slotStartUtc: undefined,
      slotEndUtc: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyDeclined, {
      bookingId: b._id,
    });
    return { ok: true };
  },
});

/** Cancel (owner- or customer-initiated): releases the slot. */
export const cancelBooking = mutation({
  args: { token: v.string(), bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    await releaseHoldsForBooking(ctx.db, b._id);
    await ctx.db.patch(b._id, {
      status: "cancelled",
      slotStartUtc: undefined,
      slotEndUtc: undefined,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Mark completed. */
export const completeBooking = mutation({
  args: { token: v.string(), bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    if (b.status !== "confirmed") throw new Error("Only confirmed bookings can be completed.");
    await ctx.db.patch(b._id, { status: "completed", updatedAt: Date.now() });
    return { ok: true };
  },
});

/** Reschedule to a new available slot (admin picks from availableSlots). */
export const rescheduleBooking = mutation({
  args: {
    token: v.string(),
    bookingId: v.id("bookings"),
    newStartUtc: v.number(),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    const duration =
      args.durationMinutes ?? b.durationMinutes ?? 180;
    const now = Date.now();
    const dateKey = winnipegDateKey(args.newStartUtc);

    await touchScheduleDay(ctx.db, dateKey);

    // Availability excluding this booking's own current slot.
    const busyAll = await busySpansForDate(ctx.db, dateKey);
    const busy = busyAll.filter((x) => !(x.startUtc === b.slotStartUtc));
    const reject = checkSlot({
      nowMs: now,
      startUtc: args.newStartUtc,
      durationMinutes: duration,
      busy,
    });
    if (reject !== null) {
      throw new Error(`That time is not available (${reject}). Pick another slot.`);
    }

    const endUtc = args.newStartUtc + (duration + AVAILABILITY.bufferMinutes) * 60_000;
    await releaseHoldsForBooking(ctx.db, b._id);
    await ctx.db.patch(b._id, {
      slotStartUtc: args.newStartUtc,
      slotEndUtc: endUtc,
      durationMinutes: duration,
      updatedAt: now,
    });

    // Notify the customer about the new time (owner already talked to them).
    await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyConfirmed, {
      bookingId: b._id,
    });
    return { ok: true };
  },
});

/** Override duration for one booking (admin tool). */
export const overrideDuration = mutation({
  args: {
    token: v.string(),
    bookingId: v.id("bookings"),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const b = await ctx.db.get(args.bookingId);
    if (!b) throw new Error("Booking not found.");
    if (b.slotStartUtc == null) throw new Error("Booking has no slot.");
    // Re-check the (possibly longer) span fits.
    const dateKey = winnipegDateKey(b.slotStartUtc);
    await touchScheduleDay(ctx.db, dateKey);
    const busy = (await busySpansForDate(ctx.db, dateKey)).filter(
      (x) => x.startUtc !== b.slotStartUtc,
    );
    const reject = checkSlot({
      nowMs: Date.now(),
      startUtc: b.slotStartUtc,
      durationMinutes: args.durationMinutes,
      busy,
    });
    if (reject !== null)
      throw new Error(`Duration override conflicts with the schedule (${reject}).`);
    await ctx.db.patch(b._id, {
      durationMinutes: args.durationMinutes,
      slotEndUtc: b.slotStartUtc + (args.durationMinutes + AVAILABILITY.bufferMinutes) * 60_000,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Manual booking (phone bookings) — same pipeline so schedules never collide. */
export const manualBooking = mutation({
  args: {
    token: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.string(),
    addressStreet: v.string(),
    addressCity: v.optional(v.string()),
    addressPostal: v.optional(v.string()),
    sqft: v.optional(v.number()),
    serviceType: v.optional(v.string()),
    startUtc: v.number(),
    durationMinutes: v.number(),
    price: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const now = Date.now();
    const dateKey = winnipegDateKey(args.startUtc);
    await touchScheduleDay(ctx.db, dateKey);
    const busy = await busySpansForDate(ctx.db, dateKey);
    const reject = checkSlot({
      nowMs: now,
      startUtc: args.startUtc,
      durationMinutes: args.durationMinutes,
      busy,
    });
    if (reject !== null) {
      throw new Error(`That time is not available (${reject}). Pick another slot.`);
    }
    const endUtc = args.startUtc + (args.durationMinutes + AVAILABILITY.bufferMinutes) * 60_000;
    const id = await ctx.db.insert("bookings", {
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
      firstName: args.firstName,
      lastName: args.lastName ?? "",
      email: args.email ?? `phone-${phoneDigits(args.phone)}@phone.bookings`,
      phone: args.phone,
      consent: true,
      consentAt: now,
      addressStreet: args.addressStreet,
      addressCity: args.addressCity ?? "Winnipeg",
      addressPostal: args.addressPostal ?? "",
      sqft: args.sqft ?? 0,
      bedrooms: 0,
      fullBaths: 0,
      halfBaths: 0,
      homeType: "",
      serviceType: args.serviceType ?? "manual",
      frequency: "one_time",
      addons: [],
      condition: "",
      pests: false,
      pets: false,
      entryMethod: "",
      needsReview: false,
      pestReview: false,
      quoteRequired: false,
      outsideArea: false,
      source: "phone",
      slotStartUtc: args.startUtc,
      slotEndUtc: endUtc,
      durationMinutes: args.durationMinutes,
      finalPrice: args.price,
      ownerNotes: args.notes,
    });
    return { ok: true, bookingId: id };
  },
});

/** Block a time range or whole day (days off, holidays). */
export const blockTime = mutation({
  args: {
    token: v.string(),
    dateKey: v.string(),
    startTime: v.string(), // "HH:MM" Winnipeg; "00:00"–"23:59" = whole day
    endTime: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const startUtc = utcFromWpgDateAndTime(args.dateKey, args.startTime);
    const endUtc = utcFromWpgDateAndTime(args.dateKey, args.endTime);
    if (endUtc <= startUtc) throw new Error("End must be after start.");
    const id = await ctx.db.insert("calendarBlocks", {
      startUtc,
      endUtc,
      reason: args.reason,
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

/** Remove a block. */
export const removeBlock = mutation({
  args: { token: v.string(), blockId: v.id("calendarBlocks") },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    await ctx.db.delete(args.blockId);
    return { ok: true };
  },
});

export const listBlocks = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    return await ctx.db.query("calendarBlocks").collect();
  },
});

/** Owner notes. */
export const setOwnerNotes = mutation({
  args: { token: v.string(), bookingId: v.id("bookings"), notes: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    await ctx.db.patch(args.bookingId, {
      ownerNotes: args.notes.slice(0, 2000),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/** CSV export of all bookings. */
export const exportCsv = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.token);
    const rows = await ctx.db.query("bookings").collect();
    rows.sort((a, b) => a.createdAt - b.createdAt);
    const header = [
      "id","status","createdAt","name","email","phone","address","unit","city","postal",
      "sqft","bedrooms","fullBaths","halfBaths","homeType","service","frequency","addons",
      "condition","pests","pets","petsNote","entry","slotStartUtc","slotEndUtc","durationMinutes",
      "estFirstVisit","estPerVisit","configVersion","finalPrice","quoteRequired","needsReview",
      "pestReview","outsideArea","source","ownerNotes",
    ];
    const esc = (s: unknown) => {
      const str = String(s ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const lines = [header.join(",")];
    for (const b of rows) {
      lines.push(
        [
          b._id, b.status, new Date(b.createdAt).toISOString(),
          `${b.firstName} ${b.lastName}`.trim(), b.email, b.phone,
          b.addressStreet, b.addressUnit ?? "", b.addressCity, b.addressPostal,
          b.sqft, b.bedrooms, b.fullBaths, b.halfBaths, b.homeType,
          b.serviceType, b.frequency, b.addons.join("|"), b.condition,
          b.pests, b.pets, b.petsNote ?? "", b.entryMethod,
          b.slotStartUtc ?? "", b.slotEndUtc ?? "", b.durationMinutes ?? "",
          b.priceFirstVisit ?? "", b.pricePerVisit ?? "", b.configVersion ?? "",
          b.finalPrice ?? "", b.quoteRequired, b.needsReview, b.pestReview,
          b.outsideArea, b.source ?? "", b.ownerNotes ?? "",
        ].map(esc).join(","),
      );
    }
    return lines.join("\n");
  },
});

// ---------------------------------------------------------------------------
// 48h reminder sweep (optional feature; hourly cron)
// ---------------------------------------------------------------------------
export const sweepReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const window48h = now + 48 * 3600_000;
    const candidates = await ctx.db
      .query("bookings")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "confirmed"))
      .collect();
    let sent = 0;
    for (const b of candidates) {
      if (b.reminderSentAt != null) continue;
      if (b.slotStartUtc == null || b.slotStartUtc > window48h || b.slotStartUtc < now) continue;
      await ctx.db.patch(b._id, { reminderSentAt: now });
      await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyReminder, {
        bookingId: b._id,
      });
      sent++;
    }
    return { sent };
  },
});

// ---------------------------------------------------------------------------
// Cron sweep — hold expiry + expiry warnings (registered in crons.ts)
// ---------------------------------------------------------------------------
export const sweepExpiredHolds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let released = 0;
    const staleHolds = await ctx.db
      .query("slotHolds")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .collect();
    for (const h of staleHolds) {
      await ctx.db.delete(h._id);
      released++;
    }

    // Bookings whose owner-response window passed: release slot, email customer.
    const expired = await ctx.db
      .query("bookings")
      .withIndex("by_holdExpiresAt", (q) => q.lt("holdExpiresAt", now))
      .collect();
    for (const b of expired) {
      if (b.status !== "requested") continue;
      await releaseHoldsForBooking(ctx.db, b._id);
      await ctx.db.patch(b._id, {
        slotStartUtc: undefined,
        slotEndUtc: undefined,
        slotExpired: true,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifySlotExpired, {
        bookingId: b._id,
      });
    }

    // Owner warning 6h before expiry (placeholder interval).
    const warnWindow = now + 6 * 3600_000;
    const toWarn = await ctx.db
      .query("bookings")
      .withIndex("by_holdExpiresAt", (q) => q.lt("holdExpiresAt", warnWindow))
      .collect();
    for (const b of toWarn) {
      if (b.status !== "requested" || b.expiryAlertedAt != null) continue;
      await ctx.db.patch(b._id, { expiryAlertedAt: now });
      await ctx.scheduler.runAfter(0, internal.bookingNotifications.notifyExpiryWarning, {
        bookingId: b._id,
      });
    }
    return { released, expired: expired.length };
  },
});
