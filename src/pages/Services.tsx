import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  HardHat,
  Home as HomeIcon,
  Layers,
  Move,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/lib/brand";

const serviceIcons = {
  standard: HomeIcon,
  deep: Sparkles,
  commercial: Building2,
  "move-in-out": Move,
  showhomes: HomeIcon,
  "post-construction": HardHat,
  carpet: Layers,
} as const;

export default function Services() {
  return (
    <div className="bg-white">
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              Services
            </p>
            <h1 className="mt-3 text-4xl font-bold text-brand-ink sm:text-5xl">
              A cleaner space, whatever your next chapter.
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              From recurring home care to move-day resets and commercial spaces,
              ScrubFair brings careful, reliable cleaning to homes and businesses
              across Winnipeg.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => {
              const Icon = serviceIcons[service.id];
              return (
                <article
                  key={service.id}
                  id={service.id}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-brand-lg sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-sky-soft text-brand-deep">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <span className="rounded-full bg-brand-sky-tint px-3 py-1 text-xs font-semibold tracking-wide text-brand-deep uppercase">
                      Winnipeg
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-brand-ink">
                    {service.name}
                  </h2>
                  <p className="mt-2 font-medium text-brand-deep">
                    {service.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-brand-slate">
                    {service.description}
                  </p>

                  <div className="mt-5 flex-1">
                    <h3 className="text-xs font-semibold tracking-wide text-brand-ink uppercase">
                      Included highlights
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {service.includes.slice(0, 3).map((line) => (
                        <li key={line} className="flex gap-2 text-sm text-brand-slate">
                          <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-brand-deep"
                            aria-hidden
                          />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 rounded-xl bg-brand-sky-tint p-4">
                    <p className="text-xs font-semibold tracking-wide text-brand-ink uppercase">
                      Ideal for
                    </p>
                    <p className="mt-1 text-sm leading-5 text-brand-slate">
                      {service.idealFor}
                    </p>
                  </div>

                  <Link
                    to={`/contact?service=${service.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-deep transition-colors hover:text-brand-deep-hover"
                  >
                    Request this service
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <h2 className="text-3xl font-bold text-brand-ink sm:text-4xl">
              Not sure which service fits?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-slate">
              Tell us what you need cleaned and we’ll recommend the right option
              for your space — with a free, no-obligation quote.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover"
            >
              <Link to="/contact">
                Get a Free Quote
                <ArrowRight className="ml-2 size-5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
