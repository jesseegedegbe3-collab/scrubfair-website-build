// ============================================================================
// /book — Quote-first booking wizard (spec §2)
// ============================================================================
// Steps: 1 Contact & address → 2 Home → 3 Service → 4 Estimate →
//        4b Date & time (skipped when quote_required) → 5 Questions → submit
//
// Key behaviors:
//  - Step 1 saves a lead (status "lead") so abandoned requests can be followed up.
//  - Outside-area addresses still save the lead flagged outside_area.
//  - The date/time picker comes AFTER the estimate (job length depends on home).
//  - Live reactive slot list: taken slots disappear without refresh (useQuery).
//  - 10-minute temp hold on slot pick; "just taken" message on collision.
//  - Honeypot + client & server validation; state preserved on errors.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { DateRange } from "react-day-picker";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Home as HomeIcon,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { BRAND } from "@/lib/brand";
import {
  ADDON_OPTIONS,
  CONDITION_OPTIONS,
  FREQUENCY_OPTIONS,
  HOME_TYPE_OPTIONS,
  SQFT_BUCKETS,
} from "@/config/pricing";
import {
  cad,
  ESTIMATE_DIFFERENCE_NOTE,
  ESTIMATE_SIDE_NOTICE,
  TAX_NOTE,
} from "@/lib/estimateWording";
import { TIMEZONE } from "../config/availability";
import { winnipegParts } from "../lib/tz";
import { trackBookingConversion } from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Types & client-side validation (mirrored server-side in bookings.ts)
// ---------------------------------------------------------------------------
type SqftSource = "exact" | "estimate";

interface WizardState {
  // Step 1
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  unit: string;
  city: string;
  postal: string;
  consent: boolean;
  // Step 2
  sqft: string;
  sqftBucket: string; // "" | value
  bedrooms: string;
  fullBaths: string;
  halfBaths: string;
  homeType: string;
  // Step 3
  serviceType: "standard" | "deep" | "move_in_out" | "commercial" | "showhomes" | "post_construction" | "carpet" | "other";
  frequency: "one_time" | "weekly" | "biweekly" | "monthly";
  addons: string[];
  condition: string;
  // Step 5
  pests: string; // "" | "yes" | "no"
  pets: string;
  petsNote: string;
  entryMethod: string;
  specialRequests: string;
  confirmVia: "email" | "sms";
}

const initialWizard: WizardState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  street: "",
  unit: "",
  city: "Winnipeg",
  postal: "",
  consent: false,
  sqft: "",
  sqftBucket: "",
  bedrooms: "",
  fullBaths: "1",
  halfBaths: "0",
  homeType: "",
  serviceType: "standard",
  frequency: "one_time",
  addons: [],
  condition: "",
  pests: "",
  pets: "",
  petsNote: "",
  entryMethod: "",
  specialRequests: "",
  confirmVia: "email",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
const PHONE_RE = /^[\d\s()+.-]{10,20}$/;

function step1Errors(s: WizardState): Partial<Record<keyof WizardState, string>> {
  const e: Partial<Record<keyof WizardState, string>> = {};
  if (s.firstName.trim().length < 2) e.firstName = "Enter your first name.";
  if (s.lastName.trim().length < 2) e.lastName = "Enter your last name.";
  if (!PHONE_RE.test(s.phone.trim())) e.phone = "Enter a valid phone number.";
  if (!EMAIL_RE.test(s.email.trim())) e.email = "Enter a valid email address.";
  if (s.street.trim().length < 4) e.street = "Enter your street address.";
  if (!POSTAL_RE.test(s.postal.trim())) e.postal = "Enter a postal code (e.g. R3P 0J4).";
  if (!s.consent) e.consent = "Please agree so we can contact you about this request.";
  return e;
}

function step2Errors(s: WizardState): Partial<Record<keyof WizardState, string>> {
  const e: Partial<Record<keyof WizardState, string>> = {};
  const sqftNum = parseInt(s.sqft, 10);
  if (!s.sqft && !s.sqftBucket) e.sqft = "Enter square footage or pick a size.";
  if (s.sqft && (!Number.isFinite(sqftNum) || sqftNum < 100 || sqftNum > 20000))
    e.sqft = "Enter a number between 100 and 20,000.";
  const beds = parseInt(s.bedrooms, 10);
  if (!Number.isFinite(beds) || beds < 0 || beds > 10) e.bedrooms = "Enter 0–10.";
  const full = parseInt(s.fullBaths, 10);
  if (!Number.isFinite(full) || full < 0 || full > 8) e.fullBaths = "Enter 0–8.";
  const half = parseInt(s.halfBaths, 10);
  if (!Number.isFinite(half) || half < 0 || half > 6) e.halfBaths = "Enter 0–6.";
  if (full === 0 && half === 0) e.fullBaths = "At least one bathroom is required.";
  if (!s.homeType) e.homeType = "Pick your home type.";
  return e;
}

const STEP_LABELS = ["Contact & address", "Your home", "Service", "Estimate", "Time", "Details"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Book() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [w, setW] = useState<WizardState>(initialWizard);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<Id<"bookings"> | null>(null);
  const [leadSaved, setLeadSaved] = useState(false);
  const [outsideArea, setOutsideArea] = useState(false);
  const [heldSlot, setHeldSlot] = useState<{ startUtc: number; timeKey: string; dateKey: string } | null>(null);
  const [slotJustTaken, setSlotJustTaken] = useState(false);
  const [holdFailReason, setHoldFailReason] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState(""); // hidden field
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);

  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setW((prev) => ({ ...prev, [k]: v }));

  // Resolved sqft: exact input wins; otherwise bucket midpoint.
  const resolvedSqft = useMemo(() => {
    const exact = parseInt(w.sqft, 10);
    if (Number.isFinite(exact) && exact > 0) return exact;
    const bucket = SQFT_BUCKETS.find((b) => String(b.value) === w.sqftBucket);
    return bucket ? bucket.value : 0;
  }, [w.sqft, w.sqftBucket]);

  const addonCount = w.addons.length;
  const deepClean = w.serviceType === "deep" || w.serviceType === "move_in_out";

  // Server-authoritative estimate (reactive).
  const estimateResult = useQuery(api.bookings.quoteFor, {
    sqft: resolvedSqft || 1, // placeholder when unknown; step gate prevents submit
    bedrooms: parseInt(w.bedrooms, 10) || 0,
    fullBaths: parseInt(w.fullBaths, 10) || 0,
    halfBaths: parseInt(w.halfBaths, 10) || 0,
    homeType: w.homeType || "bungalow",
    frequency: w.frequency,
    addons: w.addons,
    deepClean,
  });

  const durationMinutes = useQuery(api.bookings.durationFor, {
    sqft: resolvedSqft || 550,
    addonCount,
  });

  // Reactive availability.
  const bookableDates = useQuery(
    api.bookings.availableDates,
    step >= 5 && durationMinutes != null ? { durationMinutes } : "skip",
  );
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const daySlots = useQuery(
    api.bookings.availableSlots,
    step >= 5 && pickedDate && durationMinutes != null
      ? { dateKey: pickedDate, durationMinutes }
      : "skip",
  );

  const saveLead = useMutation(api.bookings.saveLead);
  const holdSlot = useMutation(api.bookings.holdSlot);
  const releaseHold = useMutation(api.bookings.releaseHold);
  const submitBooking = useMutation(api.bookings.submitBooking);

  // Clean up hold if the customer leaves mid-flow.
  useEffect(() => {
    return () => {
      if (leadId) void releaseHold({ bookingId: leadId }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function next1() {
    const e = step1Errors(w);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await saveLead({
        firstName: w.firstName,
        lastName: w.lastName,
        email: w.email,
        phone: w.phone,
        addressStreet: w.street,
        addressUnit: w.unit || undefined,
        addressCity: w.city,
        addressPostal: w.postal,
        consent: w.consent,
        source: "website",
      });
      setLeadId(res.bookingId);
      setLeadSaved(true);
      const isWpg =
        w.city.trim().toLowerCase() === "winnipeg" &&
        /^R[23]/i.test(w.postal.replace(/\s+/g, ""));
      setOutsideArea(!isWpg);
      setStep(2);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function next2() {
    const e = step2Errors(w);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep(3);
  }

  function next3() {
    if (!w.condition) {
      setErrors({ condition: "Pick the option that fits best." });
      return;
    }
    setErrors({});
    setStep(4);
  }

  async function pickSlot(startUtc: number) {
    if (!leadId || durationMinutes == null) return;
    setSlotJustTaken(false);
    setSubmitting(true);
    try {
      const res = await holdSlot({ bookingId: leadId, startUtc, durationMinutes });
      if (res.ok) {
        const { winnipegDateKey, winnipegTimeKey } = await import("../lib/tz");
        setHeldSlot({
          startUtc,
          timeKey: winnipegTimeKey(startUtc),
          dateKey: winnipegDateKey(startUtc),
        });
      } else {
        setSlotJustTaken(true);
        setHoldFailReason(res.reason);
        setHeldSlot(null);
      }
    } catch {
      setSlotJustTaken(true);
      setHoldFailReason("unknown");
    } finally {
      setSubmitting(false);
    }
  }

  async function finalSubmit() {
    if (!leadId) return;
    const needsSlot = !estimateResult; // quote_required flow skips 4b
    if (!needsSlot && !heldSlot) {
      setServerError("Please pick a date and time first.");
      return;
    }
    if (!w.pests) {
      setErrors({ pests: "Please answer this question." });
      return;
    }
    if (!w.entryMethod) {
      setErrors({ entryMethod: "Please pick an entry option." });
      return;
    }
    setErrors({});
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await submitBooking({
        bookingId: leadId,
        // Home + service details — saved with the booking so pricing and the
        // owner's notifications use real data.
        sqft: resolvedSqft,
        sqftSource: w.sqft ? "exact" : "estimate",
        bedrooms: parseInt(w.bedrooms, 10) || 0,
        fullBaths: parseInt(w.fullBaths, 10) || 0,
        halfBaths: parseInt(w.halfBaths, 10) || 0,
        homeType: w.homeType,
        serviceType: w.serviceType,
        frequency: w.frequency,
        addons: w.addons,
        condition: w.condition,
        pests: w.pests === "yes",
        pets: w.pets === "yes",
        petsNote: w.pets === "yes" ? w.petsNote || undefined : undefined,
        entryMethod: w.entryMethod,
        specialRequests: w.specialRequests || undefined,
        honeypot: honeypot || undefined,
        confirmVia: "email",
      });
      if (!res.ok) {
        if (res.reason === "slot_taken") {
          setSlotJustTaken(true);
          setHeldSlot(null);
          setStep(5);
          setServerError(
            "That time was just taken, please choose another. Everything else you entered is saved.",
          );
        } else {
          setServerError(
            "We already have an active request with this email or phone. Call us if you need to change it.",
          );
        }
        return;
      }
      trackBookingConversion(estimateResult?.firstVisit);
      navigate(
        `/book/thanks?name=${encodeURIComponent(w.firstName)}${
          heldSlot ? `&when=${encodeURIComponent(heldSlot.dateKey + " " + heldSlot.timeKey)}` : ""
        }&est=${estimateResult?.firstVisit ?? ""}${estimateResult ? "" : "&qr=1"}`,
      );
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting;

  // Calendar window + bookable-day set for the month grid.
  const minBookableDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // minLeadDays placeholder lives in availability config
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxBookableDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60); // maxAdvanceDays
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);
  const availableDays = useMemo(() => {
    return (bookableDates ?? []).map((d) => isoToDate(d.dateKey));
  }, [bookableDates]);
  const firstBookableMonth = useMemo(() => {
    const first = availableDays[0];
    return first ?? minBookableDay;
  }, [availableDays, minBookableDay]);

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="border-b border-slate-200 bg-brand-sky-tint">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-deep">
            Book a cleaning
          </p>
          <h1 className="mt-2 text-3xl font-bold text-brand-ink sm:text-4xl">
            Get your estimated quote in about 3 minutes.
          </h1>
          <p className="mt-3 text-brand-slate">
            You'll see your estimated price before you pick a time — and nothing is
            confirmed until ScrubFair confirms it with you. Winnipeg homes only.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Progress */}
        <ol className="mb-10 flex flex-wrap items-center gap-2 text-xs" aria-label="Progress">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <li
                key={label}
                className={
                  "flex items-center gap-1.5 rounded-full px-3 py-1 " +
                  (active
                    ? "bg-brand-deep text-white"
                    : done
                      ? "bg-brand-sky-soft text-brand-deep"
                      : "bg-slate-100 text-slate-500")
                }
                aria-current={active ? "step" : undefined}
              >
                {done ? <CheckCircle2 className="size-3.5" aria-hidden /> : <span>{n}</span>}
                <span className="font-medium">{label}</span>
              </li>
            );
          })}
        </ol>

        {outsideArea && (
          <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">We currently serve Winnipeg only. Call us to check your area.</p>
            <p className="mt-1">
              Your address looks outside our service area, but we've saved your request — or
              call{" "}
              <a href={`tel:${BRAND.phoneTel}`} className="font-semibold underline">
                {BRAND.phone}
              </a>{" "}
              and we'll see what we can do.
            </p>
          </div>
        )}

        {/* ------------------------------------------------ STEP 1 */}
        {step === 1 && (
          <FormSection title="Who are we cleaning for?" icon={MapPin}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" required error={errors.firstName}>
                <Input value={w.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" className="h-12" />
              </Field>
              <Field label="Last name" required error={errors.lastName}>
                <Input value={w.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" className="h-12" />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone" required error={errors.phone}>
                <Input type="tel" value={w.phone} onChange={(e) => set("phone", e.target.value)} placeholder="204-555-0123" autoComplete="tel" className="h-12" />
              </Field>
              <Field label="Email" required error={errors.email}>
                <Input type="email" value={w.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" className="h-12" />
              </Field>
            </div>
            <Field label="Street address" required error={errors.street}>
              <Input value={w.street} onChange={(e) => set("street", e.target.value)} autoComplete="address-line1" className="h-12" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Unit / apartment">
                <Input value={w.unit} onChange={(e) => set("unit", e.target.value)} autoComplete="address-line2" className="h-12" />
              </Field>
              <Field label="City" required>
                <Input value={w.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" className="h-12" />
              </Field>
              <Field label="Postal code" required error={errors.postal}>
                <Input value={w.postal} onChange={(e) => set("postal", e.target.value)} placeholder="R3P 0J4" autoComplete="postal-code" className="h-12" />
              </Field>
            </div>
            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm hover:border-brand-deep has-[[data-state=checked]]:border-brand-deep">
                <Checkbox
                  checked={w.consent}
                  onCheckedChange={(v) => set("consent", v === true)}
                  className="mt-0.5"
                  aria-describedby="consent-desc"
                />
                <span id="consent-desc" className="text-brand-slate">
                  I agree ScrubFair may contact me about this request. See our{" "}
                  <Link to="/privacy" className="font-semibold text-brand-deep underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.consent && <p className="mt-1 text-sm text-red-600">{errors.consent}</p>}
            </div>
            <StepNav onNext={next1} nextLabel="Continue to home details" busy={busy} />
            <p className="text-xs text-slate-500">
              Step 1 is saved as a request-in-progress, so we can follow up if anything interrupts you.
            </p>
          </FormSection>
        )}

        {/* ------------------------------------------------ STEP 2 */}
        {step === 2 && (
          <FormSection title="Tell us about your home" icon={HomeIcon}>
            <Field label="Square footage — excluding the basement" required error={errors.sqft} helper="Measure only the finished floors you want cleaned (main + upper floors). Don't count the basement.">
              <Input
                type="number"
                inputMode="numeric"
                min={100}
                max={20000}
                value={w.sqft}
                onChange={(e) => set("sqft", e.target.value)}
                placeholder="e.g. 1200"
                className="h-12"
              />
            </Field>
            <div>
              <p className="text-sm font-semibold text-brand-ink">
                Not sure? Pick the closest size. <span className="text-brand-deep">*</span>
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SQFT_BUCKETS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => {
                      set("sqftBucket", String(b.value));
                      set("sqft", "");
                      setErrors({});
                    }}
                    className={
                      "rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors " +
                      (w.sqftBucket === String(b.value)
                        ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                        : "border-slate-200 text-brand-slate hover:border-brand-deep")
                    }
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Bedrooms" required error={errors.bedrooms} helper="Include basement bedrooms to be cleaned.">
                <Input type="number" inputMode="numeric" min={0} max={10} value={w.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="h-12" />
              </Field>
              <Field label="Full bathrooms" required error={errors.fullBaths} helper="With a shower or tub.">
                <Input type="number" inputMode="numeric" min={0} max={8} value={w.fullBaths} onChange={(e) => set("fullBaths", e.target.value)} className="h-12" />
              </Field>
              <Field label="Half bathrooms" required error={errors.halfBaths} helper="Toilet + sink only.">
                <Input type="number" inputMode="numeric" min={0} max={6} value={w.halfBaths} onChange={(e) => set("halfBaths", e.target.value)} className="h-12" />
              </Field>
            </div>
            <Field label="Home type" required error={errors.homeType}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {HOME_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set("homeType", o.value)}
                    className={
                      "rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors " +
                      (w.homeType === o.value
                        ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                        : "border-slate-200 text-brand-slate hover:border-brand-deep")
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <StepNav
              onBack={() => setStep(1)}
              onNext={next2}
              nextLabel="Continue to service"
              busy={busy}
            />
          </FormSection>
        )}

        {/* ------------------------------------------------ STEP 3 */}
        {step === 3 && (
          <FormSection title="What do you need?" icon={Sparkles}>
            <Field label="Service" required>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { v: "standard", t: "Standard Cleaning", d: "A regular, top-to-bottom clean." },
                  { v: "deep", t: "Deep Cleaning", d: "The detailed first-time reset. One-time price." },
                  { v: "move_in_out", t: "Move In / Move Out", d: "Empty-home detailed clean. One-time price." },
                  { v: "commercial", t: "Commercial Cleaning", d: "Offices, retail, studios, and workspaces." },
                  { v: "showhomes", t: "Showhome Cleaning", d: "Presentation-ready cleaning between viewings." },
                  { v: "post_construction", t: "Post-Construction Cleaning", d: "Fine dust and debris cleanup after renovation." },
                  { v: "carpet", t: "Carpet Cleaning", d: "Refresh carpeted rooms and high-traffic areas." },
                  { v: "other", t: "Something else", d: "Describe what you need in special requests below." },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => set("serviceType", o.v as WizardState["serviceType"])}
                    className={
                      "rounded-xl border p-4 text-left transition-colors " +
                      (w.serviceType === o.v
                        ? "border-brand-deep bg-brand-sky-soft"
                        : "border-slate-200 hover:border-brand-deep")
                    }
                  >
                    <span className="block text-sm font-semibold text-brand-ink">{o.t}</span>
                    <span className="mt-0.5 block text-xs text-brand-slate">{o.d}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field
              label="How often?"
              required
              helper={
                w.serviceType === "deep" || w.serviceType === "move_in_out"
                  ? "Deep cleans and move-in/move-out are one-time services."
                  : undefined
              }
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FREQUENCY_OPTIONS.map((o) => {
                  const disabled =
                    (w.serviceType === "deep" || w.serviceType === "move_in_out") &&
                    o.value !== "one_time";
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => set("frequency", o.value as WizardState["frequency"])}
                      className={
                        "rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors " +
                        (w.frequency === o.value
                          ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                          : "border-slate-200 text-brand-slate hover:border-brand-deep") +
                        (disabled ? " cursor-not-allowed opacity-40" : "")
                      }
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Add-ons (first visit)" helper="Flat price each, applied to your first visit. For add-ons on every recurring visit, we will confirm by phone.">
              <div className="grid gap-2 sm:grid-cols-2">
                {ADDON_OPTIONS.map((a) => (
                  <label
                    key={a.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-deep"
                  >
                    <Checkbox
                      checked={w.addons.includes(a.value)}
                      onCheckedChange={(v) =>
                        set(
                          "addons",
                          v
                            ? [...w.addons, a.value]
                            : w.addons.filter((x) => x !== a.value),
                        )
                      }
                    />
                    <span className="text-brand-slate">{a.label}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="How would you describe the home's current condition?" required error={errors.condition} helper="Heavier conditions don't change your estimate — we review and confirm before booking.">
              <div className="grid gap-2">
                {CONDITION_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors " +
                      (w.condition === o.value
                        ? "border-brand-deep bg-brand-sky-soft"
                        : "border-slate-200 hover:border-brand-deep")
                    }
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={o.value}
                      checked={w.condition === o.value}
                      onChange={() => set("condition", o.value)}
                      className="mt-1 size-4 accent-brand-deep"
                    />
                    <span>
                      <span className="block font-semibold text-brand-ink">{o.label}</span>
                      <span className="mt-0.5 block text-xs text-brand-slate">{o.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
            <StepNav onBack={() => setStep(2)} onNext={next3} nextLabel="See my estimate" busy={busy} />
          </FormSection>
        )}

        {/* ------------------------------------------------ STEP 4 */}
        {step === 4 && (
          <FormSection title="Your Estimated Quote" icon={CheckCircle2}>
            {estimateResult === undefined ? (
              <div className="flex items-center gap-3 py-10 text-brand-slate">
                <Loader2 className="size-5 animate-spin" aria-hidden /> Calculating…
              </div>
            ) : estimateResult === null ? (
              <div className="rounded-xl border border-slate-200 bg-brand-sky-tint p-6">
                <p className="text-lg font-semibold text-brand-ink">Call or message us for a quote</p>
                <p className="mt-2 text-sm text-brand-slate">
                  Your home's details fall outside our online estimator (very small or very
                  large homes, or special layouts). We'll gladly price it personally — you can
                  still submit this request and we'll review your home's details.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild className="h-12 bg-brand-deep px-6 text-white shadow-brand hover:bg-brand-deep-hover">
                    <a href={`tel:${BRAND.phoneTel}`}>
                      <Phone className="mr-2 size-4" aria-hidden /> Call {BRAND.phone}
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-brand-sky bg-brand-sky-tint p-6 sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-brand-deep">
                      Estimated first visit
                    </p>
                    <p className="mt-1 text-4xl font-bold text-brand-ink">{cad(estimateResult.firstVisit)}</p>
                  </div>
                  {estimateResult.perVisit != null && (
                    <div className="text-right">
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-deep">
                        Estimated per visit after
                      </p>
                      <p className="mt-1 text-2xl font-bold text-brand-ink">{cad(estimateResult.perVisit)}</p>
                    </div>
                  )}
                </div>
                <p className="mt-5 border-t border-brand-sky/60 pt-4 text-sm font-medium text-brand-ink">
                  {ESTIMATE_SIDE_NOTICE}
                </p>
                <p className="mt-2 text-xs text-brand-slate">{ESTIMATE_DIFFERENCE_NOTE}</p>
                <p className="mt-1 text-xs text-brand-slate">{TAX_NOTE}</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 p-4 text-sm text-brand-slate">
              <p className="font-semibold text-brand-ink">Included in this estimate</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>· {deepClean ? "Deep-clean detail" : "Standard clean"} of your home</li>
                <li>· {resolvedSqft || "—"} sq ft (excluding basement), {w.bedrooms || "—"} bedroom(s), {w.fullBaths || "—"} full / {w.halfBaths || "—"} half bath</li>
                {addonCount > 0 && <li>· {addonCount} add-on(s) — first visit</li>}
                <li>· Team arrival window and confirmation after review</li>
              </ul>
            </div>

            <StepNav
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
              nextLabel={estimateResult ? "Pick a date & time" : "Continue"}
              busy={busy}
            />
          </FormSection>
        )}

        {/* ------------------------------------------------ STEP 4b (5) */}
        {step === 5 && (
          <FormSection title="Pick your date & time" icon={CalendarDays}>
            {estimateResult === null ? (
              <div className="rounded-xl border border-slate-200 bg-brand-sky-tint p-5 text-sm text-brand-slate">
                Because this request needs a custom quote, we'll schedule your visit together
                after we review your home's details. Click Continue to finish your request.
              </div>
            ) : (
              <>
                <p className="text-sm text-brand-slate">
                  Available start times for a first-visit clean of about{" "}
                  <b>{durationMinutes ?? "…"} minutes</b>. Times shown in Winnipeg time.
                </p>
                {slotJustTaken && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900" role="alert">
                    {holdFailReason === "outside_hours"
                      ? "That start time no longer fits your cleaning length in our working day — please choose an earlier start."
                      : holdFailReason === "before_lead_time" || holdFailReason === "past_max_advance"
                        ? "That date is outside our booking window — please pick another day."
                        : "That time was just taken, please choose another. Everything else you entered is saved."}
                  </div>
                )}
                {/* Real month-grid calendar: unavailable days are disabled */}
                <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-4">
                  <Calendar
                    mode="single"
                    selected={pickedDate ? isoToDate(pickedDate) : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      setPickedDate(dateToIso(d));
                      setHeldSlot(null);
                      setSlotJustTaken(false);
                    }}
                    numberOfMonths={1}
                    defaultMonth={pickedDate ? isoToDate(pickedDate) : firstBookableMonth}
                    month={calendarMonth ?? (pickedDate ? isoToDate(pickedDate) : firstBookableMonth)}
                    onMonthChange={(m) => setCalendarMonth(m)}
                    disabled={[{ before: minBookableDay }, { after: maxBookableDay }]}
                    modifiers={{ available: availableDays }}
                    modifiersClassNames={{
                      available: "text-brand-ink",
                    }}
                    classNames={{
                      disabled: "text-slate-300 line-through opacity-50", // greyed-out unavailable days
                      selected:
                        "bg-brand-deep !text-white rounded-lg hover:!bg-brand-deep-hover focus-visible:!ring-brand-deep",
                    }}
                  />
                  {bookableDates === undefined && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-brand-slate">
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Loading available days…
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-slate-500">
                  Crossed-out days are fully booked or closed. Pick an open day, then a start time below.
                </p>
                {pickedDate && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(daySlots ?? []).map((s) => (
                      <button
                        key={s.startUtc}
                        type="button"
                        onClick={() => pickSlot(s.startUtc)}
                        disabled={busy}
                        className={
                          "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors " +
                          (heldSlot?.startUtc === s.startUtc
                            ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                            : "border-slate-200 text-brand-ink hover:border-brand-deep")
                        }
                      >
                        <Clock className="size-3.5" aria-hidden />
                        {s.timeKey}
                      </button>
                    ))}
                    {daySlots?.length === 0 && (
                      <p className="col-span-full text-sm text-brand-slate">
                        No open times on this day — try another date.
                      </p>
                    )}
                  </div>
                )}
                {w.frequency !== "one_time" && (
                  <p className="rounded-lg bg-brand-sky-tint p-3 text-xs text-brand-slate">
                    You're picking your <b>first visit</b> only. We will confirm your recurring
                    day and time with you.
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Your pick is a request — it becomes a booking once ScrubFair confirms it.
                </p>
              </>
            )}
            <StepNav
              onBack={() => {
                if (leadId && heldSlot) void releaseHold({ bookingId: leadId });
                setHeldSlot(null);
                setStep(4);
              }}
              onNext={() => setStep(6)}
              nextLabel="Continue to details"
              busy={busy}
              nextDisabled={estimateResult !== null && !heldSlot}
            />
          </FormSection>
        )}

        {/* ------------------------------------------------ STEP 5 (6) */}
        {step === 6 && (
          <FormSection title="A few last questions" icon={ShieldCheck}>
            <Field label="Any cockroach, bedbug or rodent activity in the last 12 months?" required error={errors.pests}>
              <div className="flex gap-2">
                {["no", "yes"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set("pests", v)}
                    className={
                      "flex-1 rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition-colors " +
                      (w.pests === v
                        ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                        : "border-slate-200 text-brand-slate hover:border-brand-deep")
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Pets we should know about?">
              <div className="flex gap-2">
                {["no", "yes"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set("pets", v)}
                    className={
                      "flex-1 rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition-colors " +
                      (w.pets === v
                        ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                        : "border-slate-200 text-brand-slate hover:border-brand-deep")
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
              {w.pets === "yes" && (
                <Input
                  value={w.petsNote}
                  onChange={(e) => set("petsNote", e.target.value)}
                  placeholder="e.g. one friendly cat; dog will be at daycare"
                  className="mt-2 h-11"
                />
              )}
            </Field>
            <Field label="How will the team get in?" required error={errors.entryMethod} helper="We will ask for access details by phone after your booking is confirmed. Please don't enter door codes or alarm codes here.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { v: "home", l: "I'll be home" },
                  { v: "key", l: "Key" },
                  { v: "lockbox", l: "Lockbox" },
                  { v: "other", l: "Other" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => set("entryMethod", o.v)}
                    className={
                      "rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors " +
                      (w.entryMethod === o.v
                        ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                        : "border-slate-200 text-brand-slate hover:border-brand-deep")
                    }
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Special requests">
              <textarea
                value={w.specialRequests}
                onChange={(e) => set("specialRequests", e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Anything we should know? (Date and time were picked in the previous step.)"
                className="w-full resize-y rounded-lg border border-input px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
              />
            </Field>
            <p className="rounded-lg bg-brand-sky-tint p-4 text-sm text-brand-slate">
              After you submit, your booking is <b>confirmed instantly</b> and a confirmation
              email is sent to <b>{w.email || "your email"}</b>.
            </p>

            {/* Honeypot — visible only to bots (hidden off-screen + not focusable) */}
            <div
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
              aria-hidden="true"
            >
              <label>
                Comments
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                {serverError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(5)} className="h-12 border-brand-deep px-6 text-brand-deep hover:bg-brand-sky-tint">
                <ArrowLeft className="mr-2 size-4" aria-hidden /> Back
              </Button>
              <Button
                type="button"
                onClick={finalSubmit}
                disabled={busy}
                className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" aria-hidden /> Sending…
                  </>
                ) : (
                  <>
                    Request This Cleaning <Send className="ml-2 size-4" aria-hidden />
                  </>
                )}
              </Button>
            </div>
          </FormSection>
        )}

        {/* Trust footer */}
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-6 text-xs text-brand-slate">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-brand-deep" aria-hidden /> Your details stay private</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-brand-deep" aria-hidden /> Winnipeg, MB only</span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-4 text-brand-deep" aria-hidden /> Prefer to talk?{" "}
            <a href={`tel:${BRAND.phoneTel}`} className="font-semibold text-brand-deep">{BRAND.phone}</a>
          </span>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
      <h2 className="flex items-center gap-3 text-xl font-bold text-brand-ink">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-sky-soft text-brand-deep">
          <Icon className="size-5" aria-hidden />
        </span>
        {title}
      </h2>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-ink">
        {label} {required && <span className="text-brand-deep">*</span>}
      </p>
      {helper && <p className="mt-1 text-xs text-brand-slate">{helper}</p>}
      <div className={helper ? "mt-2" : "mt-2"}>{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
  busy,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  busy?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack} className="h-12 border-brand-deep px-6 text-brand-deep hover:bg-brand-sky-tint">
          <ArrowLeft className="mr-2 size-4" aria-hidden /> Back
        </Button>
      ) : (
        <span />
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={busy || nextDisabled}
        className="h-13 bg-brand-deep px-8 text-white shadow-brand hover:bg-brand-deep-hover"
      >
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
        {nextLabel} <ArrowRight className="ml-2 size-4" aria-hidden />
      </Button>
    </div>
  );
}

function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

/** "YYYY-MM-DD" (Winnipeg local date) → JS Date at local midnight. */
function isoToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** JS Date → "YYYY-MM-DD" using the browser-side local calendar. For the
 * booking calendar this equals the Winnipeg date for all Manitoba users;
 * the authoritative slot math is server-side either way. */
function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
