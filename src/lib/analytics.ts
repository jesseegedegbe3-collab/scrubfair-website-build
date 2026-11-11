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
 * True on phones and tablets: a device that can hand a `tel:` link to the
 * phone app. Desktops report a fine pointer (and no mobile UA), so they get
 * sent to the contact page instead of a dead click.
 */
function canPlaceCall(): boolean {
  if (typeof window === "undefined") return false;
  const coarsePointer =
    window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const mobileUA = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Mobile/i.test(
    navigator.userAgent ?? "",
  );
  return coarsePointer || mobileUA;
}

/**
 * Install the global tel: handler. It
 *   1. reports every call tap for ad tracking, and
 *   2. on desktop — where there is no dialer and a `tel:` link does nothing —
 *      sends the visitor to the contact page instead.
 * On phones the tap is left alone so the dialer opens with the business number.
 */
export function installCallTracking(): () => void {
  if (typeof document === "undefined") return () => {};
  const handler = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement | null)?.closest?.(
      'a[href^="tel:"]',
    ) as HTMLAnchorElement | null;
    if (!anchor) return;

    trackCallTap();

    // Mobile: let the browser open the dialer with the phone number.
    if (canPlaceCall()) return;

    // Desktop: no phone app exists, so go to the contact page.
    if (e.defaultPrevented || e.button !== 0) return;
    e.preventDefault();
    try {
      // In-app navigation so the page doesn't do a full reload.
      window.history.pushState({}, "", "/contact");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.assign("/contact");
    }
  };
  // passive: false — we need preventDefault() to stop the dead tel: navigation.
  document.addEventListener("click", handler, { passive: false });
  return () => document.removeEventListener("click", handler);
}
