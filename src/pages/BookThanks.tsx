import { Link, useSearchParams } from "react-router";
import { CalendarClock, CheckCircle2, ClipboardList, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import {
  cad,
  ESTIMATE_DIFFERENCE_NOTE,
  ESTIMATE_NOTICE,
  TAX_NOTE,
} from "@/lib/estimateWording";

// OWNER TO FILL: expected response time shown to customers after submitting.
const RESPONSE_TIME = "[OWNER TO FILL — e.g. within 2 business hours]";

export default function BookThanks() {
  const [params] = useSearchParams();
  const name = params.get("name") ?? "";
  const when = params.get("when") ?? "";
  const est = params.get("est");
  const quoteRequired = params.get("qr") === "1";

  return (
    <div className="bg-white">
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white text-brand-deep shadow-brand">
            <CheckCircle2 className="size-9" aria-hidden />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-brand-ink sm:text-4xl">
            Request received{name ? `, ${name}` : ""}!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-slate">
            Here's exactly where things stand — in plain language.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        {/* The estimate is NOT a confirmed booking */}
        <div className="rounded-2xl border border-brand-sky bg-brand-sky-tint p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-ink">
            <ClipboardList className="size-5 text-brand-deep" aria-hidden />
            What you were shown is an estimated quote — not a confirmed booking
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-slate">{ESTIMATE_NOTICE}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-slate">{ESTIMATE_DIFFERENCE_NOTE}</p>
          <p className="mt-2 text-xs text-brand-slate">{TAX_NOTE}</p>
          {est && (
            <p className="mt-4 text-2xl font-bold text-brand-ink">
              Estimated first visit: {cad(parseInt(est, 10))}
            </p>
          )}
          {quoteRequired && (
            <p className="mt-4 text-sm font-medium text-brand-ink">
              You didn't get an instant estimate — we'll prepare a personal quote after
              reviewing your home's details.
            </p>
          )}
        </div>

        {/* Requested time */}
        {when && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-slate-200 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-sky-soft text-brand-deep">
              <CalendarClock className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-brand-ink">Requested date &amp; time</p>
              <p className="mt-1 text-sm text-brand-slate">
                {when} (Winnipeg time) — shown as <b>Requested</b>, never confirmed, until we
                confirm it with you. We're holding this time while we review.
              </p>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-brand-ink">What happens next</h2>
          <ol className="mt-5 space-y-5">
            {[
              {
                t: "We review your request",
                d: "We check your home's details, the estimated price, and the time you picked.",
              },
              {
                t: "We confirm the final price and time",
                d: `Expect to hear from us ${RESPONSE_TIME}, by phone or email. If anything changes, we'll tell you before your booking is final.`,
              },
              {
                t: "Your booking becomes final",
                d: "Once you approve the final price and time, you're on the schedule. We'll arrange entry details by phone then — never send door or alarm codes by email.",
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-deep text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-brand-ink">{s.t}</p>
                  <p className="mt-0.5 text-sm text-brand-slate">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover">
            <a href={`tel:${BRAND.phoneTel}`}>
              <Phone className="mr-2 size-5" aria-hidden /> Call {BRAND.phone}
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-14 border-brand-deep px-8 text-base text-brand-deep hover:bg-brand-sky-tint"
          >
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
