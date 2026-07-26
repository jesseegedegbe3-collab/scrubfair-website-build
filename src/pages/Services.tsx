import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";
import { SERVICES } from "@/lib/brand";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Services() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white"
    >
      {/* ─────────── Page header ─────────── */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6 lg:px-8 lg:pt-24 lg:pb-12">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              Services
            </p>
            <h1 className="mt-3 text-4xl font-bold text-brand-ink sm:text-5xl">
              Cleaning built around you, not a checklist.
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              Two simple services, both delivered with the same care,
              consistency, and attention to detail. Pick the one that fits
              today — and you can always switch later.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─────────── Service blocks ─────────── */}
      {SERVICES.map((service, idx) => {
        const isDeep = service.id === "deep";
        const reverse = idx % 2 === 1;
        return (
          <section
            key={service.id}
            id={service.id}
            className={
              idx % 2 === 0
                ? "bg-white"
                : "bg-brand-sky-tint"
            }
          >
            <div className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14 lg:pb-24">
              <div
                className={`grid items-center gap-12 lg:grid-cols-2 ${
                  reverse ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  className="relative"
                >
                  <div className="absolute -inset-4 -z-10 rounded-3xl bg-brand-sky-soft" />
                  <img
                    src={isDeep ? IMAGES.deepKitchen : IMAGES.standardSupplies}
                    alt={
                      isDeep
                        ? "Clean, minimalist kitchen interior"
                        : "Cleaning supplies arranged on a surface"
                    }
                    className="relative h-[420px] w-full rounded-2xl bg-brand-sky-tint object-cover shadow-lg"
                  />
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  custom={1}
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-sky-soft px-3 py-1 text-xs font-semibold tracking-wide text-brand-deep uppercase">
                    {isDeep ? (
                      <Sparkles className="size-3.5" aria-hidden />
                    ) : (
                      <HomeIcon className="size-3.5" aria-hidden />
                    )}
                    {service.name}
                  </div>
                  <h2 className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl">
                    {service.tagline}
                  </h2>
                  <p className="mt-4 text-lg text-brand-slate">
                    {service.description}
                  </p>

                  <h3 className="mt-8 text-sm font-semibold tracking-wide text-brand-ink uppercase">
                    What you get
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {service.benefits.map((b) => (
                      <li key={b} className="flex gap-3">
                        <CheckCircle2
                          className="mt-0.5 size-5 shrink-0 text-brand-deep"
                          aria-hidden
                        />
                        <span className="text-brand-slate">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <h3 className="mt-8 text-sm font-semibold tracking-wide text-brand-ink uppercase">
                    What's included
                  </h3>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {service.includes.map((line) => (
                      <li
                        key={line}
                        className="flex gap-2 text-sm text-brand-slate"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-deep" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-brand-ink">
                      Ideal for
                    </p>
                    <p className="mt-1 text-sm text-brand-slate">
                      {service.idealFor}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ─────────── CTA strip ─────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="rounded-3xl border border-slate-200 bg-brand-sky-tint p-10 text-center sm:p-14">
            <h2 className="text-3xl font-bold text-brand-ink sm:text-4xl">
              Not sure which one is right?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-slate">
              Tell us a little about your home and we'll recommend the service
              that fits — no pressure, no obligation.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover"
              >
                <Link to="/contact">
                  Get a Free Quote
                  <ArrowRight className="ml-2 size-5" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-brand-deep px-8 text-base text-brand-deep hover:bg-white"
              >
                <Link to="/contact">Ask a question</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
