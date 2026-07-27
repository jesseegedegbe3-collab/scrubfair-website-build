import { useState } from "react";
import { Link } from "react-router";
import { useAction } from "convex/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "../convex/_generated/api";

const NEIGHBOURHOODS = [
  "River Heights",
  "Whyte Ridge",
  "St. Vital",
  "Tuxedo",
  "Wolseley",
  "North Kildonan",
  "Charleswood",
  "Crescentwood",
  "Fort Garry",
  "St. Boniface",
  "Transcona",
  "Garden City",
  "Other / prefer not to say",
] as const;

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(80, "Name is too long."),
  neighbourhood: z.string().min(1, "Please pick your neighbourhood."),
  service: z.enum(["Standard Cleaning", "Deep Cleaning"], {
    message: "Please choose a service.",
  }),
  rating: z.number().int().min(1, "Please pick at least 1 star.").max(5),
  body: z
    .string()
    .trim()
    .min(20, "Tell us a little more — at least 20 characters.")
    .max(2000, "Review is too long (max 2000 characters)."),
});

type FormValues = z.infer<typeof formSchema>;

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | {
      kind: "success";
      warnings: string[];
      emailSent: boolean;
      emailFromUsed: string | null;
    }
  | { kind: "error"; message: string };

export default function LeaveReview() {
  const submit = useAction(api.reviews.submitReview);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const [hoverStar, setHoverStar] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      neighbourhood: "",
      rating: 0,
      body: "",
    } as Partial<FormValues>,
  });

  const selectedRating = watch("rating");

  const onSubmit = async (values: FormValues) => {
    setState({ kind: "submitting" });
    try {
      const result = await submit({
        name: values.name.trim(),
        neighbourhood: values.neighbourhood,
        service: values.service,
        rating: values.rating as 1 | 2 | 3 | 4 | 5,
        body: values.body.trim(),
        source: "leave-review-page",
      });
      setState({
        kind: "success",
        warnings: result.warnings ?? [],
        emailSent: !!result.emailSent,
        emailFromUsed: result.emailFromUsed ?? null,
      });
      reset();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setState({ kind: "error", message: msg });
    }
  };

  const busy = isSubmitting || state.kind === "submitting";

  return (
    <div className="no-scroll-page grid h-full grid-cols-1 gap-3 p-3 md:grid-cols-12 md:gap-4 md:p-4">
      {/* LEFT — Form */}
      <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white md:col-span-8">
        <div className="border-b border-slate-200 px-4 py-2.5">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            Leave a review
          </p>
          <h1 className="mt-0.5 text-lg font-bold text-brand-ink sm:text-xl">
            Tell us how your clean went.
          </h1>
          <p className="mt-0.5 text-xs text-brand-slate sm:text-sm">
            Your review publishes on scrubfair.ca immediately. Short and
            honest is perfect — a few sentences works great.
          </p>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {state.kind === "success" ? (
            <SuccessPanel
              onReset={() => setState({ kind: "idle" })}
              warnings={state.warnings}
              emailSent={state.emailSent}
              emailFromUsed={state.emailFromUsed}
            />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="grid h-full grid-rows-[auto_auto_auto_1fr_auto] gap-2.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="name"
                  label="Your name"
                  placeholder="e.g. Sarah M."
                  error={errors.name?.message}
                  registration={register("name")}
                  autoComplete="name"
                  required
                />
                <div>
                  <Label
                    htmlFor="neighbourhood"
                    className="text-xs font-semibold text-brand-ink"
                  >
                    Neighbourhood{" "}
                    <span className="text-brand-deep">*</span>
                  </Label>
                  <select
                    id="neighbourhood"
                    defaultValue=""
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-white px-2 text-xs text-brand-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep sm:text-sm"
                    {...register("neighbourhood")}
                  >
                    <option value="" disabled>
                      Pick one...
                    </option>
                    {NEIGHBOURHOODS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {errors.neighbourhood?.message && (
                    <p className="mt-0.5 text-[11px] text-red-600">
                      {errors.neighbourhood.message}
                    </p>
                  )}
                </div>
              </div>

              <fieldset>
                <legend className="text-xs font-semibold text-brand-ink">
                  Service <span className="text-brand-deep">*</span>
                </legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(["Standard Cleaning", "Deep Cleaning"] as const).map(
                    (s) => (
                      <label
                        key={s}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:border-brand-deep has-[:checked]:border-brand-deep has-[:checked]:bg-brand-sky-tint"
                      >
                        <input
                          type="radio"
                          value={s}
                          className="mt-0.5 size-3.5 accent-brand-deep"
                          {...register("service")}
                        />
                        <span className="flex-1">
                          <span className="block text-xs font-semibold text-brand-ink">
                            {s}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-brand-slate">
                            {s === "Standard Cleaning"
                              ? "Regular recurring visit"
                              : "First-time or seasonal reset"}
                          </span>
                        </span>
                      </label>
                    ),
                  )}
                </div>
                {errors.service?.message && (
                  <p className="mt-0.5 text-[11px] text-red-600">
                    {errors.service.message}
                  </p>
                )}
              </fieldset>

              <fieldset>
                <legend className="text-xs font-semibold text-brand-ink">
                  How was it? <span className="text-brand-deep">*</span>
                </legend>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const active = s <= (hoverStar ?? selectedRating);
                    return (
                      <button
                        type="button"
                        key={s}
                        aria-label={`${s} star${s === 1 ? "" : "s"}`}
                        onMouseEnter={() => setHoverStar(s)}
                        onMouseLeave={() => setHoverStar(null)}
                        onClick={() =>
                          setValue("rating", s, { shouldValidate: true })
                        }
                        className="rounded p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand-deep"
                      >
                        <Star
                          className={`size-7 ${
                            active
                              ? "fill-brand-deep text-brand-deep"
                              : "text-slate-300"
                          } transition-colors`}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                  <input type="hidden" {...register("rating")} />
                </div>
                {errors.rating?.message && (
                  <p className="mt-0.5 text-[11px] text-red-600">
                    {errors.rating.message}
                  </p>
                )}
              </fieldset>

              <div className="flex min-h-0 flex-col">
                <Label
                  htmlFor="body"
                  className="text-xs font-semibold text-brand-ink"
                >
                  Your review <span className="text-brand-deep">*</span>
                </Label>
                <Textarea
                  id="body"
                  rows={3}
                  placeholder="A sentence or two about how the clean went — what stood out and how the home feels now."
                  className="mt-1.5 h-full min-h-[4rem] resize-none text-xs sm:text-sm"
                  {...register("body")}
                />
                {errors.body?.message && (
                  <p className="mt-0.5 text-[11px] text-red-600">
                    {errors.body.message}
                  </p>
                )}
              </div>

              {state.kind === "error" && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                  <AlertCircle
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                  />
                  <p>{state.message}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-brand-slate">
                  Visible on /reviews immediately after submit.
                </p>
                <Button
                  type="submit"
                  size="sm"
                  disabled={busy}
                  className="h-9 bg-brand-deep px-4 text-xs font-semibold text-white shadow-brand hover:bg-brand-deep-hover"
                >
                  {busy ? (
                    <>
                      <Loader2
                        className="mr-1.5 size-3.5 animate-spin"
                        aria-hidden
                      />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 size-3.5" aria-hidden />
                      Publish my review
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* RIGHT — Sidebar */}
      <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-brand-sky-soft md:col-span-4">
        <div className="px-4 py-2.5 sm:px-5">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            Why reviews matter
          </p>
          <h2 className="mt-0.5 text-base font-bold text-brand-ink sm:text-lg">
            Your review helps us grow.
          </h2>
        </div>

        <ul className="flex-1 space-y-2.5 px-4 text-xs text-brand-slate sm:px-5 sm:text-sm">
          <li className="flex gap-2">
            <span className="mt-0.5 text-brand-deep">·</span>
            It shows up on the public reviews page right away.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-brand-deep">·</span>
            Other Winnipeg families can find us when they search for a
            cleaning service.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-brand-deep">·</span>
            It helps us get better with every visit.
          </li>
        </ul>

        <div className="mt-auto border-t border-brand-sky/40 bg-white px-4 py-2.5 sm:px-5">
          <div className="flex items-start gap-2">
            <Sparkles
              className="mt-0.5 size-4 shrink-0 text-brand-deep"
              aria-hidden
            />
            <div>
              <p className="text-xs font-semibold text-brand-ink">
                Already a customer?
              </p>
              <p className="mt-0.5 text-[11px] text-brand-slate">
                Thanks for trusting us with your home.
              </p>
            </div>
          </div>
          <Link
            to="/reviews"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-deep hover:text-brand-deep-hover"
          >
            See all reviews →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  error,
  registration,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs font-semibold text-brand-ink">
        {label} {required && <span className="text-brand-deep">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 h-9 text-xs sm:text-sm"
        {...registration}
      />
      {error && <p className="mt-0.5 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function SuccessPanel({
  onReset,
  warnings,
  emailSent,
  emailFromUsed,
}: {
  onReset: () => void;
  warnings: string[];
  emailSent: boolean;
  emailFromUsed: string | null;
}) {
  const showWarnings = warnings.length > 0;
  return (
    <div
      className="flex h-full flex-col overflow-hidden text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-sky-soft text-brand-deep">
        <CheckCircle2 className="size-6" aria-hidden />
      </div>
      <h2 className="mt-3 text-lg font-bold text-brand-ink sm:text-xl">
        Thank you — your review is live!
      </h2>
      <p className="mx-auto mt-1 max-w-md text-xs text-brand-slate sm:text-sm">
        It's already showing on the{" "}
        <Link
          to="/reviews"
          className="font-semibold text-brand-deep underline-offset-4 hover:underline"
        >
          reviews page
        </Link>
        . It means a lot to a brand-new Winnipeg business like ours.
      </p>

      <div className="mx-auto mt-3 inline-flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
            emailSent
              ? "bg-brand-sky-soft text-brand-deep"
              : "bg-slate-100 text-brand-slate"
          }`}
        >
          {emailSent ? (
            <Check className="size-3" aria-hidden />
          ) : (
            <Info className="size-3" aria-hidden />
          )}
          {emailSent ? "Business notified" : "Business email skipped"}
          {emailFromUsed && (
            <span className="text-brand-slate/70">— {emailFromUsed}</span>
          )}
        </span>
      </div>

      {showWarnings && (
        <div
          className={`mt-3 rounded-lg border p-2.5 text-left text-[11px] ${
            !emailSent
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-50 text-brand-slate"
          }`}
        >
          <div className="flex items-start gap-1.5">
            {!emailSent ? (
              <AlertCircle className="mt-0.5 size-3 shrink-0" aria-hidden />
            ) : (
              <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
            )}
            <div>
              <p className="text-[11px] font-semibold">
                {!emailSent
                  ? "Saved, but the team wasn't notified by email."
                  : "Notification details"}
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10px]">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col justify-center gap-2 pt-3 sm:flex-row">
        <Button
          asChild
          size="sm"
          className="h-9 bg-brand-deep px-3 text-xs font-semibold text-white shadow-brand hover:bg-brand-deep-hover"
        >
          <Link to="/reviews">
            <Sparkles className="mr-1.5 size-3.5" aria-hidden />
            See it on /reviews
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onReset}
          className="h-9 border-brand-deep px-3 text-xs font-semibold text-brand-deep hover:bg-brand-sky-tint"
        >
          Write another
        </Button>
      </div>
    </div>
  );
}
