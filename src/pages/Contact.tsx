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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IMAGES } from "@/lib/images";
import { BRAND } from "@/lib/brand";
import { api } from "../convex/_generated/api";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(100, "Name is too long."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),
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
  | { kind: "success" }
  | { kind: "error"; message: string };

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
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
      await submit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        message: values.message.trim(),
        source: "contact-page",
      });
      setState({ kind: "success" });
      reset();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
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
      {/* ─────────── Page header ─────────── */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              Contact
            </p>
            <h1 className="mt-3 text-4xl font-bold text-brand-ink sm:text-5xl">
              Let's get your home on the calendar.
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              Tell us a little about your home and what you're looking for.
              We'll get back to you within one business day with a free,
              no-obligation quote.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─────────── Form + Info ─────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Form */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="lg:col-span-3"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                {state.kind === "success" ? (
                  <SuccessPanel onReset={() => setState({ kind: "idle" })} />
                ) : (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="space-y-6"
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
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

                    <div>
                      <Label
                        htmlFor="message"
                        className="text-sm font-semibold text-brand-ink"
                      >
                        Message <span className="text-brand-deep">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        rows={6}
                        placeholder="Tell us about your home (size, number of bedrooms/bathrooms), what kind of clean you're looking for, and any specifics you'd like us to know."
                        className="mt-2 resize-y"
                        {...register("message")}
                      />
                      {errors.message?.message && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.message.message}
                        </p>
                      )}
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
                        By submitting, you agree to be contacted by ScrubFair
                        about your request. We never share your information.
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
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 size-5" aria-hidden />
                            Send request
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              custom={1}
              className="lg:col-span-2"
            >
              <div className="relative h-full overflow-hidden rounded-3xl bg-brand-sky-soft p-8">
                <div className="absolute -right-12 -top-12 size-48 rounded-full bg-brand-sky opacity-40 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-brand-deep opacity-30 blur-3xl" />

                <div className="relative">
                  <h2 className="text-xl font-bold text-brand-ink">
                    Reach us directly
                  </h2>
                  <p className="mt-2 text-sm text-brand-slate">
                    Prefer email or a quick call? We're happy to chat.
                  </p>

                  <ul className="mt-8 space-y-5">
                    <li>
                      <a
                        href={`tel:${BRAND.phoneTel}`}
                        className="group flex items-start gap-4"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm">
                          <Phone className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold tracking-wide text-brand-deep uppercase">
                            Phone
                          </span>
                          <span className="mt-0.5 block text-base font-medium text-brand-ink group-hover:text-brand-deep">
                            {BRAND.phone}
                          </span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <Link
                        to="/contact"
                        className="group flex items-start gap-4"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm">
                          <Mail className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold tracking-wide text-brand-deep uppercase">
                            Email
                          </span>
                          <span className="mt-0.5 block break-all text-base font-medium text-brand-ink group-hover:text-brand-deep">
                            {BRAND.email}
                          </span>
                        </span>
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-start gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm">
                          <MapPin className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold tracking-wide text-brand-deep uppercase">
                            Service area
                          </span>
                          <span className="mt-0.5 block text-base font-medium text-brand-ink">
                            {BRAND.serviceArea}
                          </span>
                          <span className="mt-0.5 block text-sm text-brand-slate">
                            {BRAND.hours}
                          </span>
                        </span>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-10 overflow-hidden rounded-2xl">
                    <img
                      src={IMAGES.contactInterior}
                      alt="Clean, calm interior"
                      className="h-56 w-full bg-brand-sky-tint object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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

function SuccessPanel({ onReset }: { onReset: () => void }) {
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
        Thanks — we've got your request!
      </h2>
      <p className="mt-3 text-brand-slate">
        Your message is on its way to our team. We'll get back to you within
        one business day with a free quote. If it's more urgent, feel free to
        give us a call.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          asChild
          className="h-12 bg-brand-deep px-6 text-white shadow-brand hover:bg-brand-deep-hover"
        >
          <a href={`tel:${BRAND.phoneTel}`}>
            <Phone className="mr-2 size-4" aria-hidden />
            Call {BRAND.phone}
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-12 border-brand-deep px-6 text-brand-deep hover:bg-brand-sky-tint"
        >
          Send another message
        </Button>
      </div>
    </motion.div>
  );
}
