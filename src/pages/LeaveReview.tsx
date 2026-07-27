import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
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
  neighbourhood: z
    .string()
    .min(1, "Please pick your neighbourhood."),
  service: z.enum(["Standard Cleaning", "Deep Cleaning"], {
    message: "Please choose a service.",
  }),
  rating: z
    .number()
    .int()
    .min(1, "Please pick at least 1 star.")
    .max(5),
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

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
    // service is intentionally unset on render; the radio control will
    // set it via register() when the user picks one.
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white"
    >
      {/* Hero */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6 lg:px-8 lg:pt-24 lg:pb-12">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              Leave a review
            </p>
            <h1 className="mt-3 text-4xl font-bold text-brand-ink sm:text-5xl">
              Tell us how your clean went.
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              Your review publishes right here on scrubfair.ca as soon as
              you submit it. Short and honest is perfect &mdash; a few
              sentences about the experience you had.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
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
                  className="space-y-7"
                >
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
                      className="text-sm font-semibold text-brand-ink"
                    >
                      Winnipeg neighbourhood{" "}
                      <span className="text-brand-deep">*</span>
                    </Label>
                    <select
                      id="neighbourhood"
                      defaultValue=""
                      className="mt-2 h-12 w-full rounded-md border border-input bg-white px-3 text-base text-brand-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
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
                      <p className="mt-1 text-sm text-red-600">
                        {errors.neighbourhood.message}
                      </p>
                    )}
                  </div>

                  <fieldset>
                    <legend className="text-sm font-semibold text-brand-ink">
                      Which cleaning did we do for you?{" "}
                      <span className="text-brand-deep">*</span>
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(["Standard Cleaning", "Deep Cleaning"] as const).map(
                        (s) => (
                          <label
                            key={s}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-deep has-[:checked]:border-brand-deep has-[:checked]:bg-brand-sky-tint"
                          >
                            <input
                              type="radio"
                              value={s}
                              className="mt-1 size-4 accent-brand-deep"
                              {...register("service")}
                            />
                            <span className="block">
                              <span className="block text-sm font-semibold text-brand-ink">
                                {s}
                              </span>
                              <span className="mt-0.5 block text-xs text-brand-slate">
                                {s === "Standard Cleaning"
                                  ? "Your regular recurring visit"
                                  : "The first-time or seasonal reset"}
                              </span>
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                    {errors.service?.message && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.service.message}
                      </p>
                    )}
                  </fieldset>

                  <fieldset>
                    <legend className="text-sm font-semibold text-brand-ink">
                      How was it?{" "}
                      <span className="text-brand-deep">*</span>
                    </legend>
                    <div className="mt-3 flex items-center gap-2">
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
                            className="rounded-md p-1 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand-deep"
                          >
                            <Star
                              className={`size-9 ${
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
                      <p className="mt-1 text-sm text-red-600">
                        {errors.rating.message}
                      </p>
                    )}
                  </fieldset>

                  <div>
                    <Label
                      htmlFor="body"
                      className="text-sm font-semibold text-brand-ink"
                    >
                      Your review{" "}
                      <span className="text-brand-deep">*</span>
                    </Label>
                    <Textarea
                      id="body"
                      rows={6}
                      placeholder="A sentence or two about how the clean went — we'd love to know what worked, what stood out, and how the home feels now."
                      className="mt-2 resize-y"
                      {...register("body")}
                    />
                    {errors.body?.message && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.body.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-brand-slate">
                      Short and honest is perfect — minimum 20 characters.
                    </p>
                  </div>

                  {state.kind === "error" && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <AlertCircle
                        className="mt-0.5 size-5 shrink-0"
                        aria-hidden
                      />
                      <p>{state.message}</p>
                    </div>
                  )}

                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-brand-slate">
                      Your review will be visible on the /reviews page
                      immediately after you submit it.
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={busy}
                      className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover"
                    >
                      {busy ? (
                        <>
                          <Loader2
                            className="mr-2 size-5 animate-spin"
                            aria-hidden
                          />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 size-5" aria-hidden />
                          Publish my review
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
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
      <Label htmlFor={id} className="text-sm font-semibold text-brand-ink">
        {label} {required && <span className="text-brand-deep">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 h-12"
        {...registration}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-sky-soft text-brand-deep">
        <CheckCircle2 className="size-8" aria-hidden />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-brand-ink sm:text-3xl">
        Thank you &mdash; your review is live!
      </h2>
      <p className="mt-3 text-brand-slate">
        It&rsquo;s already showing on the{" "}
        <Link to="/reviews" className="font-semibold text-brand-deep underline-offset-4 hover:underline">
          reviews page
        </Link>
        . It means a lot to a brand-new Winnipeg business like ours.
      </p>

      <div className="mx-auto mt-5 inline-flex flex-wrap items-center justify-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
            emailSent
              ? "bg-brand-sky-soft text-brand-deep"
              : "bg-slate-100 text-brand-slate"
          }`}
        >
          {emailSent ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Info className="size-3.5" aria-hidden />
          )}
          {emailSent ? "Business notified by email" : "Business email skipped"}
          {emailFromUsed && (
            <span className="text-brand-slate/70">
              &mdash; {emailFromUsed}
            </span>
          )}
        </span>
      </div>

      {showWarnings && (
        <div
          className={`mt-6 rounded-xl border p-4 text-left text-sm ${
            !emailSent
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-50 text-brand-slate"
          }`}
        >
          <div className="flex items-start gap-2">
            {!emailSent ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <div>
              <p className="font-semibold">
                {!emailSent
                  ? "Your review is saved, but the team wasn\u2019t notified by email."
                  : "Notification details"}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          asChild
          className="h-12 bg-brand-deep px-6 text-white shadow-brand hover:bg-brand-deep-hover"
        >
          <Link to="/reviews">
            <Sparkles className="mr-2 size-4" aria-hidden />
            See it on /reviews
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-12 border-brand-deep px-6 text-brand-deep hover:bg-brand-sky-tint"
        >
          Write another
        </Button>
      </div>
    </motion.div>
  );
}
