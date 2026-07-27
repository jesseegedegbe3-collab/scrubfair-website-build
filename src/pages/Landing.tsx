import { Link } from "react-router";
import {
  ShieldCheck,
  Sparkles,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";
import { BRAND, SERVICES, TRUST_BADGES } from "@/lib/brand";

const trustIcon = {
  licensed: ShieldCheck,
  guaranteed: Sparkles,
  local: MapPin,
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Home() {
  return (
    <div
           className="bg-white"
    >
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={IMAGES.hero}
            alt=""
            className="h-full w-full bg-brand-sky-tint object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-white" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8 lg:pt-20">
          <h1
                       className="max-w-3xl text-4xl font-extrabold leading-[1.05] text-brand-ink sm:text-5xl lg:text-6xl"
          >
            A spotless home,
            <br className="hidden sm:block" />{" "}
            <span className="text-brand-deep">
              without spending your weekend on it.
            </span>
          </h1>

          <p
                       className="mt-5 max-w-2xl text-lg text-brand-slate sm:text-xl"
          >
            Winnipeg's careful, locally-owned cleaning service. Walk in to a
            home that already feels tidied, dusted, and ready to relax in — and
            get your weekends back.
          </p>

          <div
                       className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              asChild
              size="lg"
              className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand-lg hover:bg-brand-deep-hover"
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
              className="h-14 border-brand-deep px-8 text-base text-brand-deep hover:bg-brand-sky-tint"
            >
              <Link to="/services">See Our Services</Link>
            </Button>
          </div>

          <div
                       className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-slate"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-deep" aria-hidden />
              Free, no-obligation quotes
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-deep" aria-hidden />
              Satisfaction guarantee on every visit
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-deep" aria-hidden />
              Serving all of Winnipeg
            </span>
          </div>

        </div>
      </section>

      {/* ───────────────────────── TRUST STRIP ───────────────────────── */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 md:py-14 lg:px-8">
          {TRUST_BADGES.map((badge, i) => {
            const Icon = trustIcon[badge.id as keyof typeof trustIcon];
            return (
              <div
                key={badge.id}
                               className="flex items-start gap-4"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-sky-soft text-brand-deep">
                  <Icon className="size-6" aria-hidden />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-brand-ink">
                    {badge.label}
                  </h3>
                  <p className="mt-1 text-sm text-brand-slate">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────── SERVICES PREVIEW ───────────────────────── */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              What we clean
            </p>
            <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
              Two simple services, done with care.
            </h2>
            <p className="mt-4 text-lg text-brand-slate">
              Whether you want a recurring refresh or a one-time deep reset,
              you'll get the same careful, consistent results every visit.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {SERVICES.map((service, i) => (
              <article
                key={service.id}
                               className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-brand"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={
                      service.id === "standard"
                        ? IMAGES.standardSupplies
                        : IMAGES.deepKitchen
                    }
                    alt=""
                    className="h-full w-full bg-brand-sky-tint object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl font-bold text-brand-ink">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-brand-deep font-medium">
                    {service.tagline}
                  </p>
                  <p className="mt-3 text-brand-slate">{service.description}</p>
                  <Link
                    to={`/services#${service.id}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-deep hover:text-brand-deep-hover"
                  >
                    Learn more
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 text-center">
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
          </div>
        </div>
      </section>

      {/* ───────────────────────── BENEFITS STRIP ───────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
                Why ScrubFair
              </p>
              <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
                More of your weekend back.{" "}
                <span className="text-brand-deep">A home you're proud of.</span>
              </h2>
              <p className="mt-4 text-lg text-brand-slate">
                We don't just check tasks off a list. We treat your home like
                it's ours — quiet, careful, and consistently thorough. Booking
                is simple, and you get a real, friendly team every time.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  {
                    icon: Clock,
                    title: "Predictable, on-time visits",
                    body: "We show up when we say we will, and finish the job the same way every time.",
                  },
                  {
                    icon: Heart,
                    title: "Care, not just cleaning",
                    body: "Fresh linens on the bed, surfaces wiped the way you'd want them, and a calm, tidy home.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Fully licensed & insured",
                    body: "Coverage you can verify, so your home and your time are protected.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-sky-soft text-brand-deep">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-brand-ink">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-brand-slate">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-brand-sky-soft" />
              <img
                src={IMAGES.deepKitchen}
                alt="Clean, minimalist kitchen interior"
                className="relative h-[480px] w-full rounded-2xl bg-brand-sky-tint object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── REVIEWS TEASER (Coming Soon) ───────────────────────── */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
            Reviews
          </p>
          <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
            Be among our first happy customers.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-slate">
            ScrubFair is brand new in Winnipeg. We're building our reputation
            one home at a time — and we'd love your home to be among the first.
            After your visit, you'll have a chance to share what you thought.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                               className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-6"
              >
                <div className="flex gap-1 text-brand-deep">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="size-4" aria-hidden />
                  ))}
                </div>
                <p className="mt-4 text-sm text-brand-slate">
                  "Your review could go here."
                </p>
                <p className="mt-3 text-xs font-medium tracking-wide text-brand-deep uppercase">
                  First review &mdash; coming soon
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 border-brand-deep px-8 text-base text-brand-deep hover:bg-white"
            >
              <Link to="/reviews">
                Learn more about our story
                <ArrowRight className="ml-2 size-5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ───────────────────────── SERVICE AREA CTA ───────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="rounded-3xl bg-brand-deep px-8 py-14 text-center shadow-brand-lg sm:px-14">
            <MapPin className="mx-auto size-10 text-white" aria-hidden />
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Ready for a spotless home?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-brand-sky-soft">
              Serving Winnipeg,{" "}
              {BRAND.province} and surrounding neighbourhoods. Get a free,
              no-obligation quote in minutes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 bg-white px-8 text-base text-brand-deep hover:bg-brand-sky-tint"
              >
                <Link to="/contact">
                  Get a Free Quote
                  <ArrowRight className="ml-2 size-5" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-14 px-8 text-base text-white hover:bg-white/10"
              >
                <a href={`tel:${BRAND.phoneTel}`}>
                  <Clock className="mr-2 size-5" aria-hidden />
                  Or call {BRAND.phone}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
