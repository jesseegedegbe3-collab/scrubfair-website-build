import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useAction } from "convex/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";
import { api } from "../convex/_generated/api";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(100, "Name is too long."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least 10 characters.")
    .max(2000, "Message is too long (max 2000 characters)."),
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
      telegramSent: boolean;
    }
  | { kind: "error"; message: string };

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.05,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function Contact() {
  const submit = useAction(api.contact.submitContactForm);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setState({ kind: "submitting" });
    try {
      const result = await submit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        message: values.message.trim(),
        source: "contact-page",
      });
      setState({
        kind: "success",
        warnings: result.warnings ?? [],
        emailSent: !!result.emailSent,
        emailFromUsed: result.emailFromUsed ?? null,
        telegramSent: !!result.telegramSent,
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
      {/* ─────────────────── LEFT — Compact form ─────────────────── */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white md:col-span-7"
      >
        <div className="border-b border-slate-200 px-4 py-2.5">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            Contact
          </p>
          <h1 className="mt-0.5 text-lg font-bold text-brand-ink sm:text-xl">
            Get your home on the calendar.
          </h1>
          <p className="mt-0.5 text-xs text-brand-slate sm:text-sm">
            Tell us a little about your home. We'll reply within one business
            day with a free quote.
          </p>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {state.kind === "success" ? (
            <SuccessPanel
              onReset={() => setState({ kind: "idle" })}
              warnings={state.warnings}
              emailSent={state.emailSent}
              emailFromUsed={state.emailFromUsed}
              telegramSent={state.telegramSent}
            />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="grid h-full grid-rows-[auto_1fr_auto] gap-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  id="name"
                  label="Your name"
                  placeholder="Evelyn Egedegbe"
                  error={errors.name?.message}
                  registration={register("name")}
                  autoComplete="name"
                  required
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  registration={register("email")}
                  autoComplete="email"
                  required
                />
              </div>
              <Field
                id="phone"
                label="Phone (optional)"
                type="tel"
                placeholder="204-555-0123"
                error={errors.phone?.message}
                registration={register("phone")}
                autoComplete="tel"
              />

              <div className="flex min-h-0 flex-col">
                <Label
                  htmlFor="message"
                  className="text-xs font-semibold text-brand-ink"
                >
                  Message <span className="text-brand-deep">*</span>
                </Label>
                <Textarea
                  id="message"
                  rows={3}
                  placeholder="Tell us about your home (size, bedrooms/bathrooms), the kind of clean you're looking for, and any specifics."
                  className="mt-1.5 h-full min-h-[5rem] resize-none text-xs sm:text-sm"
                  {...register("message")}
                />
                {errors.message?.message && (
                  <p className="mt-0.5 text-[11px] text-red-600">
                    {errors.message.message}
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
                  By submitting, you agree to be contacted by ScrubFair. We
                  never share your information.
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 size-3.5" aria-hidden />
                      Send request
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.section>

      {/* ─────────────────── RIGHT — Info card ─────────────────── */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeUp}
        style={{ transitionDelay: "60ms" }}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-brand-sky-soft md:col-span-5"
      >
        <div className="px-4 py-2.5 sm:px-5">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            Reach us directly
          </p>
          <h2 className="mt-0.5 text-base font-bold text-brand-ink sm:text-lg">
            Prefer email or a call?
          </h2>
          <p className="mt-0.5 text-xs text-brand-slate">
            We're happy to chat. Quick response during business hours.
          </p>
        </div>

        <ul className="flex-1 space-y-3 px-4 sm:px-5">
          <li>
            <a
              href={`tel:${BRAND.phoneTel}`}
              className="group flex items-start gap-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-deep shadow-sm">
                <Phone className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
                  Phone
                </p>
                <p className="mt-0.5 text-sm font-semibold text-brand-ink group-hover:text-brand-deep sm:text-base">
                  {BRAND.phone}
                </p>
              </div>
            </a>
          </li>
          <li>
            <Link to="/contact" className="group flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-deep shadow-sm">
                <Mail className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
                  Email
                </p>
                <p className="mt-0.5 break-all text-sm font-semibold text-brand-ink group-hover:text-brand-deep sm:text-base">
                  {BRAND.email}
                </p>
              </div>
            </Link>
          </li>
          <li>
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-deep shadow-sm">
                <MapPin className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
                  Service area
                </p>
                <p className="mt-0.5 text-sm font-semibold text-brand-ink sm:text-base">
                  {BRAND.serviceArea}
                </p>
                <p className="mt-0.5 text-xs text-brand-slate">
                  {BRAND.hours}
                </p>
              </div>
            </div>
          </li>
        </ul>

        <div className="mt-auto border-t border-brand-sky/40 bg-white px-4 py-2.5 sm:px-5">
          <p className="text-[11px] text-brand-slate">
            <span className="font-semibold text-brand-ink">Fully licensed & insured</span>{" "}
            · Satisfaction guaranteed
          </p>
          <p className="mt-1 text-[10px] text-brand-slate">
            Free, no-obligation quotes. Reply within 1 business day.
          </p>
        </div>
      </motion.section>
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
      {error && (
        <p className="mt-0.5 text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}

function SuccessPanel({
  onReset,
  warnings,
  emailSent,
  emailFromUsed,
  telegramSent,
}: {
  onReset: () => void;
  warnings: string[];
  emailSent: boolean;
  emailFromUsed: string | null;
  telegramSent: boolean;
}) {
  const showWarnings = warnings.length > 0;
  const neitherSent = !emailSent && !telegramSent;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col overflow-hidden text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-sky-soft text-brand-deep">
        <CheckCircle2 className="size-6" aria-hidden />
      </div>
      <h2 className="mt-3 text-lg font-bold text-brand-ink sm:text-xl">
        Thanks — we've got your request!
      </h2>
      <p className="mx-auto mt-1 max-w-md text-xs text-brand-slate sm:text-sm">
        Your message is on its way to our team. We'll get back to you within
        one business day with a free quote.
      </p>

      <div className="mx-auto mt-3 inline-flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
        <NotificationChip
          ok={emailSent}
          label={emailSent ? "Email sent" : "Email skipped"}
          detail={emailFromUsed ?? undefined}
        />
        <NotificationChip
          ok={telegramSent}
          label={telegramSent ? "Telegram sent" : "Telegram skipped"}
        />
      </div>

      {showWarnings && (
        <div
          className={`mt-3 rounded-lg border p-2.5 text-left text-[11px] ${
            neitherSent
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-50 text-brand-slate"
          }`}
        >
          <div className="flex items-start gap-1.5">
            {neitherSent ? (
              <AlertCircle className="mt-0.5 size-3 shrink-0" aria-hidden />
            ) : (
              <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
            )}
            <div>
              <p className="text-[11px] font-semibold">
                {neitherSent
                  ? "Saved, but neither channel went out. Please call directly for a faster reply."
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
          <a href={`tel:${BRAND.phoneTel}`}>
            <Phone className="mr-1.5 size-3.5" aria-hidden />
            Call {BRAND.phone}
          </a>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onReset}
          className="h-9 border-brand-deep px-3 text-xs font-semibold text-brand-deep hover:bg-brand-sky-tint"
        >
          Send another
        </Button>
      </div>
    </motion.div>
  );
}

function NotificationChip({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
        ok
          ? "bg-brand-sky-soft text-brand-deep"
          : "bg-slate-100 text-brand-slate"
      }`}
    >
      {ok ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <Info className="size-3" aria-hidden />
      )}
      {label}
      {detail && (
        <span className="text-brand-slate/70">— {detail}</span>
      )}
    </span>
  );
}
