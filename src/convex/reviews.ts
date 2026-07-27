"use node";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// Public customer reviews — ScrubFair
// ============================================================================
// On submit:
//   1. Persist the review to the `reviews` table (immediately public).
//   2. Send an email to the business via Resend, with the same
//      verified-domain auto-fallback used by the contact form: if the
//      `from` is on an unverified custom domain, retry with the verified
//      onboarding@resend.dev envelope so the business still gets the
//      notification.
//   3. Send a Telegram message to the business (if TELEGRAM_BOT_TOKEN and
//      TELEGRAM_CHAT_ID are set).
//
// Reviews publish immediately on submission (the business can delete any
// row manually from the Convex dashboard if needed).
// If either notification provider is missing, the action logs a warning
// and still returns success — the review is captured either way.
// ============================================================================

const NOTIFY_EMAIL = "contact@scrubfair.ca";
const RESEND_FALLBACK_FROM = "ScrubFair <onboarding@resend.dev>";

export const submitReview = action({
  args: {
    name: v.string(),
    neighbourhood: v.string(),
    service: v.union(
      v.literal("Standard Cleaning"),
      v.literal("Deep Cleaning"),
    ),
    rating: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
    ),
    body: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Persist first — never lose a review even if notifications fail.
    await ctx.runMutation(internal.reviewsInsert.saveReview, {
      name: args.name,
      neighbourhood: args.neighbourhood,
      service: args.service,
      rating: args.rating,
      body: args.body,
      source: args.source,
      now,
    });

    const warnings: string[] = [];
    let emailSent = false;
    let emailFromUsed: string | null = null;

    // 2. Email notification (Resend, with custom-domain auto-fallback)
    if (process.env.RESEND_API_KEY) {
      const configuredFrom =
        process.env.RESEND_FROM_EMAIL ?? RESEND_FALLBACK_FROM;
      const stars = "⭐".repeat(args.rating);
      const subject = `${stars} New ${args.rating}-star review from ${args.name} (${args.neighbourhood})`;
      const html = buildReviewEmailHtml(args);
      const text = buildReviewEmailText(args);

      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const result = await resend.emails.send({
          from: configuredFrom,
          to: NOTIFY_EMAIL,
          subject,
          html,
          text,
        });
        if ((result as { error?: { message?: string } }).error) {
          const e = (result as {
            error?: { message?: string; statusCode?: number };
          }).error!;
          throw new Error(
            `[${e.statusCode ?? "ERR"}] ${e.message ?? "unknown error"}`,
          );
        }
        emailSent = true;
        emailFromUsed = configuredFrom;
        if (configuredFrom === RESEND_FALLBACK_FROM) {
          warnings.push(
            "email: sent from default Resend domain (onboarding@resend.dev) — verify scrubfair.ca in your Resend dashboard to send as contact@scrubfair.ca",
          );
        }
      } catch (rawErr) {
        const msg = errText(rawErr);
        if (
          configuredFrom !== RESEND_FALLBACK_FROM &&
          isDomainNotVerified(msg)
        ) {
          console.warn(
            "[reviews] Resend rejected configured from (domain not verified) — retrying with onboarding@resend.dev:",
            msg,
          );
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY!);
            const fb = await resend.emails.send({
              from: RESEND_FALLBACK_FROM,
              to: NOTIFY_EMAIL,
              subject,
              html,
              text,
            });
            if ((fb as { error?: { message?: string } }).error) {
              const e = (fb as {
                error?: { message?: string; statusCode?: number };
              }).error!;
              throw new Error(
                `[fallback ${e.statusCode ?? "ERR"}] ${e.message ?? "unknown error"}`,
              );
            }
            emailSent = true;
            emailFromUsed = RESEND_FALLBACK_FROM;
            warnings.push(
              `email: configured from address "${configuredFrom}" failed (domain not verified) — sent via onboarding@resend.dev fallback. Verify scrubfair.ca in your Resend dashboard.`,
            );
          } catch (fbErr) {
            const fbMsg = errText(fbErr);
            console.warn("[reviews] Resend fallback also failed:", fbMsg);
            warnings.push(
              `email: primary "${configuredFrom}" rejected (domain not verified), and fallback onboarding@resend.dev also failed: ${fbMsg}`,
            );
          }
        } else {
          console.warn("[reviews] Resend send failed:", msg);
          warnings.push(`email: ${msg}`);
        }
      }
    } else {
      console.warn(
        "[reviews] RESEND_API_KEY not set — email notification skipped.",
      );
      warnings.push("email: RESEND_API_KEY not configured in Convex env");
    }

    // 3. Telegram notification
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      try {
        const text = buildReviewTelegramText(args);
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const resp = await fetch(url, {
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
          const errMsg = data?.description ?? `HTTP ${resp.status}`;
          console.warn("[reviews] Telegram send failed:", errMsg);
          warnings.push(`telegram: ${errMsg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[reviews] Telegram send failed:", msg);
        warnings.push(`telegram: ${msg}`);
      }
    } else {
      console.warn(
        "[reviews] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — Telegram notification skipped.",
      );
      warnings.push(
        "telegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured",
      );
    }

    return { success: true, emailSent, emailFromUsed, warnings };
  },
});

// ----------------------------------------------------------------------------
// Error helpers (kept in sync with contact.ts)
// ----------------------------------------------------------------------------

function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isDomainNotVerified(message: string): boolean {
  const m = message.toLowerCase();
  return (
    (m.includes("domain") && m.includes("verif")) ||
    m.includes("domain_not_verified") ||
    m.includes("not verified") ||
    m.includes("unverified domain")
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

type ReviewArgs = {
  name: string;
  neighbourhood: string;
  service: "Standard Cleaning" | "Deep Cleaning";
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  source?: string;
};

function buildReviewEmailText(r: ReviewArgs): string {
  return [
    `New ScrubFair customer review`,
    ``,
    `Rating: ${r.rating}/5`,
    `Service: ${r.service}`,
    `Name: ${r.name}`,
    `Neighbourhood: ${r.neighbourhood}`,
    r.source ? `Source: ${r.source}` : null,
    ``,
    `Review:`,
    r.body,
    ``,
    `To remove this review, open Convex \u2192 reviews table \u2192 delete this row.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildReviewEmailHtml(r: ReviewArgs): string {
  const safe = (s: string) =>
    s.replace(/[&<>"]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
    );
  const stars = "\u2605".repeat(r.rating) + "\u2606".repeat(5 - r.rating);
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 4px;color:#0f172a;">New customer review</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Submitted via scrubfair.ca</p>
      <div style="font-size:24px;color:#5CC0E8;letter-spacing:4px;margin-bottom:8px;">${stars}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;">Service</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${safe(r.service)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;">Name</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${safe(r.name)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;">Neighbourhood</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${safe(r.neighbourhood)}</td></tr>
      </table>
      <div style="background:#f5fbfe;border:1px solid #e2e8f0;border-radius:8px;padding:14px;white-space:pre-wrap;color:#0f172a;font-size:14px;">${safe(r.body)}</div>
      <p style="margin-top:16px;color:#94a3b8;font-size:12px;">This review published immediately. To remove it, open the <code>reviews</code> table in the Convex dashboard and delete this row.</p>
    </div>
  `;
}

function buildReviewTelegramText(r: ReviewArgs): string {
  const safe = (s: string) =>
    s.replace(/[&<>]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
    );
  const stars = "⭐".repeat(r.rating);
  const body = r.body.length > 800 ? r.body.slice(0, 797) + "..." : r.body;
  return [
    `<b>${stars} New ${r.rating}-star review</b>`,
    ``,
    `<b>Service:</b> ${safe(r.service)}`,
    `<b>Name:</b> ${safe(r.name)}`,
    `<b>Neighbourhood:</b> ${safe(r.neighbourhood)}`,
    ``,
    `<b>Review:</b>`,
    safe(body),
  ].join("\n");
}
