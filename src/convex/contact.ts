"use node";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// Contact form submissions — ScrubFair
// ============================================================================
// On submit:
//   1. Persist the submission to the `contactSubmissions` table (always).
//   2. Send an email to the business via Resend (if RESEND_API_KEY is set).
//   3. Send an SMS to the business via Twilio (if TWILIO_* env vars are set).
//
// If Resend / Twilio credentials are missing in the environment, the action
// logs a warning and still returns success — the form works in dev/preview
// and the submission is captured for follow-up. This keeps the public form
// usable before the business finishes wiring up the email + SMS providers.
// ============================================================================

const NOTIFY_EMAIL = "evelynegedegbe3@gmail.com";
const NOTIFY_SMS = "+12049528685"; // 204-952-8685

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

    const hasResend = !!process.env.RESEND_API_KEY;
    const hasTwilio =
      !!process.env.TWILIO_ACCOUNT_SID &&
      !!process.env.TWILIO_AUTH_TOKEN &&
      !!process.env.TWILIO_FROM_NUMBER;

    const warnings: string[] = [];

    // 2. Send email via Resend (if configured)
    if (hasResend) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const subject = `New quote request from ${args.name}`;
        const html = buildEmailHtml(args);
        const text = buildEmailText(args);
        const fromAddress =
          process.env.RESEND_FROM_EMAIL ?? "ScrubFair <onboarding@resend.dev>";

        await resend.emails.send({
          from: fromAddress,
          to: NOTIFY_EMAIL,
          replyTo: args.email,
          subject,
          html,
          text,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[contact] Resend send failed:", msg);
        warnings.push(`email: ${msg}`);
      }
    } else {
      console.warn(
        "[contact] RESEND_API_KEY not set \u2014 email notification skipped.",
      );
      warnings.push("email: credentials not configured");
    }

    // 3. Send SMS via Twilio (if configured)
    if (hasTwilio) {
      try {
        const twilioModule = await import("twilio");
        const twilio = twilioModule.default(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );
        const smsBody = buildSmsText(args);
        await twilio.messages.create({
          from: process.env.TWILIO_FROM_NUMBER,
          to: NOTIFY_SMS,
          body: smsBody,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[contact] Twilio send failed:", msg);
        warnings.push(`sms: ${msg}`);
      }
    } else {
      console.warn(
        "[contact] Twilio credentials not set \u2014 SMS notification skipped.",
      );
      warnings.push("sms: credentials not configured");
    }

    return {
      success: true,
      emailSent: hasResend && !warnings.some((w) => w.startsWith("email:")),
      smsSent: hasTwilio && !warnings.some((w) => w.startsWith("sms:")),
      warnings,
    };
  },
});

// ----------------------------------------------------------------------------
// Helpers
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
        args.phone ?? "\u2014",
      )}${args.source ? row("Source", args.source) : ""}</table>
      <div style="background:#f5fbfe;border:1px solid #e2e8f0;border-radius:8px;padding:14px;white-space:pre-wrap;color:#0f172a;font-size:14px;">${safe(
        args.message,
      )}</div>
    </div>
  `;
}

function buildSmsText(args: {
  name: string;
  message: string;
}): string {
  const summary = args.message.trim().replace(/\s+/g, " ");
  const truncated =
    summary.length > 140 ? summary.slice(0, 137) + "..." : summary;
  return `ScrubFair: new lead from ${args.name} \u2014 "${truncated}"`;
}
