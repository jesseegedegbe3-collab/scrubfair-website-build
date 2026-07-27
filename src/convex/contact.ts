"use node";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// Contact form submissions — ScrubFair
// ============================================================================
// On submit:
//   1. Persist the submission to the `contactSubmissions` table (always).
//   2. Send an email to the business via Resend, with an automatic verified-
//      domain fallback: if the configured `from` address is on a custom
//      domain (e.g. contact@scrubfair.ca) that has not been verified in the
//      Resend dashboard, Resend rejects the send with a 403 — we catch that
//      and retry with the verified-by-default `ScrubFair
//      <onboarding@resend.dev>` envelope so the business still receives the
//      notification. A warning string is included in the response so the
//      client can show "we emailed you, but please verify scrubfair.ca in
//      Resend".
//   3. Send a Telegram message to the business (if TELEGRAM_BOT_TOKEN and
//      TELEGRAM_CHAT_ID are set).
//
// If Resend / Telegram credentials are missing in the environment, the
// action logs a warning and still returns success — the form works in
// dev/preview and the submission is captured for follow-up. This keeps the
// public form usable before the business finishes wiring up the email +
// chat providers.
// ============================================================================

const NOTIFY_EMAIL = "contact@scrubfair.ca";

// The verified-by-default Resend sender envelope. Used as the `from` when
// the business hasn't yet verified their own sending domain, so the
// notification still reaches the business.
const RESEND_FALLBACK_FROM = "ScrubFair <onboarding@resend.dev>";

export const submitContactForm = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Always persist the submission so we don't lose leads even if the
    //    email / SMS providers are not yet configured.
    await ctx.runMutation(internal.contactSubmissions.saveSubmission, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      message: args.message,
      source: args.source,
      now,
    });

    const warnings: string[] = [];
    let emailSent = false;
    let emailFromUsed: string | null = null;

    // 2. Send email via Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      const configuredFrom =
        process.env.RESEND_FROM_EMAIL ?? RESEND_FALLBACK_FROM;

      const subject = `New quote request from ${args.name}`;
      const html = buildEmailHtml(args);
      const text = buildEmailText(args);

      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const result = await resend.emails.send({
          from: configuredFrom,
          to: NOTIFY_EMAIL,
          replyTo: args.email,
          subject,
          html,
          text,
        });

        if ((result as { error?: { message?: string } }).error) {
          // Resend returned a structured error envelope.
          const errObj = (result as {
            error?: { message?: string; statusCode?: number };
          }).error!;
          throw new Error(
            `[${errObj.statusCode ?? "ERR"}] ${errObj.message ?? "unknown error"}`,
          );
        }

        emailSent = true;
        emailFromUsed = configuredFrom;

        // If we ended up using the fallback envelope, record an *informational*
        // (not failure) warning so the business knows their custom domain
        // wasn't used — but the email did go through.
        if (configuredFrom === RESEND_FALLBACK_FROM) {
          warnings.push(
            "email: sent from default Resend domain (onboarding@resend.dev) — verify scrubfair.ca in your Resend dashboard to send as contact@scrubfair.ca",
          );
        }
      } catch (rawErr) {
        const msg = errText(rawErr);

        // Auto-fallback: if the configured from address failed because the
        // sending domain isn't verified on Resend, retry with the verified
        // onboarding@resend.dev envelope so the business still gets the
        // notification.
        if (
          configuredFrom !== RESEND_FALLBACK_FROM &&
          isDomainNotVerified(msg)
        ) {
          console.warn(
            "[contact] Resend rejected configured from address (domain not verified) — retrying with onboarding@resend.dev:",
            msg,
          );
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY!);
            const fallback = await resend.emails.send({
              from: RESEND_FALLBACK_FROM,
              to: NOTIFY_EMAIL,
              replyTo: args.email,
              subject,
              html,
              text,
            });
            if (
              (fallback as { error?: { message?: string } }).error
            ) {
              const e = (fallback as {
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
            console.warn("[contact] Resend fallback also failed:", fbMsg);
            warnings.push(
              `email: primary "${configuredFrom}" rejected (domain not verified), and fallback onboarding@resend.dev also failed: ${fbMsg}`,
            );
          }
        } else {
          console.warn("[contact] Resend send failed:", msg);
          warnings.push(`email: ${msg}`);
        }
      }
    } else {
      console.warn(
        "[contact] RESEND_API_KEY not set — email notification skipped.",
      );
      warnings.push("email: RESEND_API_KEY not configured in Convex env");
    }

    // 3. Send Telegram message (if configured)
    const hasTelegram =
      !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;

    if (hasTelegram) {
      try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const text = buildTelegramText(args);
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
          console.warn("[contact] Telegram send failed:", errMsg);
          warnings.push(`telegram: ${errMsg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[contact] Telegram send failed:", msg);
        warnings.push(`telegram: ${msg}`);
      }
    } else {
      console.warn(
        "[contact] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — Telegram notification skipped.",
      );
      warnings.push(
        "telegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured",
      );
    }

    return {
      success: true,
      emailSent,
      emailFromUsed,
      telegramSent:
        hasTelegram && !warnings.some((w) => w.startsWith("telegram:")),
      warnings,
    };
  },
});

// ----------------------------------------------------------------------------
// Error helpers
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

// Resend returns a 403 with a message mentioning the domain name when the
// `from` address is on a domain the customer hasn't verified yet. We treat
// any 403/422/validation error that mentions "domain" and "verif" as a
// fallback trigger.
function isDomainNotVerified(message: string): boolean {
  const m = message.toLowerCase();
  // Common shapes:
  //   "The scrubfair.ca domain is not verified..."
  //   "validation_error: from address not verified"
  //   "[403] domain_not_verified"
  return (
    (m.includes("domain") && m.includes("verif")) ||
    m.includes("domain_not_verified") ||
    m.includes("not verified") ||
    m.includes("unverified domain")
  );
}

// ----------------------------------------------------------------------------
// Email + Telegram body builders
// ----------------------------------------------------------------------------

function buildEmailText(args: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}): string {
  return [
    `New ScrubFair quote request`,
    ``,
    `Name: ${args.name}`,
    `Email: ${args.email}`,
    `Phone: ${args.phone ?? "(not provided)"}`,
    args.source ? `Source: ${args.source}` : null,
    ``,
    `Message:`,
    args.message,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildEmailHtml(args: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}): string {
  const safe = (s: string) =>
    s.replace(/[&<>"]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
    );
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#0f172a;font-size:14px;">${safe(value)}</td>
    </tr>`;
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 4px;color:#0f172a;">New quote request</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Submitted via scrubfair.ca</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${row(
        "Name",
        args.name,
      )}${row("Email", args.email)}${row(
        "Phone",
        args.phone ?? "—",
      )}${args.source ? row("Source", args.source) : ""}</table>
      <div style="background:#f5fbfe;border:1px solid #e2e8f0;border-radius:8px;padding:14px;white-space:pre-wrap;color:#0f172a;font-size:14px;">${safe(
        args.message,
      )}</div>
    </div>
  `;
}

function buildTelegramText(args: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}): string {
  // Telegram HTML mode only requires & < > to be escaped in user-provided text.
  const safe = (s: string) =>
    s.replace(/[&<>]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
    );
  const parts = [
    "<b>New ScrubFair quote request</b>",
    "",
    `<b>Name:</b> ${safe(args.name)}`,
    `<b>Email:</b> ${safe(args.email)}`,
    `<b>Phone:</b> ${args.phone ? safe(args.phone) : "—"}`,
  ];
  if (args.source) parts.push(`<b>Source:</b> ${safe(args.source)}`);
  parts.push("", "<b>Message:</b>", safe(args.message));
  // Telegram's hard limit is 4096 chars per message; trim defensively.
  const text = parts.join("\n");
  return text.length > 4000 ? text.slice(0, 3997) + "..." : text;
}
