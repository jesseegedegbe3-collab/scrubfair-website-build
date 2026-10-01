// ============================================================================
// ScrubFair pricing engine — SINGLE SOURCE OF TRUTH
// ============================================================================
// ⚠️ OWNER-EDITABLE FILE. Tune any number below without touching logic.
// ⚠️ Every coefficient is a market-derived ESTIMATE, modelled from limited
//    data. Every price shown anywhere (site, emails, Telegram, admin) must be
//    labelled "Estimated" — see src/lib/estimateWording.ts.
//
// configVersion: bump this whenever you change a number below. The version is
// snapshotted onto each booking so you can always see which pricing table
// produced a quote.
// ============================================================================

export const PRICING = {
  configVersion: "2026-09-v1",
  // --- Core signal (per one-team standard-clean job) -------------------------
  base: 99.27,
  perSqft: 0.2435,
  perBed: 20,
  perFull: 25,
  perHalf: 12,
  // Complexity multiplier by home type (stairs/stories add work).
  homeType: {
    apartment: 1.0,
    bungalow: 1.0,
    split_level: 1.05,
    bi_level: 1.05,
    story_1_5: 1.05,
    story_2: 1.1,
    story_2_5: 1.15,
  },
  // Recurring per-visit discount, applied to the initial price.
  // weekly: -30%, biweekly: -33.1%, monthly: -42%.
  frequency: { weekly: 0.3, biweekly: 0.331, monthly: 0.42 },
  // Positioning discount vs. established competitors.
  discount: 0.8,
  // Minimums so tiny jobs are still worth the trip.
  minInitial: 150,
  minRecurring: 100,
  // Flat per add-on (first visit only).
  addon: 32,
  // Validation limits — outside these the engine returns null and the UI says
  // "Call or message us for a quote" (quote_required flow).
  limits: {
    sqftMin: 300,
    sqftMax: 4000,
    bedMax: 6,
    fullMin: 1,
    fullMax: 5,
    halfMax: 3,
  },
} as const;

export type PricingConfig = typeof PRICING;

export type HomeTypeKey = keyof PricingConfig["homeType"];
export type FrequencyKey = keyof PricingConfig["frequency"];

export interface EstimateInput {
  sqft: number;
  bedrooms: number;
  fullBaths: number;
  halfBaths: number;
  homeType: string;
  /** undefined / null / "none" = one-time clean */
  frequency?: string | null;
  /** add-on ids, e.g. ["inside_fridge", "inside_oven"] */
  addons?: readonly string[];
}

export interface EstimateResult {
  /** Price of the first visit, including first-visit add-ons. */
  firstVisit: number;
  /** Price per visit AFTER the first (recurring only), else null. */
  perVisit: number | null;
  configVersion: string;
}

/**
 * Pure pricing function. Returns null for any input outside the configured
 * limits or with an unknown home type — the caller must then show
 * "Call or message us for a quote" and let the customer submit a
 * quote_required request.
 */
export function estimate(
  i: EstimateInput,
  P: PricingConfig = PRICING,
): EstimateResult | null {
  const L = P.limits;
  const bad =
    !(i.homeType in P.homeType) ||
    !(i.sqft >= L.sqftMin && i.sqft <= L.sqftMax) ||
    !(i.bedrooms >= 0 && i.bedrooms <= L.bedMax) ||
    !(i.fullBaths >= L.fullMin && i.fullBaths <= L.fullMax) ||
    !(i.halfBaths >= 0 && i.halfBaths <= L.halfMax);
  if (bad) return null; // UI shows "call for a quote"

  const sig =
    (P.base +
      P.perSqft * i.sqft +
      P.perBed * i.bedrooms +
      P.perFull * i.fullBaths +
      P.perHalf * i.halfBaths) *
    P.homeType[i.homeType as HomeTypeKey];

  const initial = Math.max(sig * P.discount, P.minInitial);
  const addons = P.addon * (i.addons?.length || 0); // first visit only
  const freqKey =
    i.frequency && i.frequency !== "none" && i.frequency in P.frequency
      ? (i.frequency as FrequencyKey)
      : null;
  const rec = freqKey
    ? Math.max(initial * P.frequency[freqKey], P.minRecurring)
    : null;

  return {
    firstVisit: Math.round(initial + addons),
    perVisit: rec === null ? null : Math.round(rec),
    configVersion: P.configVersion,
  };
}

// ---------------------------------------------------------------------------
// Home details form helpers (shared by the booking wizard)
// ---------------------------------------------------------------------------

/** Size buckets for customers who don't know their square footage. */
export const SQFT_BUCKETS = [
  { label: "Under 700 sq ft", value: 550 },
  { label: "700 – 1,000 sq ft", value: 850 },
  { label: "1,000 – 1,400 sq ft", value: 1200 },
  { label: "1,400 – 1,800 sq ft", value: 1600 },
  { label: "1,800 – 2,400 sq ft", value: 2100 },
  { label: "2,400 – 3,000 sq ft", value: 2700 },
  { label: "3,000 – 4,000 sq ft", value: 3500 },
] as const;

export const HOME_TYPE_OPTIONS = [
  { value: "bungalow", label: "Bungalow" },
  { value: "story_1_5", label: "1.5 storey" },
  { value: "story_2", label: "2 storey" },
  { value: "story_2_5", label: "2.5 storey" },
  { value: "apartment", label: "Apartment / condo" },
  { value: "split_level", label: "Split level" },
  { value: "bi_level", label: "Bi-level" },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "one_time", label: "One-time clean" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
] as const;

export const ADDON_OPTIONS = [
  { value: "basement_rec_room", label: "Basement / rec room cleaning" },
  { value: "inside_fridge", label: "Inside fridge" },
  { value: "inside_oven", label: "Inside oven" },
  { value: "window_washing", label: "Window washing" },
] as const;

export const CONDITION_OPTIONS = [
  {
    value: "maintained",
    label: "Regularly maintained",
    description: "Cleaned within the last few weeks.",
  },
  {
    value: "months",
    label: "Several months since last clean",
    description: "Noticeable buildup in some areas.",
  },
  {
    value: "year_plus",
    label: "Over a year, or heavily soiled",
    description: "A real reset is needed.",
  },
] as const;

/** Frequency values that mean "recurring" (perVisit shown). */
export function isRecurring(freq: string | null | undefined): boolean {
  return !!freq && freq in PRICING.frequency;
}
