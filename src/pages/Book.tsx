// ============================================================================
// /book — Quote-first booking, one question per screen (spec §2)
// ============================================================================
// Flow: service → frequency → home type → bedrooms → bathrooms → size →
//       condition → add-ons → name → phone → email → address → estimate →
//       date & time → pests → pets → extras → review/submit
//
// Design rules:
//  - One question per screen, big tappable cards, no scrolling walls of fields.
//  - Easy questions first so the progress bar moves quickly (each step has a
//    weight; early tap-only questions carry the most).
//  - The bar shows COMPLETION (how close you are to done), never "X left",
//    and starts partly filled so step one never looks empty.
//
// Behaviour preserved from the previous wizard:
//  - Contact step saves a lead (status "lead") for follow-up.
//  - Outside-area addresses still save the lead flagged outside_area.
//  - Date/time comes after the estimate (job length depends on the home).
//  - Reactive slot list; 10-minute temp hold; "just taken" handling.
//  - Honeypot + client & server validation; state preserved on errors.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Hammer,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  PawPrint,
  Phone,
  Ruler,
  Send,
  ShieldCheck,
  Sofa,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
import { winnipegTimeKey, winnipegDateKey } from "../lib/tz";
import { trackBookingConversion } from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Types & client-side validation (mirrored server-side in bookings.ts)
// ---------------------------------------------------------------------------
interface WizardState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  unit: string;
  city: string;
  postal: string;
  consent: boolean;
  sqft: string;
  sqftBucket: string;
  bedrooms: string;
  fullBaths: string;
  halfBaths: string;
  homeType: string;
  serviceType:
    | ""
    | "standard"
    | "deep"
    | "move_in_out"
    | "commercial"
    | "showhomes"
    | "post_construction"
    | "carpet"
    | "other";
  frequency: "" | "one_time" | "weekly" | "biweekly" | "monthly";
  addons: string[];
  condition: string;
  pests: string;
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
  fullBaths: "",
  halfBaths: "",
  homeType: "",
  serviceType: "",
  frequency: "",
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

// ---------------------------------------------------------------------------
// Flow definition — order matters: easiest, most visual questions first.
// The weight drives the progress bar, so early taps move it the most.
// ---------------------------------------------------------------------------
type StepId =
  | "service"
  | "frequency"
  | "homeType"
  | "bedrooms"
  | "bathrooms"
  | "size"
  | "condition"
  | "addons"
  | "name"
  | "phone"
  | "email"
  | "address"
  | "estimate"
  | "time"
  | "pests"
  | "pets"
  | "extras"
  | "review";

const FLOW: { id: StepId; weight: number }[] = [
  { id: "service", weight: 14 },
  { id: "frequency", weight: 12 },
  { id: "homeType", weight: 10 },
  { id: "bedrooms", weight: 8 },
  { id: "bathrooms", weight: 8 },
  { id: "size", weight: 8 },
  { id: "condition", weight: 8 },
  { id: "addons", weight: 8 },
  { id: "name", weight: 7 },
  { id: "phone", weight: 7 },
  { id: "email", weight: 7 },
  { id: "address", weight: 8 },
  { id: "estimate", weight: 3 },
  { id: "time", weight: 3 },
  { id: "pests", weight: 4 },
  { id: "pets", weight: 3 },
  { id: "extras", weight: 4 },
  { id: "review", weight: 3 },
];

const SERVICE_CHOICES = [
  { v: "standard", t: "Standard Cleaning", d: "A regular, top-to-bottom clean.", Icon: Sparkles },
  { v: "deep", t: "Deep Cleaning", d: "The detailed reset, first time or seasonal.", Icon: Layers },
  { v: "move_in_out", t: "Move In / Move Out", d: "Empty-home detailed clean.", Icon: Truck },
  { v: "commercial", t: "Janitorial", d: "Offices, retail, studios, workspaces.", Icon: Building2 },
  { v: "showhomes", t: "Showhome", d: "Presentation-ready between viewings.", Icon: Camera },
  { v: "post_construction", t: "Post-Construction", d: "Fine dust and debris after a reno.", Icon: Hammer },
  { v: "carpet", t: "Carpet Cleaning", d: "Refresh carpeted rooms and traffic lanes.", Icon: Sofa },
  { v: "other", t: "Something else", d: "Tell us in the last step.", Icon: HelpCircle },
] as const;

const ENTRY_CHOICES = [
  { v: "home", l: "I'll be home", Icon: User },
  { v: "key", l: "Key", Icon: KeyRound },
  { v: "lockbox", l: "Lockbox", Icon: ShieldCheck },
  { v: "other", l: "Other", Icon: HelpCircle },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Book() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [w, setW] = useState<WizardState>(initialWizard);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<Id<"bookings"> | null>(null);
  const [outsideArea, setOutsideArea] = useState(false);
  const [heldSlot, setHeldSlot] = useState<{ startUtc: number; timeKey: string; dateKey: string } | null>(null);
  const [slotJustTaken, setSlotJustTaken] = useState(false);
  const [holdFailReason, setHoldFailReason] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [customAddon, setCustomAddon] = useState("");
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);

  const set = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setW((prev) => ({ ...prev, [k]: v }));

  // Resolved sqft: exact input wins; otherwise bucket value.
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
    sqft: resolvedSqft || 1,
    bedrooms: parseInt(w.bedrooms, 10) || 0,
    fullBaths: parseInt(w.fullBaths, 10) || 0,
    halfBaths: parseInt(w.halfBaths, 10) || 0,
    homeType: w.homeType || "bungalow",
    frequency: w.frequency || "one_time",
    addons: w.addons,
    deepClean,
  });

  const durationMinutes = useQuery(api.bookings.durationFor, {
    sqft: resolvedSqft || 550,
    addonCount,
  });

  // Skip questions that can only have one answer:
  //  - a custom-quote home skips the date & time step entirely;
  //  - deep / move-in-out cleans are one-time only, so "how often?" is moot.
  const oneTimeOnly = w.serviceType === "deep" || w.serviceType === "move_in_out";
  const flow = useMemo(
    () =>
      FLOW.filter(
        (s) =>
          !(s.id === "time" && estimateResult === null) &&
          !(s.id === "frequency" && oneTimeOnly),
      ),
    [estimateResult, oneTimeOnly],
  );

  const current = flow[Math.min(step, flow.length - 1)];
  const stepId = current.id;
  const timeIdx = flow.findIndex((s) => s.id === "time");
  const timeReached = timeIdx >= 0 && step >= timeIdx;

  // Reactive availability — only asked for once the time step is in play.
  const bookableDates = useQuery(
    api.bookings.availableDates,
    timeReached && durationMinutes != null ? { durationMinutes } : "skip",
  );
  const daySlots = useQuery(
    api.bookings.availableSlots,
    timeReached && pickedDate && durationMinutes != null
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

  // ---- Progress: completion, never "remaining", never empty at the start ----
  const totalWeight = flow.reduce((sum, s) => sum + s.weight, 0);
  const doneWeight = flow.slice(0, step).reduce((sum, s) => sum + s.weight, 0);
  const isLast = step >= flow.length - 1;
  // Single-select steps move on by themselves, so they need no Continue button.
  const movesOnItsOwn =
    stepId === "service" ||
    stepId === "frequency" ||
    stepId === "homeType" ||
    stepId === "condition" ||
    stepId === "pests";
  const rawPct = isLast
    ? 100
    : ((doneWeight + current.weight * 0.4) / totalWeight) * 100;
  const pct = Math.min(100, Math.max(5, Math.round(rawPct)));

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const goTo = (id: StepId) => {
    const i = flow.findIndex((s) => s.id === id);
    if (i >= 0) {
      setStep(i);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const back = () => {
    if (stepId === "time" && leadId && heldSlot) {
      void releaseHold({ bookingId: leadId });
      setHeldSlot(null);
    }
    if (step > 0) {
      setStep((s) => s - 1);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const advance = () => {
    setStep((s) => Math.min(s + 1, flow.length - 1));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Single-select cards: record the answer, then move on by themselves after a
   * short beat so the selected state is visible before the screen changes.
   * Guarded against double-taps skipping a question.
   */
  const pick = (apply: () => void) => {
    apply();
    const from = step;
    const target = Math.min(step + 1, flow.length - 1);
    window.setTimeout(() => {
      setStep((s) => (s === from ? target : s));
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 180);
  };

  async function saveContactLead(): Promise<boolean> {
    if (leadId) return true;
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
      const isWpg =
        w.city.trim().toLowerCase() === "winnipeg" &&
        /^R[23]/i.test(w.postal.replace(/\s+/g, ""));
      setOutsideArea(!isWpg);
      return true;
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    setError(null);

    switch (stepId) {
      case "homeType":
        if (!w.homeType) return setError("Pick the option that fits best.");
        return advance();
      case "size":
        if (!w.sqft && !w.sqftBucket)
          return setError("Enter your square footage or tap the closest size.");
        if (w.sqft) {
          const n = parseInt(w.sqft, 10);
          if (!Number.isFinite(n) || n < 100)
            return setError("That looks a little small — enter at least 100 sq ft.");
        }
        return advance();
      case "bathrooms":
        if ((parseInt(w.fullBaths, 10) || 0) + (parseInt(w.halfBaths, 10) || 0) === 0)
          return setError("At least one bathroom is required.");
        return advance();
      case "condition":
        if (!w.condition) return setError("Pick the option that fits best.");
        return advance();
      case "name":
        if (w.firstName.trim().length < 2) return setError("Enter your first name.");
        if (w.lastName.trim().length < 2) return setError("Enter your last name.");
        return advance();
      case "phone":
        if (!PHONE_RE.test(w.phone.trim()))
          return setError("Enter a valid phone number.");
        return advance();
      case "email":
        if (!EMAIL_RE.test(w.email.trim()))
          return setError("Enter a valid email address.");
        return advance();
      case "address": {
        if (w.street.trim().length < 4) return setError("Enter your street address.");
        if (!POSTAL_RE.test(w.postal.trim()))
          return setError("Enter a postal code (e.g. R3P 0J4).");
        if (!w.consent)
          return setError("Please agree so we can contact you about this request.");
        const ok = await saveContactLead();
        if (ok) advance();
        return;
      }
      case "time":
        if (estimateResult !== null && !heldSlot)
          return setError("Pick a date and time to continue.");
        return advance();
      case "pests":
        if (!w.pests) return setError("Please answer this question.");
        return advance();
      case "extras":
        if (!w.entryMethod) return setError("Pick how the team will get in.");
        return advance();
      case "review":
        return finalSubmit();
      default:
        return advance();
    }
  }

  async function pickSlot(startUtc: number) {
    if (!leadId || durationMinutes == null) return;
    setSlotJustTaken(false);
    setSubmitting(true);
    try {
      const res = await holdSlot({ bookingId: leadId, startUtc, durationMinutes });
      if (res.ok) {
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
    if (!w.serviceType) {
      goTo("service");
      setError("Pick the kind of clean you need.");
      return;
    }
    if (!w.frequency && !oneTimeOnly) {
      goTo("frequency");
      setError("Pick how often we should come.");
      return;
    }
    const needsSlot = estimateResult !== null;
    if (needsSlot && !heldSlot) {
      setServerError("Please pick a date and time first.");
      goTo("time");
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await submitBooking({
        bookingId: leadId,
        sqft: resolvedSqft,
        sqftSource: w.sqft ? "exact" : "estimate",
        bedrooms: parseInt(w.bedrooms, 10) || 0,
        fullBaths: parseInt(w.fullBaths, 10) || 0,
        halfBaths: parseInt(w.halfBaths, 10) || 0,
        homeType: w.homeType,
        serviceType: w.serviceType,
        frequency: w.frequency || "one_time",
        addons: w.addons,
        condition: w.condition,
        pests: w.pests === "yes",
        pets: w.pets === "yes",
        petsNote: w.pets === "yes" ? w.petsNote || undefined : undefined,
        entryMethod: w.entryMethod,
        specialRequests:
          [
            customAddon.trim() ? `Extra requested: ${customAddon.trim()}` : "",
            w.specialRequests.trim(),
          ]
            .filter(Boolean)
            .join("\n") || undefined,
        honeypot: honeypot || undefined,
        confirmVia: "email",
      });
      if (!res.ok) {
        if (res.reason === "slot_taken") {
          setSlotJustTaken(true);
          setHeldSlot(null);
          goTo("time");
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
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting;

  // Calendar window + bookable-day set for the month grid.
  const minBookableDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxBookableDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);
  const availableDays = useMemo(
    () => (bookableDates ?? []).map((d) => isoToDate(d.dateKey)),
    [bookableDates],
  );
  const firstBookableMonth = availableDays[0] ?? minBookableDay;

  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-brand-sky-tint">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-5 sm:px-6">
          <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">
            A few quick taps, then your price.
          </h1>
          <p className="mt-1 text-sm text-brand-slate">
            One question at a time · Winnipeg only
          </p>
        </div>
      </section>

      {/* Progress stays pinned under the site header so it is always visible. */}
      <div className="sticky top-20 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <ProgressHeader pct={pct} />
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-4 pb-8 pt-5 sm:px-6">

        {outsideArea && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">We currently serve Winnipeg only.</p>
            <p className="mt-1">
              Your address looks outside our service area, but we've saved your request —
              or call{" "}
              <a href={`tel:${BRAND.phoneTel}`} className="font-semibold underline">
                {BRAND.phone}
              </a>{" "}
              and we'll see what we can do.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stepId}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            {stepId === "service" && (
              <Question
                title="What kind of clean do you need?"
                hint="Tap one — you can change it later."
              >
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {SERVICE_CHOICES.map(({ v, t, d, Icon }) => (
                    <ChoiceCard
                      key={v}
                      inline
                      selected={w.serviceType === v}
                      onClick={() =>
                        pick(() => {
                          const forcedOneTime = v === "deep" || v === "move_in_out";
                          const wasForced =
                            w.serviceType === "deep" || w.serviceType === "move_in_out";
                          setW((prev) => ({
                            ...prev,
                            serviceType: v as WizardState["serviceType"],
                            // One-time services lock frequency; switching away
                            // clears it so nothing looks pre-selected.
                            frequency: forcedOneTime
                              ? "one_time"
                              : wasForced
                                ? ""
                                : prev.frequency,
                          }));
                        })
                      }
                      icon={Icon}
                      title={t}
                      description={d}
                    />
                  ))}
                </div>
              </Question>
            )}

            {stepId === "frequency" && (
              <Question
                title="How often should we come?"
                hint={
                  w.serviceType === "deep" || w.serviceType === "move_in_out"
                    ? "Deep cleans and move-in/move-out cleans are one-time services."
                    : "Recurring visits are the calmest way to keep a home clean."
                }
              >
                <div className="grid grid-cols-2 gap-2.5">
                  {FREQUENCY_OPTIONS.map((o) => {
                    const locked =
                      (w.serviceType === "deep" || w.serviceType === "move_in_out") &&
                      o.value !== "one_time";
                    return (
                      <ChoiceCard
                        key={o.value}
                        selected={w.frequency === o.value}
                        disabled={locked}
                        onClick={() =>
                          pick(() =>
                            set("frequency", o.value as WizardState["frequency"]),
                          )
                        }
                        renderIcon={() => <FrequencyIcon value={o.value} />}
                        title={o.label}
                      />
                    );
                  })}
                </div>
              </Question>
            )}

            {stepId === "homeType" && (
              <Question title="What kind of home is it?" hint="Helps us plan the right team.">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {HOME_TYPE_OPTIONS.map((o) => (
                    <ChoiceCard
                      key={o.value}
                      selected={w.homeType === o.value}
                      onClick={() => pick(() => set("homeType", o.value))}
                      renderIcon={() => <HomeKindIcon kind={o.value} />}
                      title={o.label}
                      centered
                    />
                  ))}
                </div>
              </Question>
            )}

            {stepId === "bedrooms" && (
              <Question title="How many bedrooms?" hint="Include basement bedrooms if we're cleaning them.">
                <Counter
                  icon={BedIcon}
                  label="Bedrooms"
                  value={w.bedrooms}
                  max={10}
                  onChange={(v) => set("bedrooms", String(v))}
                />
              </Question>
            )}

            {stepId === "bathrooms" && (
              <Question
                title="And bathrooms?"
                hint="A full bath has a tub or shower. A half bath is toilet and sink only."
              >
                <div className="space-y-3">
                  <Counter
                    icon={BathIcon}
                    label="Full bathrooms"
                    hint="Tub or shower"
                    value={w.fullBaths}
                    max={8}
                    onChange={(v) => set("fullBaths", String(v))}
                  />
                  <Counter
                    icon={BathIcon}
                    label="Half bathrooms"
                    hint="Toilet and sink only"
                    value={w.halfBaths}
                    max={6}
                    onChange={(v) => set("halfBaths", String(v))}
                  />
                </div>
              </Question>
            )}

            {stepId === "size" && (
              <Question
                title="Roughly how big is the space?"
                hint="Count only the finished floors we're cleaning — not the basement."
              >
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {SQFT_BUCKETS.map((b, i) => {
                    const on = w.sqftBucket === String(b.value) && !w.sqft;
                    return (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => {
                          set("sqftBucket", String(b.value));
                          set("sqft", "");
                          setError(null);
                        }}
                        aria-pressed={on}
                        className={
                          "flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-3 text-center transition-all duration-150 " +
                          (on
                            ? "border-brand-deep bg-brand-sky-soft shadow-sm ring-1 ring-brand-deep"
                            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-deep hover:shadow-sm")
                        }
                      >
                        <span
                          className={
                            "flex size-9 items-center justify-center rounded-lg transition-colors " +
                            (on
                              ? "bg-brand-deep text-white"
                              : "bg-brand-sky-tint text-brand-deep")
                          }
                        >
                          <SizeIcon level={i} />
                        </span>
                        <span className="text-[11px] font-semibold leading-tight text-brand-ink">
                          {b.label.replace(" sq ft", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  Square feet, finished floors only.
                </p>
                <div className="mt-4">
                  <label className="text-sm font-semibold text-brand-ink" htmlFor="sqft">
                    Or type the exact square footage
                  </label>
                  <div className="relative mt-2">
                    <Ruler
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <input
                      id="sqft"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={w.sqft}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
                        set("sqft", digits);
                        if (digits) set("sqftBucket", "");
                        setError(null);
                      }}
                      placeholder="e.g. 1200"
                      className="h-11 w-full rounded-lg border border-input pl-11 pr-4 text-base text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
                    />
                  </div>
                </div>
              </Question>
            )}

            {stepId === "condition" && (
              <Question
                title="How is the place looking today?"
                hint="Heavier conditions don't change your estimate — we review before booking."
              >
                <div className="grid gap-2.5">
                  {CONDITION_OPTIONS.map((o) => (
                    <ChoiceCard
                      key={o.value}
                      selected={w.condition === o.value}
                      onClick={() => pick(() => set("condition", o.value))}
                      title={o.label}
                      description={o.description}
                    />
                  ))}
                </div>
              </Question>
            )}

            {stepId === "addons" && (
              <Question
                title="Anything extra on the first visit?"
                hint="Flat price each. Skip if you don't need any."
              >
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {ADDON_OPTIONS.map((a) => {
                    const on = w.addons.includes(a.value);
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() =>
                          set(
                            "addons",
                            on ? w.addons.filter((x) => x !== a.value) : [...w.addons, a.value],
                          )
                        }
                        className={
                          "flex items-center justify-between gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition-colors " +
                          (on
                            ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
                            : "border-slate-200 text-brand-slate hover:border-brand-deep")
                        }
                        aria-pressed={on}
                      >
                        {a.label}
                        <span
                          className={
                            "flex size-5 shrink-0 items-center justify-center rounded-full border " +
                            (on
                              ? "border-brand-deep bg-brand-deep text-white"
                              : "border-slate-300")
                          }
                        >
                          {on && <Check className="size-3" aria-hidden />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="text-sm font-semibold text-brand-ink" htmlFor="custom-addon">
                    Something else you'd like added?
                  </label>
                  <input
                    id="custom-addon"
                    type="text"
                    value={customAddon}
                    onChange={(e) => setCustomAddon(e.target.value.slice(0, 200))}
                    maxLength={200}
                    placeholder="e.g. inside kitchen cabinets, garage floor"
                    className="mt-2 h-12 w-full rounded-lg border border-input px-3 text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
                  />
                  <p className="mt-1.5 text-xs text-brand-slate">
                    We'll price anything custom and confirm it with you by phone.
                  </p>
                </div>
              </Question>
            )}

            {stepId === "name" && (
              <Question title="Who are we cleaning for?" hint="So we know who to ask for on arrival.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={w.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    autoComplete="given-name"
                    placeholder="First name"
                    aria-label="First name"
                    className="h-12"
                  />
                  <Input
                    value={w.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    autoComplete="family-name"
                    placeholder="Last name"
                    aria-label="Last name"
                    className="h-12"
                  />
                </div>
              </Question>
            )}

            {stepId === "phone" && (
              <Question
                title="Best number to reach you?"
                hint="We only call about this booking — no marketing calls."
              >
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    type="tel"
                    value={w.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="204-555-0123"
                    autoComplete="tel"
                    aria-label="Phone number"
                    className="h-14 pl-12 text-lg"
                  />
                </div>
              </Question>
            )}

            {stepId === "email" && (
              <Question
                title="Where should we send your confirmation?"
                hint="Your booking details and confirmation go here."
              >
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    type="email"
                    value={w.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-label="Email address"
                    className="h-14 pl-12 text-lg"
                  />
                </div>
              </Question>
            )}

            {stepId === "address" && (
              <Question title="Where is the cleaning?" hint="Winnipeg addresses only.">
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      value={w.street}
                      onChange={(e) => set("street", e.target.value)}
                      autoComplete="address-line1"
                      placeholder="Street address"
                      aria-label="Street address"
                      className="h-12 pl-12"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      value={w.unit}
                      onChange={(e) => set("unit", e.target.value)}
                      autoComplete="address-line2"
                      placeholder="Unit (optional)"
                      aria-label="Unit"
                      className="h-12"
                    />
                    <Input
                      value={w.city}
                      onChange={(e) => set("city", e.target.value)}
                      autoComplete="address-level2"
                      aria-label="City"
                      className="h-12"
                    />
                    <Input
                      value={w.postal}
                      onChange={(e) => set("postal", e.target.value)}
                      placeholder="R3P 0J4"
                      autoComplete="postal-code"
                      aria-label="Postal code"
                      className="h-12"
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm hover:border-brand-deep has-[[data-state=checked]]:border-brand-deep">
                    <Checkbox
                      checked={w.consent}
                      onCheckedChange={(v) => set("consent", v === true)}
                      className="mt-0.5"
                    />
                    <span className="text-brand-slate">
                      I agree ScrubFair may contact me about this request. See our{" "}
                      <Link
                        to="/privacy"
                        className="font-semibold text-brand-deep underline underline-offset-2"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                </div>
              </Question>
            )}

            {stepId === "estimate" && (
              <Question
                title="Here's your estimated quote"
                hint="Nothing is charged online, and this is an estimate — we confirm the final price with you."
              >
                {estimateResult === undefined ? (
                  <div className="flex items-center gap-3 py-8 text-brand-slate">
                    <Loader2 className="size-5 animate-spin" aria-hidden /> Calculating…
                  </div>
                ) : estimateResult === null ? (
                  <div className="rounded-2xl border border-slate-200 bg-brand-sky-tint p-6">
                    <p className="text-lg font-semibold text-brand-ink">
                      This one needs a personal quote
                    </p>
                    <p className="mt-2 text-sm text-brand-slate">
                      Your home's details fall outside our online estimator. Send the
                      request anyway and we'll review it, or call and we'll price it with
                      you.
                    </p>
                    <Button
                      asChild
                      className="mt-4 h-12 bg-brand-deep px-6 text-white shadow-brand hover:bg-brand-deep-hover"
                    >
                      <a href={`tel:${BRAND.phoneTel}`}>
                        <Phone className="mr-2 size-4" aria-hidden /> Call {BRAND.phone}
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-brand-sky bg-brand-sky-tint p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">
                      Estimated first visit
                    </p>
                    <p className="mt-1 text-5xl font-extrabold text-brand-ink">
                      {cad(estimateResult.firstVisit)}
                    </p>
                    {estimateResult.perVisit != null && (
                      <p className="mt-2 text-sm font-semibold text-brand-deep">
                        Then about {cad(estimateResult.perVisit)} per visit
                      </p>
                    )}
                    <p className="mt-4 border-t border-brand-sky/60 pt-4 text-sm font-medium text-brand-ink">
                      {ESTIMATE_SIDE_NOTICE}
                    </p>
                    <p className="mt-2 text-xs text-brand-slate">{ESTIMATE_DIFFERENCE_NOTE}</p>
                    <p className="mt-1 text-xs text-brand-slate">{TAX_NOTE}</p>
                  </div>
                )}
                <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-brand-slate">
                  <p className="font-semibold text-brand-ink">What's included</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>· {deepClean ? "Deep-clean detail" : "Standard clean"} of your home</li>
                    <li>
                      · {resolvedSqft || "—"} sq ft, {w.bedrooms || "0"} bedroom(s),{" "}
                      {w.fullBaths || "0"} full / {w.halfBaths || "0"} half bath
                    </li>
                    {addonCount > 0 && <li>· {addonCount} add-on(s) on the first visit</li>}
                  </ul>
                </div>
              </Question>
            )}

            {stepId === "time" && (
              <Question
                icon={CalendarDays}
                title="Pick your date and time"
                hint={`Available starts for roughly ${durationMinutes ?? "…"} minutes of cleaning. Times are Winnipeg time.`}
              >
                {slotJustTaken && (
                  <div
                    className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900"
                    role="alert"
                  >
                    {holdFailReason === "outside_hours"
                      ? "That start time no longer fits your cleaning length in our working day — pick an earlier start."
                      : holdFailReason === "before_lead_time" || holdFailReason === "past_max_advance"
                        ? "That date is outside our booking window — pick another day."
                        : "That time was just taken, please choose another. Everything else is saved."}
                  </div>
                )}
                <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-3">
                  <Calendar
                    mode="single"
                    selected={pickedDate ? isoToDate(pickedDate) : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      setPickedDate(dateToIso(d));
                      setHeldSlot(null);
                      setSlotJustTaken(false);
                      setError(null);
                    }}
                    numberOfMonths={1}
                    month={calendarMonth ?? (pickedDate ? isoToDate(pickedDate) : firstBookableMonth)}
                    onMonthChange={(m) => setCalendarMonth(m)}
                    disabled={[{ before: minBookableDay }, { after: maxBookableDay }]}
                    modifiers={{ available: availableDays }}
                    modifiersClassNames={{ available: "text-brand-ink" }}
                    classNames={{
                      disabled: "text-slate-300 line-through opacity-50",
                      selected:
                        "bg-brand-deep !text-white rounded-lg hover:!bg-brand-deep-hover focus-visible:!ring-brand-deep",
                    }}
                  />
                  {bookableDates === undefined && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-brand-slate">
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Loading days…
                    </div>
                  )}
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  Crossed-out days are full or closed. Pick a day, then a start time.
                </p>
                {pickedDate && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                  <p className="mt-4 rounded-lg bg-brand-sky-tint p-3 text-xs text-brand-slate">
                    You're picking your <b>first visit</b> only. We'll confirm your recurring
                    day and time with you.
                  </p>
                )}
              </Question>
            )}

            {stepId === "pests" && (
              <Question
                icon={Bug}
                title="Any pest activity in the last 12 months?"
                hint="Cockroaches, bedbugs, or rodents. We ask so the team can prepare properly."
              >
                <YesNo value={w.pests} onChange={(v) => pick(() => set("pests", v))} />
              </Question>
            )}

            {stepId === "pets" && (
              <Question
                icon={PawPrint}
                title="Any pets we should know about?"
                hint="Optional, but it helps."
              >
                <YesNo
                  value={w.pets}
                  onChange={(v) => {
                    // "No" needs nothing more, so move on; "Yes" stays so the
                    // optional note can be typed.
                    if (v === "no") pick(() => set("pets", v));
                    else set("pets", v);
                  }}
                />
                {w.pets === "yes" && (
                  <Input
                    value={w.petsNote}
                    onChange={(e) => set("petsNote", e.target.value)}
                    placeholder="e.g. one friendly cat; dog will be at daycare"
                    aria-label="Pet details"
                    className="mt-3 h-12"
                  />
                )}
              </Question>
            )}

            {stepId === "extras" && (
              <Question title="Anything we should know?" hint="Access, pets inside, or a spot to focus on.">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {ENTRY_CHOICES.map(({ v, l, Icon }) => (
                    <ChoiceCard
                      key={v}
                      selected={w.entryMethod === v}
                      onClick={() => set("entryMethod", v)}
                      icon={Icon}
                      title={l}
                      centered
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-brand-slate">
                  We'll ask for access details by phone after booking. Please don't enter
                  door or alarm codes here.
                </p>
                <div className="mt-4">
                  <label className="text-sm font-semibold text-brand-ink" htmlFor="requests">
                    Special requests (optional)
                  </label>
                  <textarea
                    id="requests"
                    value={w.specialRequests}
                    onChange={(e) => set("specialRequests", e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Anything else we should know?"
                    className="mt-2 w-full resize-y rounded-lg border border-input px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
                  />
                </div>
              </Question>
            )}

            {stepId === "review" && (
              <Question
                icon={CheckCircle2}
                title="Ready to send it?"
                hint={`Your booking is confirmed instantly and a confirmation email goes to ${
                  w.email || "your email"
                }.`}
              >
                <div className="rounded-2xl border border-slate-200 bg-brand-sky-tint p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-ink">
                        {SERVICE_CHOICES.find((s) => s.v === w.serviceType)?.t ?? "Cleaning"}
                      </p>
                      <p className="mt-1 text-xs text-brand-slate">
                        {w.homeType ? `${w.homeType.replace(/_/g, " ")} · ` : ""}
                        {w.bedrooms || 0} bed · {w.fullBaths || 0} full / {w.halfBaths || 0} half
                        bath · {resolvedSqft || "—"} sq ft
                      </p>
                      <p className="mt-1 text-xs text-brand-slate">
                        {heldSlot
                          ? `${heldSlot.dateKey} at ${heldSlot.timeKey}`
                          : "Date and time confirmed with you"}
                      </p>
                    </div>
                    {estimateResult && (
                      <p className="shrink-0 text-2xl font-bold text-brand-ink">
                        {cad(estimateResult.firstVisit)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <SummaryChip onClick={() => goTo("service")}>Service</SummaryChip>
                  <SummaryChip onClick={() => goTo("size")}>Home size</SummaryChip>
                  <SummaryChip onClick={() => goTo("name")}>Contact</SummaryChip>
                  {timeIdx >= 0 && step > timeIdx && (
                    <SummaryChip onClick={() => goTo("time")}>Date & time</SummaryChip>
                  )}
                </div>

                <div
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
                  aria-hidden="true"
                >
                  <label>
                    Comments
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </label>
                </div>
              </Question>
            )}

            {serverError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                {serverError}
              </div>
            )}
            {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

            <div
              className={
                "mt-7 flex flex-col gap-3 sm:flex-row-reverse sm:items-center " +
                (movesOnItsOwn ? "sm:justify-start" : "sm:justify-between")
              }
            >
              {!movesOnItsOwn && (
                <Button
                  type="button"
                  onClick={next}
                  disabled={busy || (stepId === "time" && estimateResult !== null && !heldSlot)}
                  className="h-14 w-full bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover sm:w-auto"
                >
                  {busy ? (
                    <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                  ) : null}
                  {stepId === "review" ? (
                    <>
                      Request This Cleaning <Send className="ml-2 size-4" aria-hidden />
                    </>
                  ) : stepId === "addons" && w.addons.length === 0 && !customAddon.trim() ? (
                    <>
                      None needed <ArrowRight className="ml-2 size-4" aria-hidden />
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 size-4" aria-hidden />
                    </>
                  )}
                </Button>
              )}
              {step > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-slate hover:text-brand-deep"
                >
                  <ArrowLeft className="size-4" aria-hidden /> Back
                </button>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-6 text-xs text-brand-slate">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-brand-deep" aria-hidden /> Your details stay private
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-brand-deep" aria-hidden /> Winnipeg, MB only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-4 text-brand-deep" aria-hidden /> Prefer to talk?{" "}
            <a href={`tel:${BRAND.phoneTel}`} className="font-semibold text-brand-deep">
              {BRAND.phone}
            </a>
          </span>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------
function ProgressHeader({ pct }: { pct: number }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-brand-deep">{pct}%</p>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Booking progress"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-sky to-brand-deep"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

function Question({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {Icon && (
        <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-brand-sky-soft text-brand-deep">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <h2 className="text-xl font-bold leading-tight text-brand-ink sm:text-2xl">{title}</h2>
      {hint && <p className="mt-1.5 text-sm text-brand-slate">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChoiceCard({
  selected,
  disabled,
  onClick,
  icon: Icon,
  renderIcon,
  title,
  description,
  centered,
  inline,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  renderIcon?: () => React.ReactNode;
  title: string;
  description?: string;
  centered?: boolean;
  inline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={
        "group relative rounded-2xl border p-4 text-left transition-all duration-150 " +
        (centered ? "flex flex-col items-center justify-center gap-2 text-center " : "") +
        (inline ? "flex items-center gap-3 " : "") +
        (selected
          ? "border-brand-deep bg-brand-sky-soft shadow-sm ring-1 ring-brand-deep "
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-deep hover:shadow-sm ") +
        (disabled ? "cursor-not-allowed opacity-40 hover:translate-y-0 " : "")
      }
    >
      {(renderIcon || Icon) && (
        <span
          className={
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors " +
            (inline ? "" : "mb-2") +
            " " +
            (selected ? "bg-brand-deep text-white" : "bg-brand-sky-tint text-brand-deep")
          }
        >
          {renderIcon ? renderIcon() : Icon ? <Icon className="size-5" aria-hidden /> : null}
        </span>
      )}
      <span className={inline ? "min-w-0 flex-1 pr-4" : "block"}>
        <span className="block text-sm font-semibold text-brand-ink">{title}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-brand-slate">{description}</span>
        )}
      </span>
      {selected && !centered && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-brand-deep text-white">
          <Check className="size-3" aria-hidden />
        </span>
      )}
    </button>
  );
}

function Counter({
  label,
  hint,
  icon: Icon,
  value,
  max,
  onChange,
}: {
  label?: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  value: string;
  max: number;
  onChange: (v: number) => void;
}) {
  const n = parseInt(value, 10) || 0;
  // Direction drives whether the outgoing number slides up or down.
  const previous = useRef(n);
  const direction = n >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = n;
  }, [n]);

  return (
    <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-sky-soft text-brand-deep">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="text-right">
          {label && <p className="text-sm font-semibold text-brand-ink">{label}</p>}
          {hint && <p className="text-xs text-brand-slate">{hint}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <motion.button
          type="button"
          onClick={() => onChange(Math.max(0, n - 1))}
          aria-label={`Decrease ${label ?? "count"}`}
          whileTap={{ scale: 0.9 }}
          className="flex size-14 items-center justify-center rounded-2xl border border-slate-200 text-2xl font-bold text-brand-deep transition-colors hover:border-brand-deep hover:bg-brand-sky-tint disabled:opacity-40"
          disabled={n <= 0}
        >
          −
        </motion.button>

        <span className="relative flex h-16 w-24 items-center justify-center overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={n}
              initial={{ y: direction > 0 ? 32 : -32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: direction > 0 ? -32 : 32, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="text-5xl font-extrabold tabular-nums text-brand-ink"
            >
              {n}
            </motion.span>
          </AnimatePresence>
        </span>

        <motion.button
          type="button"
          onClick={() => onChange(Math.min(max, n + 1))}
          aria-label={`Increase ${label ?? "count"}`}
          whileTap={{ scale: 0.9 }}
          className="flex size-14 items-center justify-center rounded-2xl border border-slate-200 text-2xl font-bold text-brand-deep transition-colors hover:border-brand-deep hover:bg-brand-sky-tint disabled:opacity-40"
          disabled={n >= max}
        >
          +
        </motion.button>
      </div>
    </div>
  );
}

function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {[
        { v: "no", l: "No" },
        { v: "yes", l: "Yes" },
      ].map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={
            "rounded-2xl border p-5 text-base font-semibold transition-colors " +
            (value === o.v
              ? "border-brand-deep bg-brand-sky-soft text-brand-deep"
              : "border-slate-200 text-brand-slate hover:border-brand-deep")
          }
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function SummaryChip({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-brand-slate transition-colors hover:border-brand-deep hover:text-brand-deep"
    >
      Edit {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Custom icons (hand-drawn so every option has a matching picture)
// ---------------------------------------------------------------------------
const SVG = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-6",
};

/** Bed — used by the bedrooms counter. */
function BedIcon() {
  return (
    <svg {...SVG}>
      <path d="M4 22v-6a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v6" />
      <path d="M2 22h28" />
      <rect x="7" y="13" width="8" height="4.5" rx="1.2" />
      <path d="M4 25v2M28 25v2" />
    </svg>
  );
}

/** Bathtub — used by the bathroom counters. */
function BathIcon() {
  return (
    <svg {...SVG}>
      <path d="M4 15h24v4.5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" />
      <path d="M8.5 15V8.5a3 3 0 0 1 6 0" />
      <path d="M10.5 26l-1.5 3M21.5 26l1.5 3" />
    </svg>
  );
}

/** House shapes — one per home type, so nothing falls back to a question mark. */
function HomeKindIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "bungalow":
      return (
        <svg {...SVG}>
          <path d="M3 16 16 6.5 29 16" />
          <path d="M6.5 15v12h19V15" />
          <path d="M14 27v-6h4v6" />
        </svg>
      );
    case "story_1_5":
      return (
        <svg {...SVG}>
          <path d="M3.5 15 16 6l12.5 9" />
          <path d="M6.5 14.5v12.5h19V14.5" />
          <path d="M13 14.5v-4h6v4" />
          <path d="M14 27v-6h4v6" />
        </svg>
      );
    case "story_2":
      return (
        <svg {...SVG}>
          <path d="M3.5 14 16 5l12.5 9" />
          <path d="M6.5 13.5v13.5h19V13.5" />
          <path d="M6.5 20h19" />
        </svg>
      );
    case "story_2_5":
      return (
        <svg {...SVG}>
          <path d="M3 13 16 4l13 9" />
          <path d="M6.5 12.5v14.5h19V12.5" />
          <path d="M6.5 19h19" />
          <path d="M13 12.5v-3.5h6v3.5" />
        </svg>
      );
    case "apartment":
      return (
        <svg {...SVG}>
          <rect x="9" y="4.5" width="14" height="23" rx="1.5" />
          <path d="M13 10h2M17 10h2M13 15h2M17 15h2M13 20h2M17 20h2" />
          <path d="M14 27.5v-4h4v4" />
        </svg>
      );
    case "split_level":
      return (
        <svg {...SVG}>
          <path d="M3 19.5 11 12l5 4 5-4 8 7.5" />
          <path d="M6 18.5v9h20v-9" />
          <path d="M14.5 27.5v-5h4v5" />
        </svg>
      );
    case "bi_level":
      return (
        <svg {...SVG}>
          <path d="M3.5 16 16 8l12.5 8" />
          <path d="M6.5 16v11h19V16" />
          <path d="M9.5 21.5h5M17.5 21.5h5" />
        </svg>
      );
    default:
      return (
        <svg {...SVG}>
          <path d="M3.5 16 16 6.5 28.5 16" />
          <path d="M6.5 15v12h19V15" />
          <path d="M12 21h.01M16 21h.01M20 21h.01" strokeWidth={2.8} />
        </svg>
      );
  }
}

/** Calendar rhythm — one per frequency option (once, weekly, every 2 weeks, monthly). */
function FrequencyIcon({ value }: { value: string }) {
  return (
    <svg {...SVG}>
      <rect x="5.5" y="7" width="21" height="19.5" rx="2.5" />
      <path d="M5.5 13h21M11 4.5V9M21 4.5V9" />
      {value === "one_time" && (
        <path d="M12.5 19.5l2.5 2.5 4.5-5" strokeWidth={2.2} />
      )}
      {value === "weekly" && (
        <g fill="currentColor" stroke="none">
          <circle cx="11.5" cy="19" r="1.7" />
          <circle cx="16" cy="19" r="1.7" />
          <circle cx="20.5" cy="19" r="1.7" />
        </g>
      )}
      {value === "biweekly" && (
        <g stroke="none">
          <circle cx="11.5" cy="19" r="1.7" fill="currentColor" />
          <circle cx="16" cy="19" r="1.7" fill="currentColor" opacity={0.25} />
          <circle cx="20.5" cy="19" r="1.7" fill="currentColor" />
        </g>
      )}
      {value === "monthly" && (
        <g fill="currentColor" stroke="none">
          <circle cx="10.5" cy="17.5" r="1.3" />
          <circle cx="15.5" cy="17.5" r="1.3" />
          <circle cx="20.5" cy="17.5" r="1.3" />
          <circle cx="10.5" cy="22" r="1.3" />
          <circle cx="15.5" cy="22" r="1.3" />
          <circle cx="20.5" cy="22" r="1.3" />
        </g>
      )}
    </svg>
  );
}

/** The same little house, drawn bigger as the size bucket grows. */
function SizeIcon({ level }: { level: number }) {
  // 0.6 → 1.15 across the seven buckets, scaled about the house's centre.
  const scale = 0.6 + (level / 6) * 0.55;
  return (
    <svg {...SVG}>
      <g
        transform={`translate(16 16) scale(${scale}) translate(-16 -16)`}
        strokeWidth={2 / scale}
      >
        <path d="M4 15 16 5.5 28 15" />
        <path d="M7.5 14v12.5h17V14" />
        <path d="M13.5 26.5v-6h5v6" />
      </g>
    </svg>
  );
}

/** "YYYY-MM-DD" (Winnipeg local date) → JS Date at local midnight. */
function isoToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** JS Date → "YYYY-MM-DD" using the browser-side local calendar. */
function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
