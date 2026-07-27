import { Link } from "react-router";
import { Mail, Phone, FileText, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";

const LAST_UPDATED = "July 26, 2026";

const SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction",
    body: (
      <p>
        Welcome to ScrubFair. These Terms of Service govern your use of{" "}
        <strong>scrubfair.ca</strong> and any cleaning service we provide to
        you in Winnipeg, Manitoba. By requesting a quote, booking a clean,
        or otherwise using our services, you agree to these terms. If you
        do not agree, please do not use our services.
      </p>
    ),
  },
  {
    id: "service-area",
    title: "2. Service description & service area",
    body: (
      <p>
        ScrubFair provides <strong>residential cleaning services</strong> —
        specifically our Standard and Deep Cleaning packages — exclusively
        within <strong>Winnipeg, Manitoba, Canada</strong>. We do not
        currently service areas outside Winnipeg.
      </p>
    ),
  },
  {
    id: "quotes-booking",
    title: "3. Quotes & booking",
    body: (
      <>
        <p>
          Submitting our contact form creates a <strong>request for a
          quote</strong>, not a binding contract. Quotes are prepared
          manually and sent back to you via email or phone. A booking
          becomes firm only when:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>You have received a written quote from us</li>
          <li>You have confirmed the date and scope by reply</li>
          <li>We have acknowledged your confirmation</li>
        </ul>
      </>
    ),
  },
  {
    id: "guarantee",
    title: "4. Satisfaction guarantee",
    body: (
      <p>
        We stand behind every clean. If something is off after a service,
        let us know within <strong>24 hours</strong> and we will come back
        to make it right at no additional charge. Send a photo and a note to{" "}
        <Link
          to="/contact"
          className="font-semibold text-brand-deep underline-offset-4 hover:underline"
        >
          {BRAND.email}
        </Link>{" "}
        or text us at{" "}
        <a
          href={`tel:${BRAND.phoneTel}`}
          className="font-semibold text-brand-deep underline-offset-4 hover:underline"
        >
          {BRAND.phone}
        </a>
        .
      </p>
    ),
  },
  {
    id: "refuse-service",
    title: "5. Right to refuse or stop service",
    body: (
      <>
        <p>
          We reserve the right to decline or stop a job if, in our sole
          reasonable judgment, we encounter:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Biohazards (blood, raw sewage, bodily fluids)</li>
          <li>Black mold or hazardous biological contamination</li>
          <li>Extreme hoarding requiring remediation</li>
          <li>Unsafe physical conditions (hostile environment, hazards)</li>
          <li>Active pest infestations until professionally treated</li>
        </ul>
      </>
    ),
  },
  {
    id: "payments-cancellations",
    title: "6. Payments & cancellations (placeholder)",
    body: (
      <>
        <p>
          Final payment terms, accepted methods, and cancellation rules are
          confirmed in the quote email. Common expectations:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Payment due on day of service unless arranged in writing</li>
          <li>Free cancellation &gt; <strong>24 hours</strong> before</li>
          <li>Late cancellations may incur a trip fee</li>
          <li>Written policy alongside every quote</li>
        </ul>
      </>
    ),
  },
  {
    id: "liability",
    title: "7. Limitation of liability",
    body: (
      <p>
        We take great care with your home. If something is damaged as a
        direct result of our work, we will repair or reimburse the
        reasonable replacement cost — please report it within 24 hours.
        ScrubFair is not liable for pre-existing damage, items left in
        unusual positions, deeply ingrained stains requiring specialty
        restoration, indirect or consequential damages, or losses outside
        our reasonable control.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "8. Governing law",
    body: (
      <p>
        These terms are governed by the laws of the{" "}
        <strong>Province of Manitoba</strong> and the federal laws of Canada
        applicable therein. Any dispute will be handled first through
        good-faith conversation; if that fails, through the courts of
        Manitoba.
      </p>
    ),
  },
  {
    id: "changes",
    title: "9. Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The "Last updated"
        date reflects the most recent revision. Continued use of our
        services after a change constitutes acceptance. For material
        changes, we will make a reasonable effort to notify active
        customers by email.
      </p>
    ),
  },
  {
    id: "contact",
    title: "10. Contact us",
    body: (
      <p>
        Questions about these terms, your booking, or anything else? Reach
        out:
      </p>
    ),
  },
];

export function Terms() {
  return (
    <div className="no-scroll-page flex h-full flex-col gap-3 p-3 md:gap-4 md:p-4">
      <header className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-brand-sky-tint px-4 py-2.5 md:col-span-8 md:px-5">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
              Legal
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-brand-ink sm:text-xl">
              Terms of Service
            </h1>
            <p className="mt-0.5 text-xs text-brand-slate sm:text-sm">
              The rules for using scrubfair.ca and hiring ScrubFair.
            </p>
          </div>
          <p className="text-[10px] text-brand-slate">
            Last updated: <strong>{LAST_UPDATED}</strong>
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-2.5 md:col-span-4 md:p-3">
          <FileText
            className="mt-0.5 size-4 shrink-0 text-amber-700"
            aria-hidden
          />
          <p className="text-[11px] leading-snug text-amber-900">
            <strong>Template copy.</strong> Subject to final review. Sections
            marked "placeholder" (e.g. payment) will be finalized in the
            quote email.
          </p>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 md:p-5 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <article
            key={section.id}
            id={section.id}
            className="min-h-0 break-inside-avoid"
          >
            <h2 className="text-sm font-semibold tracking-tight text-brand-ink">
              {section.title}
            </h2>
            <div className="mt-2 space-y-2 text-[12px] leading-snug text-brand-slate">
              {section.body}
            </div>

            {section.id === "contact" && (
              <div className="mt-2 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex items-start gap-2">
                  <Mail
                    className="mt-0.5 size-3.5 shrink-0 text-brand-deep"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-brand-slate uppercase">
                      Email
                    </p>
                    <Link
                      to="/contact"
                      className="text-xs font-semibold text-brand-ink hover:text-brand-deep"
                    >
                      {BRAND.email}
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone
                    className="mt-0.5 size-3.5 shrink-0 text-brand-deep"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-brand-slate uppercase">
                      Phone
                    </p>
                    <a
                      href={`tel:${BRAND.phoneTel}`}
                      className="text-xs font-semibold text-brand-ink hover:text-brand-deep"
                    >
                      {BRAND.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-sky/40 bg-brand-sky-tint px-4 py-2.5">
        <p className="flex items-center gap-2 text-xs text-brand-ink sm:text-sm">
          <Sparkles className="size-4 text-brand-deep" aria-hidden />
          Ready to book a clean?
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-full bg-brand-deep px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand-ink"
        >
          Request a quote
        </Link>
      </div>
    </div>
  );
}

export default Terms;
