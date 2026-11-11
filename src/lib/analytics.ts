// ============================================================================
// Google Ads / analytics events (spec §1)
// ============================================================================
// The site loads gtag.js with AW-11192599006 (index.html). We fire:
//   - "generate_lead" + the Ads conversion on successful booking submission
//   - "call_tapped" whenever any tel: link is clicked anywhere on the site
//
// OWNER TODO (2 minutes, no code): in Google Ads → Goals → Conversions, the
// conversion action for form sends must exist with its label. Put the label
// string in ADS_CONVERSION_LABEL below (format like "AbCd-EfGhIjKlMnOpQr").
// Until then the gtag('event','conversion') call is skipped but
// gtag('event','generate_lead') still fires so GA4/Ads sees the lead.
// ============================================================================

import { toast } from "sonner";
import { BRAND } from "./brand";

export const ADS_CONVERSION_ID = "AW-11192599006";

/** Google Ads conversion label for booking submissions. [OWNER: fill in] */
export const ADS_CONVERSION_LABEL = "";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

function gtag(): GtagFn | undefined {
  return typeof window !== "undefined" ? window.gtag : undefined;
}

/** Fire the Ads conversion + a generic lead event (booking submit success). */
export function trackBookingConversion(value?: number): void {
  const g = gtag();
  if (!g) return;
  try {
    g("event", "generate_lead", {
      currency: "CAD",
      value: value ?? undefined,
      transport_type: "beacon",
    });
    if (ADS_CONVERSION_LABEL) {
      g("event", "conversion", {
        send_to: `${ADS_CONVERSION_ID}/${ADS_CONVERSION_LABEL}`,
        value: value ?? undefined,
        currency: "CAD",
        transport_type: "beacon",
      });
    }
  } catch {
    /* analytics must never break the UX */
  }
}

/** Fired on every tel: tap, anywhere on the site. */
export function trackCallTap(): void {
  const g = gtag();
  if (!g) return;
  try {
    g("event", "call_tapped", { transport_type: "beacon" });
  } catch {
    /* no-op */
  }
}

/**
 * True on devices without a phone app (desktop). A `tel:` link there does
 * nothing at all, so we add a visible fallback instead of a dead button.
 */
function hasNoDialer(): boolean {
  if (typeof window === "undefined") return false;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return !coarsePointer;
}

/** Desktop fallback for tel: links — show the number and copy it. */
function showCallFallback(number: string): void {
  const message = `Call us at ${number}`;
  const clipboard = navigator.clipboard;
  if (!clipboard?.writeText) {
    toast(message);
    return;
  }
  void clipboard.writeText(number).then(
    () =>
      toast.success(message, {
        description: "Number copied to your clipboard.",
      }),
    () => toast(message, { description: "Tap to dial from your phone." }),
  );
}

/** Install a global click listener that reports every tel: link tap. */
export function installCallTracking(): () => void {
  if (typeof document === "undefined") return () => {};
  const handler = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement | null)?.closest?.(
      'a[href^="tel:"]',
    ) as HTMLAnchorElement | null;
    if (!anchor) return;
    trackCallTap();
    if (!hasNoDialer()) return;
    showCallFallback(BRAND.phone);
  };
  document.addEventListener("click", handler, { passive: true });
  return () => document.removeEventListener("click", handler);
}
