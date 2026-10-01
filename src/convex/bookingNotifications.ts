// ============================================================================
// Booking notifications — Resend email + Telegram, scheduled after commit
// ============================================================================
// Fired via ctx.scheduler.runAfter(0, ...) from booking mutations so the
// booking is ALWAYS saved first; provider failures never lose a request.
// Every email send is retried once; failures are logged to console (visible
// in the Convex dashboard logs) and surfaced in the admin page via status.
//
// OWNER ENV VARS (Convex dashboard → Settings → Environment Variables):
//   RESEND_API_KEY              (already configured)
//   RESEND_FROM_EMAIL           (optional; falls back to onboarding@resend.dev)
//   TELEGRAM_BOT_TOKEN          (already configured)
//   TELEGRAM_CHAT_ID            (already configured)
//   BOOKING_NOTIFY_EMAIL        (optional; defaults to NOTIFY_EMAIL below)
//   ADMIN_TOKEN                 (admin page secret)
// ============================================================================

import { v } from "convex/values";
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { AVAILABILITY, TIMEZONE } from "../config/availability";
import {
  cad,
  ESTIMATE_NOTICE,
  ESTIMATE_DIFFERENCE_NOTE,
  TAX_NOTE,
} from "../lib/estimateWording";
import { winnipegParts, winnipegDateKey } from "../lib/tz";
import { customerName } from "./bookingCore";

const NOTIFY_EMAIL = "contact@scrubfair.ca";
const NOTIFY_EMAIL_CC = "evelynegedegbe3@gmail.com";
const RESEND_FALLBACK_FROM = "ScrubFair <onboarding@resend.dev>";
const SITE_URL = "https://scrubfair.ca";

// ---------------------------------------------------------------------------
// Email transport with single retry + structured failure logging
// ---------------------------------------------------------------------------
// Failures are logged with [booking-notify] prefix — visible in the Convex
// dashboard → Logs — and surfaced to the owner via the admin page status.

async function sendEmailResilient(
  opts: {
    to: string;
    cc?: string[];
    replyTo?: string;
    subject: string;
    html: string;
    text: string;
  },
): Promise<{ sent: boolean; warning?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[booking-notify] RESEND_API_KEY not set — email skipped.");
    return { sent: false, warning: "RESEND_API_KEY not configured" };
  }
  const from = process.env.RESEND_FROM_EMAIL ?? RESEND_FALLBACK_FROM;

  let lastFailure: string | null = null;
  const attempt = async (fromAddr: string) => {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const result = await resend.emails.send({
      from: fromAddr,
      to: opts.to,
      cc: opts.cc,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    const err = (result as { error?: { message?: string; statusCode?: number } }).error;
    if (err) throw new Error(`[${err.statusCode ?? "ERR"}] ${err.message ?? "unknown"}`);
  };

  for (let i = 0; i < 2; i++) {
    try {
      await attempt(from);
      return { sent: true };
    } catch (rawErr) {
      const msg = rawErr instanceof Error ? rawErr.message : String(rawErr);
      console.warn(`[booking-notify] email attempt ${i + 1} failed:`, msg);
      lastFailure = msg;
      if (i === 0) continue; // single retry
      return { sent: false, warning: `email failed after retry: ${msg}` };
    }
  }
  return { sent: false, warning: `email failed: ${lastFailure ?? "unknown"}` };
}

/**
 * Customer SMS via a generic REST SMS provider.
 *
 * OWNER SETUP (optional — for customer text confirmations):
 *   SMS_API_KEY     — API key for the SMS provider (Telnyx recommended: pay-per-message, no monthly fee, Canadian numbers)
 *   SMS_FROM_NUMBER — your purchased SMS number in E.164 format, e.g. +12045550123
 * Uses Telnyx's REST API (https://developers.telnyx.com). To switch providers,
 * change the URL/payload in this one function.
 *
 * If not configured, the text is NOT lost: it is mirrored to the owner's
 * Telegram so they can send it manually and the customer still gets served.
 */
async function sendCustomerSms(
  phone: string,
  text: string,
): Promise<{ sent: boolean; warning?: string }> {
  const key = process.env.SMS_API_KEY;
  const from = process.env.SMS_FROM_NUMBER;
  if (!key || !from) {
    await sendTelegramResilient(
      `<b>📩 SMS not configured — send this manually to ${escTg(phone)}:</b>\n\n${escTg(text)}`,
    );
    return { sent: false, warning: "SMS_API_KEY/SMS_FROM_NUMBER not configured — mirrored to Telegram" };
  }
  const to = phone.startsWith("+") ? phone : `+1${phone.replace(/\D/g, "")}`;
  for (let i = 0; i < 2; i++) {
    try {
      const resp = await fetch("https://api.telnyx.com/v2/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to, from, text }),
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status} ${body.slice(0, 140)}`);
      }
      return { sent: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[booking-notify] sms attempt ${i + 1} failed:`, msg);
      if (i === 0) continue;
      await sendTelegramResilient(
        `<b>⚠️ SMS failed after retry for ${escTg(phone)} — send manually:</b>\n\n${escTg(text)}`,
      );
      return { sent: false, warning: `sms failed after retry: ${msg}` };
    }
  }
  return { sent: false, warning: "sms: unreachable" };
}

async function sendTelegramResilient(text: string): Promise<{ sent: boolean; warning?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[booking-notify] Telegram not configured — skipped.");
    return { sent: false, warning: "TELEGRAM_BOT_TOKEN/CHAT_ID not configured" };
  }
  for (let i = 0; i < 2; i++) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const data = (await resp.json().catch(() => null)) as
        | { ok?: boolean; description?: string }
        | null;
      if (!resp.ok || (data && data.ok === false)) {
        throw new Error(data?.description ?? `HTTP ${resp.status}`);
      }
      return { sent: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[booking-notify] telegram attempt ${i + 1} failed:`, msg);
      if (i === 0) continue;
      return { sent: false, warning: `telegram failed after retry: ${msg}` };
    }
  }
  return { sent: false, warning: "telegram failed: unknown" };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

function escTg(s: string): string {
  return s.replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );
}

const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard Cleaning",
  deep: "Deep Cleaning",
  move_in_out: "Move In / Move Out Cleaning",
  other: "Other (described in special requests)",
  manual: "Manual booking (phone)",
};

const HOME_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment / condo",
  bungalow: "Bungalow",
  split_level: "Split level",
  bi_level: "Bi-level",
  story_1_5: "1.5 storey",
  story_2: "2 storey",
  story_2_5: "2.5 storey",
};

const ENTRY_LABELS: Record<string, string> = {
  home: "I'll be home",
  key: "Key",
  lockbox: "Lockbox",
  other: "Other",
};

const ADDON_LABELS: Record<string, string> = {
  basement_rec_room: "Basement / rec room",
  inside_fridge: "Inside fridge",
  inside_oven: "Inside oven",
  window_washing: "Window washing",
};

export function fmtWpgDateTime(utcMs: number): string {
  const p = winnipegParts(utcMs);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const h12 = ((p.hour + 11) % 12) + 1;
  const ampm = p.hour < 12 ? "AM" : "PM";
  return `${days[dow]}, ${months[p.month - 1]} ${p.day}, ${p.year} at ${h12}:${String(p.minute).padStart(2, "0")} ${ampm} (${TIMEZONE.split("/")[1].replace("_", " ")} time)`;
}

/** The end of the booked window shown to customers (start + duration). */
export function fmtWpgWindow(startUtc: number, durationMinutes: number): string {
  const p = winnipegParts(startUtc);
  const endP = winnipegParts(startUtc + durationMinutes * 60_000);
  const h12 = ((p.hour + 11) % 12) + 1;
  const endH = ((endP.hour + 11) % 12) + 1;
  const ampm = p.hour < 12 ? "AM" : "PM";
  const endAmpm = endP.hour < 12 ? "AM" : "PM";
  return `${h12}:${String(p.minute).padStart(2, "0")} ${ampm} – ${endH}:${String(endP.minute).padStart(2, "0")} ${endAmpm}`;
}

export function fullAddress(b: {
  addressStreet: string;
  addressUnit?: string;
  addressCity: string;
  addressPostal: string;
}): string {
  return `${b.addressStreet}${b.addressUnit ? `, Unit ${b.addressUnit}` : ""}, ${b.addressCity}, ${b.addressPostal}`;
}

function flagsLine(b: { needsReview: boolean; pestReview: boolean; outsideArea: boolean; quoteRequired: boolean }): string {
  const f: string[] = [];
  if (b.needsReview) f.push("⚠️ NEEDS REVIEW (condition)");
  if (b.pestReview) f.push("🚨 PEST REVIEW (pests reported)");
  if (b.outsideArea) f.push("📍 OUTSIDE SERVICE AREA");
  if (b.quoteRequired) f.push("💬 QUOTE REQUIRED (no price)");
  return f.length ? f.join(" · ") : "None";
}

// ---------------------------------------------------------------------------
// Notification payloads
// ---------------------------------------------------------------------------

function ownerEmailHtml(b: any, kind: "requested" | "confirmed" | "declined" | "expired"): string {
  const rows: [string, string][] = [
    ["Status", kind === "requested" ? "NEW REQUEST (action needed)" : kind.toUpperCase()],
    ["Name", customerName(b)],
    ["Email", b.email],
    ["Phone", b.phone],
    ["Address", fullAddress(b)],
    ["Service", `${SERVICE_LABELS[b.serviceType] ?? b.serviceType} · ${b.frequency}`],
    ["Home", `${b.sqft} sq ft (excl. basement) · ${b.bedrooms} bed · ${b.fullBaths} full / ${b.halfBaths} half bath · ${HOME_TYPE_LABELS[b.homeType] ?? b.homeType}`],
    ["Condition", b.condition],
    ["Add-ons", b.addons.length ? b.addons.map((a: string) => ADDON_LABELS[a] ?? a).join(", ") : "None"],
    ["Pests (12 mo)", b.pests ? "🚨 YES — review before confirming" : "No"],
    ["Pets", b.pets ? `Yes — ${b.petsNote ?? "(no note)"}` : "No"],
    ["Entry", ENTRY_LABELS[b.entryMethod] ?? b.entryMethod],
    ["Estimated first visit", b.priceFirstVisit != null ? cad(b.priceFirstVisit) : "Quote required"],
    ...(b.pricePerVisit != null ? ([["Estimated per visit", cad(b.pricePerVisit)]] as [string, string][]) : []),
    ...(b.finalPrice != null ? ([["FINAL PRICE (owner-set)", cad(b.finalPrice)]] as [string, string][]) : []),
    ...(b.slotStartUtc != null ? ([["Requested slot", `${fmtWpgDateTime(b.slotStartUtc)} · ${fmtWpgWindow(b.slotStartUtc, b.durationMinutes ?? 0)}`]] as [string, string][]) : []),
    ...(b.specialRequests ? ([["Special requests", b.specialRequests]] as [string, string][]) : []),
    ["Flags", flagsLine(b)],
  ];
  return `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <h2 style="margin:0 0 4px;color:#0f172a;">ScrubFair booking — ${kind}</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">From scrubfair.ca /book</p>
    <table style="width:100%;border-collapse:collapse;">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${esc(v)}</td></tr>`).join("")}
    </table>
  </div>`;
}

function ownerEmailText(b: any, kind: string): string {
  return [
    `ScrubFair booking — ${kind}`,
    ``,
    `Name: ${customerName(b)}`,
    `Email: ${b.email}`,
    `Phone: ${b.phone}`,
    `Address: ${fullAddress(b)}`,
    `Service: ${SERVICE_LABELS[b.serviceType] ?? b.serviceType} · ${b.frequency}`,
    `Home: ${b.sqft} sq ft, ${b.bedrooms} bed, ${b.fullBaths} full / ${b.halfBaths} half, ${HOME_TYPE_LABELS[b.homeType] ?? b.homeType}`,
    `Condition: ${b.condition}`,
    `Add-ons: ${b.addons.length ? b.addons.map((a: string) => ADDON_LABELS[a] ?? a).join(", ") : "None"}`,
    `Pests (12mo): ${b.pests ? "YES — review" : "No"}`,
    `Pets: ${b.pets ? `Yes — ${b.petsNote ?? "(no note)"}` : "No"}`,
    `Entry: ${ENTRY_LABELS[b.entryMethod] ?? b.entryMethod}`,
    b.slotStartUtc != null ? `Requested slot: ${fmtWpgDateTime(b.slotStartUtc)}` : "Requested slot: none (quote required)",
    `Estimated first visit: ${b.priceFirstVisit != null ? cad(b.priceFirstVisit) : "Quote required"}`,
    b.pricePerVisit != null ? `Estimated per visit: ${cad(b.pricePerVisit)}` : null,
    b.finalPrice != null ? `FINAL PRICE: ${cad(b.finalPrice)}` : null,
    `Special requests: ${b.specialRequests ?? "(none)"}`,
    `Flags: ${flagsLine(b)}`,
  ].filter(Boolean).join("\n");
}

function ownerTelegram(b: any, kind: string): string {
  const parts = [
    `<b>🧽 ScrubFair — ${kind === "requested" ? "NEW BOOKING REQUEST" : kind.toUpperCase()}</b>`,
    ``,
    `<b>Who:</b> ${escTg(customerName(b))} — <b>${escTg(b.phone)}</b>`,
    `<b>Email:</b> ${escTg(b.email)}`,
    `<b>Where:</b> ${escTg(fullAddress(b))}`,
    `<b>What:</b> ${escTg(SERVICE_LABELS[b.serviceType] ?? b.serviceType)} · ${escTg(b.frequency)}`,
    `<b>Home:</b> ${b.sqft} sqft, ${b.bedrooms}bd, ${b.fullBaths}/${b.halfBaths}ba`,
    b.slotStartUtc != null
      ? `<b>Slot:</b> ${escTg(fmtWpgDateTime(b.slotStartUtc))}`
      : `<b>Slot:</b> none (quote required)`,
    `<b>Est. first visit:</b> ${b.priceFirstVisit != null ? cad(b.priceFirstVisit) : "quote required"}`,
    b.pricePerVisit != null ? `<b>Est. per visit:</b> ${cad(b.pricePerVisit)}` : null,
    b.finalPrice != null ? `<b>FINAL PRICE:</b> ${cad(b.finalPrice)}` : null,
    ``,
    `<b>Flags:</b> ${escTg(flagsLine(b))}`,
    b.specialRequests ? `<b>Notes:</b> ${escTg(b.specialRequests).slice(0, 400)}` : null,
  ].filter(Boolean);
  const text = parts.join("\n");
  return text.length > 4000 ? text.slice(0, 3997) + "..." : text;
}

// ---------------------------------------------------------------------------
// Scheduled actions (the booking mutation schedules these)
// ---------------------------------------------------------------------------

/** Owner + (quote-required only) customer notifications on a new request. */
export const notifyRequested = internalAction({
  args: { bookingId: v.id("bookings"), customerEmail: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const b = await ctx.runQuery(internal.bookings.getByIdInternal, { id: args.bookingId });
    if (!b) return;

    // Owner: email with every field.
    await sendEmailResilient({
      to: process.env.BOOKING_NOTIFY_EMAIL ?? NOTIFY_EMAIL,
      cc: [NOTIFY_EMAIL_CC],
      replyTo: b.email,
      subject: `[REQUEST] ${customerName(b)} — ${SERVICE_LABELS[b.serviceType] ?? b.serviceType}${b.slotStartUtc != null ? ` — ${winnipegDateKey(b.slotStartUtc)}` : " — quote req"}`,
      html: ownerEmailHtml(b, "requested"),
      text: ownerEmailText(b, "requested"),
    });

    // Owner: Telegram with phone first.
    await sendTelegramResilient(ownerTelegram(b, "requested"));

    // Customer email is only sent in the quote-required path (no instant
    // self-service confirmation). Otherwise notifyAutoConfirmed handles the
    // customer on their chosen channel and this would be a duplicate.
    if (args.customerEmail === true) {
      const estLine = b.priceFirstVisit != null
        ? `Estimated first visit: ${cad(b.priceFirstVisit)}${b.pricePerVisit != null ? `\nEstimated per visit after: ${cad(b.pricePerVisit)}` : ""}`
        : "We'll prepare a custom quote after reviewing your home's details.";
      const slotLine = "You did not select a time — we will propose one after reviewing your home.";
      await sendEmailResilient({
        to: b.email,
        subject: `We received your ScrubFair request — next steps`,
        html: customerRequestHtml(b, estLine, slotLine),
        text: [
          `Hi ${b.firstName},`,
          ``,
          `We received your cleaning request. The price below is an estimated quote based on the details you entered. This is not a confirmed booking yet.`,
          ``,
          estLine,
          ``,
          slotLine,
          ``,
          `What happens next: we review your request, confirm the final price by phone or email, and then your booking is final.`,
          ESTIMATE_DIFFERENCE_NOTE,
          TAX_NOTE,
          ``,
          `Questions? Call us at 204-952-8685 or reply to this email.`,
          ``,
          `— ScrubFair, Winnipeg`,
        ].join("\n"),
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Auto-confirmation (customer self-service booking)
// ---------------------------------------------------------------------------

/** Instant customer confirmation on their chosen channel + owner alert. */
export const notifyAutoConfirmed = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const b = await ctx.runQuery(internal.bookings.getByIdInternal, { id: args.bookingId });
    if (!b) return;
    const when = b.slotStartUtc != null
      ? `${fmtWpgDateTime(b.slotStartUtc)} (${fmtWpgWindow(b.slotStartUtc, b.durationMinutes ?? 0)})`
      : "a time we will arrange with you";
    const price = b.finalPrice != null ? cad(b.finalPrice) : "to be confirmed on site details";
    const reviewFlags: string[] = [];
    if (b.pestReview) reviewFlags.push("🚨 PESTS reported — review/call before the visit");
    if (b.needsReview) reviewFlags.push("⚠️ Heavy condition — check duration/price");
    if (b.outsideArea) reviewFlags.push("📍 OUTSIDE SERVICE AREA");
    if (b.quoteRequired) reviewFlags.push("💬 QUOTE REQUIRED — schedule manually");

    // 1. Customer — chosen channel only.
    if (b.confirmVia === "sms") {
      await sendCustomerSms(
        b.phone,
        `ScrubFair: Your cleaning is booked for ${fmtWpgDateTime(b.slotStartUtc ?? Date.now())}. Est. ${price}. Address: ${fullAddress(b)}. Questions? 204-952-8685.`,
      );
    } else {
      await sendEmailResilient({
        to: b.email,
        subject: `Your ScrubFair cleaning is booked — ${b.slotStartUtc != null ? winnipegDateKey(b.slotStartUtc) : "ScrubFair"}`,
        replyTo: process.env.BOOKING_NOTIFY_EMAIL ?? NOTIFY_EMAIL,
        html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <h2 style="color:#0f172a;">Your cleaning is booked, ${esc(b.firstName)}! 🎉</h2>
          <p style="color:#334155;font-size:14px;">This confirms your booking request has been received and your time is reserved.</p>
          <div style="background:#f5fbfe;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:14px;color:#0f172a;line-height:1.7;">
            <b>When:</b> ${esc(when)}<br/>
            <b>Where:</b> ${esc(fullAddress(b))}<br/>
            <b>Estimated price:</b> ${esc(price)}<br/>
          </div>
          <p style="color:#334155;font-size:13px;line-height:1.6;">
            The final price is confirmed on your home's actual details; we'll call before the visit if anything changes.<br/>
            ${esc(TAX_NOTE)}<br/>
            We'll call to arrange entry details (keys, codes, parking) — never send codes by email.<br/>
            Need to change or cancel? Call <b>204-952-8685</b> as soon as you can: [OWNER TO DECIDE — cancellation notice period and any fee].
          </p>
          <p style="color:#64748b;font-size:12px;">ScrubFair · Winnipeg, MB · scrubfair.ca</p>
        </div>`,
        text: [
          `Hi ${b.firstName}, your cleaning is booked.`,
          ``,
          `When: ${when}`,
          `Where: ${fullAddress(b)}`,
          `Estimated price: ${price}`,`,`,
          `We'll call to arrange entry details. To change or cancel: 204-952-8685.`,
          `— ScrubFair`,
        ].join("\n"),
      });
    }

    // 2. Owner — instant alert with review flags.
    const parts = [
      `<b>✅ ScrubFair — BOOKING AUTO-CONFIRMED</b>`,
      ``,
      `<b>Who:</b> ${escTg(customerName(b))} — <b>${escTg(b.phone)}</b>`,
      `<b>Email:</b> ${escTg(b.email)}`,`<b>Where:</b> ${escTg(fullAddress(b))}`,
      `<b>What:</b> ${escTg(SERVICE_LABELS[b.serviceType] ?? b.serviceType)} · ${escTg(b.frequency)}`,
      b.slotStartUtc != null ? `<b>Slot:</b> ${escTg(fmtWpgDateTime(b.slotStartUtc))}` : `<b>Slot:</b> none`,
      `<b>Est. price:</b> ${b.finalPrice != null ? cad(b.finalPrice) : "quote required"}`,
      ``,
      reviewFlags.length ? `<b>Review before the visit:</b>\n${escTg(reviewFlags.join("\n"))}` : `<b>Review before the visit:</b> None`,
    ].filter(Boolean);
    await sendTelegramResilient(parts.join("\n"));
  },
});

function customerRequestHtml(b: any, estLine: string, slotLine: string): string {
  return `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
    <h2 style="margin:0;color:#0f172a;">Thanks, ${esc(b.firstName)} — request received</h2>
    <p style="color:#334155;font-size:14px;line-height:1.6;">
      The price below is an <b>estimated quote</b> based on the details you entered.
      <b>This is not a confirmed booking yet.</b> Your requested date and time is being
      held for you while we review, and we will confirm your final price and time before booking.
    </p>
    <div style="background:#f5fbfe;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:14px;color:#0f172a;white-space:pre-line;">${esc(estLine)}\n${esc(slotLine)}</div>
    <p style="color:#334155;font-size:13px;line-height:1.6;">
      ${esc(ESTIMATE_NOTICE)}<br/>${esc(ESTIMATE_DIFFERENCE_NOTE)}<br/>${esc(TAX_NOTE)}
    </p>
    <p style="color:#334155;font-size:14px;">Questions? Call <b>204-952-8685</b> or reply to this email.</p>
    <p style="color:#64748b;font-size:12px;">ScrubFair · Winnipeg, MB · scrubfair.ca</p>
  </div>`;
}

/** Customer email on owner confirmation. */
export const notifyConfirmed = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const b = await ctx.runQuery(internal.bookings.getByIdInternal, { id: args.bookingId });
    if (!b) return;
    const when = b.slotStartUtc != null ? `${fmtWpgDateTime(b.slotStartUtc)} (${fmtWpgWindow(b.slotStartUtc, b.durationMinutes ?? 0)})` : "a time we'll confirm with you";
    const price = b.finalPrice != null ? cad(b.finalPrice) : b.priceFirstVisit != null ? `about ${cad(b.priceFirstVisit)} (estimated)` : "to be confirmed";
    await sendEmailResilient({
      to: b.email,
      subject: `Your cleaning is booked — ${b.slotStartUtc != null ? winnipegDateKey(b.slotStartUtc) : "ScrubFair"}`,
      html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <h2 style="color:#0f172a;">Your cleaning is booked 🎉</h2>
        <p style="color:#334155;font-size:14px;">Hi ${esc(b.firstName)}, your cleaning is confirmed.</p>
        <div style="background:#f5fbfe;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:14px;color:#0f172a;line-height:1.7;">
          <b>When:</b> ${esc(when)}<br/>
          <b>Where:</b> ${esc(fullAddress(b))}<br/>
          <b>Price:</b> ${esc(price)}<br/>
          <b>Entry:</b> ${esc(ENTRY_LABELS[b.entryMethod] ?? b.entryMethod)} — we'll call to arrange access details.
        </div>
        <p style="color:#334155;font-size:13px;line-height:1.6;">
          <b>Cancellation policy:</b> [OWNER TO FILL — notice period and any fee].
          Need to change something? Call 204-952-8685 as soon as you can.
        </p>
        <p style="color:#64748b;font-size:12px;">ScrubFair · Winnipeg, MB · scrubfair.ca</p>
      </div>`,
      text: [
        `Hi ${b.firstName}, your cleaning is booked.`,
        ``,
        `When: ${when}`,
        `Where: ${fullAddress(b)}`,
        `Price: ${price}`,
        ``,
        `Cancellation policy: [OWNER TO FILL]. Call 204-952-8685 to make changes.`,
        `— ScrubFair`,
      ].join("\n"),
    });
    await sendTelegramResilient(ownerTelegram(b, "confirmed"));
  },
});

/** Customer email on decline (polite, includes the phone number). */
export const notifyDeclined = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const b = await ctx.runQuery(internal.bookings.getByIdInternal, { id: args.bookingId });
    if (!b) return;
    await sendEmailResilient({
      to: b.email,
      subject: `About your ScrubFair request`,
      html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <h2 style="color:#0f172a;">About your request</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;">Hi ${esc(b.firstName)},
        unfortunately we're not able to take on your request at this time — either our schedule
        is full or the job isn't the right fit for us right now.</p>
        <p style="color:#334155;font-size:14px;">We're sorry we can't help this time. If you'd like to talk it through
        or ask about a future date, please call us at <b>204-952-8685</b> — we're happy to help if we can.</p>
        <p style="color:#64748b;font-size:12px;">ScrubFair · Winnipeg, MB</p>
      </div>`,
      text: `Hi ${b.firstName}, unfortunately we can't take on your request at this time. Call 204-952-8685 if you'd like to talk about a future date. — ScrubFair`,
    });
  },
});

/** Customer email when their held slot expired without owner action. */
export const notifySlotExpired = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const b = await ctx.runQuery(internal.bookings.getByIdInternal, { id: args.bookingId });
    if (!b) return;
    await sendEmailResilient({
      to: b.email,
      subject: `Please pick a new time for your cleaning`,
      html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <h2 style="color:#0f172a;">Let's find a new time</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;">Hi ${esc(b.firstName)},
        the time we were holding for your cleaning has been released because we weren't able to
        confirm it in time. Your request is still active — we just need a new time.</p>
        <p style="color:#334155;font-size:14px;">Pick any available time at
        <a href="${SITE_URL}/book" style="color:#5CC0E8;">scrubfair.ca/book</a>
        or call us at <b>204-952-8685</b> and we'll set it up together.</p>
        <p style="color:#64748b;font-size:12px;">ScrubFair · Winnipeg, MB</p>
      </div>`,
      text: `Hi ${b.firstName}, the time we held for your cleaning was released. Pick a new time at scrubfair.ca/book or call 204-952-8685. — ScrubFair`,
    });
  },
});

/** Owner pre-expiry alert (holdHours minus 6h, placeholder). */
export const notifyExpiryWarning = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const b = await ctx.runQuery(internal.bookings.getByIdInternal, { id: args.bookingId });
    if (!b) return;
    await sendTelegramResilient(
      `<b>⏰ ScrubFair request expiring soon</b>\n${escTg(customerName(b))} (${escTg(b.phone)}) — request will be released soon. Confirm or decline in the admin page.`,
    );
  },
});

/** 48-hour reminder for confirmed bookings. */
export const notifyReminder = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const b = await ctx.runQuery(internal.bookings.getByIdInternal, { id: args.bookingId });
    if (!b) return;
    const when = b.slotStartUtc != null
      ? `${fmtWpgDateTime(b.slotStartUtc)} (${fmtWpgWindow(b.slotStartUtc, b.durationMinutes ?? 0)})`
      : "your upcoming cleaning";
    await sendEmailResilient({
      to: b.email,
      subject: `Reminder: your ScrubFair cleaning is coming up`,
      html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <h2 style="color:#0f172a;">See you soon, ${esc(b.firstName)}!</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;">A friendly reminder that your ScrubFair cleaning is scheduled for <b>${esc(when)}</b> at ${esc(fullAddress(b))}.</p>
        <p style="color:#334155;font-size:14px;">Need to reschedule? Call <b>204-952-8685</b>.</p>
        <p style="color:#64748b;font-size:12px;">ScrubFair · Winnipeg, MB</p>
      </div>`,
      text: `Reminder: your ScrubFair cleaning is on ${when} at ${fullAddress(b)}. Call 204-952-8685 to make changes. — ScrubFair`,
    });
  },
});
