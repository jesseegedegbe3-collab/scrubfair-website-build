import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  ShieldCheck,
  Sparkles,
  Home as HomeIcon,
  Star,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";
import { BRAND, SERVICES, TRUST_BADGES } from "@/lib/brand";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const benefitItems = [
  {
    icon: Clock,
    title: "Predictable, on-time visits",
    body: "We show up when we say we will — and finish the job the same way every time.",
  },
  {
    icon: Heart,
    title: "Care, not just cleaning",
    body: "Fresh linens, surfaces wiped the way you'd want them, and a calm, tidy home.",
  },
  {
    icon: ShieldCheck,
    title: "Fully licensed & insured",
    body: "Coverage you can verify, so your home and your time are protected.",
  },
];

export default function Home() {
  return (
    <div className="no-scroll-page grid h-full grid-cols-1 gap-3 p-3 md:grid-cols-12 md:gap-4 md:p-4">
      {/* ─────────────────── COLUMN 1 — HERO + TRUST + CTA ─────────────────── */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeUp}
        custom={0}
        className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-bento-sky p-4 md:col-span-5 md:p-5 lg:col-span-5"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-sky-soft blur-2xl md:size-56"
        />

        <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
          Winnipeg · {BRAND.province}
        </p>
        <h1 className="mt-2 text-[1.65rem] font-extrabold leading-[1.05] text-brand-ink sm:text-3xl md:text-2xl lg:text-3xl xl:text-[2rem]">
          A spotless home,{" "}
          <span className="text-brand-deep">
            without spending your weekend on it.
          </span>
        </h1>
        <p className="mt-2 max-w-md text-xs leading-snug text-brand-slate sm:text-sm">
          Winnipeg's careful, locally-owned cleaning service. Walk in to a
          home that already feels tidied, dusted, and ready to relax in.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            asChild
            size="sm"
            className="h-9 bg-brand-deep px-4 text-xs font-semibold text-white shadow-brand hover:bg-brand-deep-hover sm:h-10 sm:text-sm"
          >
            <Link to="/contact">
              Get a Free Quote
              <ArrowRight className="ml-1.5 size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 border-brand-deep px-4 text-xs font-semibold text-brand-deep hover:bg-white sm:h-10 sm:text-sm"
          >
            <Link to="/services">See Our Services</Link>
          </Button>
        </div>

        {/* Checkmarks inline */}
        <ul className="mt-3 grid grid-cols-1 gap-1.5 text-[11px] text-brand-slate sm:grid-cols-1 sm:text-xs md:grid-cols-1">
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-brand-deep" aria-hidden />
            Free, no-obligation quotes
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-brand-deep" aria-hidden />
            Satisfaction guarantee on every visit
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-brand-deep" aria-hidden />
            Serving all of Winnipeg
          </li>
        </ul>

        {/* Trust strip — compressed row of icons */}
        <div className="mt-3 grid grid-cols-3 gap-1 border-t border-slate-200 pt-3">
          {TRUST_BADGES.map((badge) => {
            const Icon =
              badge.id === "licensed"
                ? ShieldCheck
                : badge.id === "guaranteed"
                  ? Sparkles
                  : MapPin;
            return (
              <div
                key={badge.id}
                className="flex items-start gap-1.5"
                title={`${badge.label} — ${badge.description}`}
              >
                <Icon
                  className="mt-0.5 size-3.5 shrink-0 text-brand-deep"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-brand-ink sm:text-[11px]">
                    {badge.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto" />

        {/* Deep CTA card */}
        <div className="mt-3 rounded-xl bg-brand-deep p-3 text-white shadow-brand-lg sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-brand-sky-soft uppercase">
                Ready when you are
              </p>
              <p className="mt-0.5 text-sm font-bold sm:text-base">
                Get a Free Quote today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                className="h-8 bg-white px-3 text-xs font-semibold text-brand-deep hover:bg-brand-sky-tint"
              >
                <Link to="/contact">Get a Quote</Link>
              </Button>
              <a
                href={`tel:${BRAND.phoneTel}`}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-white hover:bg-white/10"
              >
                <Phone className="size-3.5" aria-hidden />
                Call
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─────────────────── COLUMN 2 — SERVICES ─────────────────── */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeUp}
        custom={1}
        className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-brand-sky-tint md:col-span-4 md:row-span-1 lg:col-span-3"
      >
        <div className="border-b border-slate-200 px-4 py-2.5 md:px-5">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            What we clean
          </p>
          <h2 className="mt-0.5 text-base font-bold text-brand-ink sm:text-lg">
            Two simple services. Same care.
          </h2>
        </div>

        <div className="grid flex-1 grid-rows-2 gap-2 p-2.5 md:p-3">
          {SERVICES.map((service, i) => (
            <Link
              key={service.id}
              to={`/services#${service.id}`}
              className="group flex gap-3 overflow-hidden rounded-xl bg-white p-2.5 transition-shadow hover:shadow-brand"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="relative h-full w-20 shrink-0 overflow-hidden rounded-lg bg-brand-sky-soft sm:w-24">
                <img
                  src={
                    service.id === "standard"
                      ? IMAGES.standardSupplies
                      : IMAGES.deepKitchen
                  }
                  alt=""
                  className="h-full w-full bg-brand-sky-soft object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-brand-deep uppercase">
                  {service.id === "deep" ? (
                    <Sparkles className="size-3" aria-hidden />
                  ) : (
                    <HomeIcon className="size-3" aria-hidden />
                  )}
                  {service.name}
                </span>
                <p className="mt-0.5 text-xs font-semibold leading-snug text-brand-ink">
                  {service.tagline}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-brand-slate line-clamp-2">
                  {service.benefits[0]}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-deep group-hover:text-brand-deep-hover">
                  Learn more
                  <ArrowRight className="size-3" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/contact"
          className="block border-t border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-brand-deep hover:bg-brand-sky-soft md:px-5"
        >
          Request a quote →
        </Link>
      </motion.section>

      {/* ─────────────────── COLUMN 3 — BENEFITS + REVIEWS TEASER ─────────────────── */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeUp}
        custom={2}
        className="flex flex-col gap-3 md:col-span-3 lg:col-span-4"
      >
        {/* Benefits card */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            Why ScrubFair
          </p>
          <h2 className="mt-0.5 text-base font-bold text-brand-ink sm:text-lg">
            More weekend back.{" "}
            <span className="text-brand-deep">A home you're proud of.</span>
          </h2>

          <ul className="mt-3 space-y-2.5">
            {benefitItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-sky-soft text-brand-deep">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight text-brand-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-brand-slate">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Reviews teaser */}
        <div className="overflow-hidden rounded-2xl border border-brand-sky/40 bg-brand-sky-tint p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
                Reviews
              </p>
              <p className="mt-0.5 text-xs font-semibold leading-tight text-brand-ink">
                Be among our first happy customers.
              </p>
            </div>
            <div className="flex shrink-0 gap-0.5 text-brand-deep">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="size-3" aria-hidden />
              ))}
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-brand-slate">
            We're building ScrubFair's reputation one Winnipeg home at a time.
            After your visit, you'll have a chance to share what you thought.
          </p>
          <Link
            to="/reviews"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-deep hover:text-brand-deep-hover"
          >
            Learn more about our story
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
