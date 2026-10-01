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
            Your booking is confirmed — no approval step needed. Here's the summary.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        {/* The estimate is NOT a confirmed booking */}
        <div className="rounded-2xl border border-brand-sky bg-brand-sky-tint p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-ink">
            <ClipboardList className="size-5 text-brand-deep" aria-hidden />
            Your booking is confirmed — here's your estimated quote
          </h2>
          {est ? (
            <>
              <p className="mt-4 text-2xl font-bold text-brand-ink">
                Estimated first visit: {cad(parseInt(est, 10))}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-brand-slate">{ESTIMATE_NOTICE}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-slate">{ESTIMATE_DIFFERENCE_NOTE}</p>
              <p className="mt-2 text-xs text-brand-slate">{TAX_NOTE}</p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-brand-slate">
              Your home's details fall outside our online estimator, so we'll confirm your
              price personally after reviewing your request.
            </p>
          )}
          {quoteRequired && (
            <p className="mt-4 text-sm font-medium text-brand-ink">
              No time was picked — we'll schedule your visit with you directly.
            </p>
          )}
        </div>

        {/* Booked time */}
        {when && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-slate-200 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-sky-soft text-brand-deep">
              <CalendarClock className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-brand-ink">Booked date &amp; time</p>
              <p className="mt-1 text-sm text-brand-slate">
                {when} (Winnipeg time) — your time is reserved. A confirmation email is on
                its way to you. Need to change it? Call {" "}
                <a href={`tel:${BRAND.phoneTel}`} className="font-semibold text-brand-deep">
                  {BRAND.phone}
                </a>
                .
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
                t: "Confirmation email",
                d: "You'll receive a confirmation email in the next few minutes with your booking details.",
              },
              {
                t: "We call about entry details",
                d: `We'll call you ${RESPONSE_TIME} before your visit to arrange access (keys, codes, parking) — never send door or alarm codes by email.`,
              },
              {
                t: "We clean",
                d: "Your team arrives during your booked window. The final price is confirmed on your home's actual details — we'll call first if anything changes.",
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
