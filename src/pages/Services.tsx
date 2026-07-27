import { Link } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/lib/brand";

export default function Services() {
  return (
    <div className="no-scroll-page flex h-full flex-col gap-3 p-3 md:gap-4 md:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-brand-sky-tint px-4 py-3 md:px-5 md:py-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            Services
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-brand-ink sm:text-2xl">
            Cleaning built around you,{" "}
            <span className="text-brand-deep">not a checklist.</span>
          </h1>
          <p className="mt-1 hidden text-xs text-brand-slate sm:block md:text-sm">
            Two simple services, both delivered with the same care and
            consistency. Pick the one that fits today — switch anytime.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="h-9 shrink-0 bg-brand-deep px-4 text-xs font-semibold text-white shadow-brand hover:bg-brand-deep-hover sm:text-sm"
        >
          <Link to="/contact">
            Get a Free Quote
            <ArrowRight className="ml-1.5 size-4" aria-hidden />
          </Link>
        </Button>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {SERVICES.map((service) => {
          const isDeep = service.id === "deep";
          const Icon = isDeep ? Sparkles : HomeIcon;
          return (
            <article
              key={service.id}
              id={service.id}
              className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="flex h-full w-full flex-col p-4 md:p-5">
                <div className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-sky-soft text-brand-deep">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
                      {service.name}
                    </span>
                    <h2 className="mt-0.5 text-base font-bold leading-tight text-brand-ink sm:text-lg">
                      {service.tagline}
                    </h2>
                  </div>
                </div>

                <p className="mt-2 text-xs leading-snug text-brand-slate sm:text-sm">
                  {service.description}
                </p>

                <div className="mt-2 grid flex-1 grid-cols-1 gap-3 overflow-hidden md:grid-cols-2">
                  <div className="min-h-0">
                    <p className="text-[10px] font-semibold tracking-widest text-brand-ink uppercase">
                      What you get
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {service.benefits.slice(0, 3).map((b) => (
                        <li
                          key={b}
                          className="flex gap-1.5 text-[11px] text-brand-slate sm:text-xs"
                        >
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0 text-brand-deep"
                            aria-hidden
                          />
                          <span className="leading-snug">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="min-h-0">
                    <p className="text-[10px] font-semibold tracking-widest text-brand-ink uppercase">
                      What's included
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {service.includes.slice(0, 5).map((line) => (
                        <li
                          key={line}
                          className="flex gap-1.5 text-[11px] text-brand-slate sm:text-xs"
                        >
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-deep" />
                          <span className="leading-snug">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-2 rounded-lg border border-slate-200 bg-brand-sky-tint px-2.5 py-1.5">
                  <p className="text-[9px] font-semibold tracking-widest text-brand-deep uppercase">
                    Ideal for
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-brand-slate sm:text-xs">
                    {service.idealFor}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="h-8 bg-brand-deep px-3 text-[11px] font-semibold text-white shadow-brand hover:bg-brand-deep-hover"
                  >
                    <Link to="/contact">
                      Request this service
                      <ArrowRight className="ml-1.5 size-3.5" aria-hidden />
                    </Link>
                  </Button>
                  <span className="text-[10px] text-brand-slate">
                    Free, no-obligation quote
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-sky/40 bg-brand-sky-tint px-4 py-2.5">
        <p className="text-xs text-brand-ink sm:text-sm">
          <span className="font-semibold">Not sure which one?</span> Tell us
          about your home and we'll recommend the right fit.
        </p>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="h-8 bg-brand-deep px-3 text-[11px] font-semibold text-white shadow-brand hover:bg-brand-deep-hover"
          >
            <Link to="/contact">Get a Free Quote</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 border-brand-deep px-3 text-[11px] font-semibold text-brand-deep hover:bg-white"
          >
            <Link to="/contact">Ask a question</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
