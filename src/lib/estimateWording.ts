// ============================================================================
// Estimate wording rules (spec §3b) — apply everywhere a price appears
// ============================================================================
// Every price on the site, in emails, in the Telegram message and on the
// admin page must be labelled "Estimated". Never call it a "final price",
// "total" or "booking confirmed" until the owner confirms it in the admin
// page.
// ============================================================================

/** CAD currency formatting, no cents when whole. */
export function cad(n: number): string {
  return n % 1 === 0
    ? `$${n.toLocaleString("en-CA")}`
    : `$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const ESTIMATE_NOTICE =
  "This is an estimated quote based on the details you entered. ScrubFair confirms the final price before your booking is final.";

export const ESTIMATE_DIFFERENCE_NOTE =
  "The final price may differ if your home's details are different from what you entered.";

export const TAX_NOTE = "Taxes added if applicable.";

export const QUOTE_REQUIRED_TEXT = "Call or message us for a quote";

/** Standard side-by-side notice shown directly beside the price (Step 4). */
export const ESTIMATE_SIDE_NOTICE =
  "This is an estimate based on the details you entered, not a final price. ScrubFair will review your request and confirm the final price before your booking is final.";

export const RECURRING_NOTE =
  "We will confirm your recurring day and time with you.";

export const ADDON_NOTE =
  "Add-ons apply to your first visit. For add-ons on every recurring visit, we will confirm by phone.";

/** "Estimated first visit: $X" / "Estimated per visit: $Y" */
export function estimatedFirstVisit(price: number): string {
  return `Estimated first visit: ${cad(price)}`;
}

export function estimatedPerVisit(price: number): string {
  return `Estimated per visit: ${cad(price)}`;
}

export function estimatedPrice(price: number): string {
  return `Estimated: ${cad(price)}`;
}
