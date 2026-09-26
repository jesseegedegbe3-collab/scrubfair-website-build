import { Link } from "react-router";
import { Mail, Phone, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";

const LAST_UPDATED = "September 26, 2026";

const SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction",
    body: (
      <p>
        Welcome to ScrubFair. These Terms of Service govern your use of{" "}
        <strong>scrubfair.ca</strong> and any cleaning service we provide
        to you in Winnipeg, Manitoba. By requesting a quote, booking a
        clean, or otherwise using our services, you agree to these terms.
        If you do not agree, please do not use our services.
      </p>
    ),
  },
  {
    id: "service-area",
    title: "2. Service description & service area",
    body: (
      <>
        <p>
          ScrubFair provides cleaning services — including Standard
          Cleaning, Deep Cleaning, Commercial Cleaning, Move In / Move Out
          Cleaning, Showhome Cleaning, Post-Construction Cleaning, and
          Carpet Cleaning — exclusively within{" "}
          <strong>Winnipeg, Manitoba, Canada</strong>. We do not currently
          service areas outside Winnipeg. Quotes for locations outside the
          service area will not be issued.
        </p>
        <p>
          The exact scope of work for each visit is confirmed in your
          written quote. Some specialized situations (heavy biohazard
          remediation, hazardous-material removal, restoration after
          fire or flood) are outside our scope and may be declined.
        </p>
      </>
    ),
  },
  {
    id: "quotes-booking",
    title: "3. Quotes & booking",
    body: (
      <>
        <p>
          Submitting our contact form creates a <strong>request for a
          quote</strong>, not a binding service contract. Quotes are
          prepared manually by our team and sent back to you via email or
          phone. A booking becomes firm only when:
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>You have received a written quote from us</li>
          <li>You have confirmed the service date and scope by reply</li>
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
        We stand behind every clean. If something is off after a service
        — a missed surface, a streaky window, a dusty baseboard — let us
        know within <strong>24 hours</strong> of the clean and we will
        come back to make it right at no additional charge. Just send a
        quick photo and a note to{" "}
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
      <p>
        For the safety of our staff and the integrity of our equipment,
        we reserve the right to decline or stop a job if we encounter, in
        our sole reasonable judgment:
      </p>
    ),
  },
  {
    id: "payments-cancellations",
    title: "6. Payments & cancellations",
    body: (
      <>
        <p>
          Payment is due on the day of service unless otherwise agreed in
          writing in your quote. We accept e-transfer and cash; receipts
          are provided for every payment.
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            Cancellations or reschedules made more than{" "}
            <strong>24 hours</strong> before the scheduled appointment are
            free of charge.
          </li>
          <li>
            Cancellations within <strong>24 hours</strong> of the
            appointment, or lock-out/no-access situations where our team
            arrives and cannot begin work, may incur a trip fee of{" "}
            <strong>$50</strong>.
          </li>
          <li>
            If we must reschedule for reasons within our control, we will
            offer you the next available appointment at no penalty.
          </li>
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
        unusual positions, deeply ingrained stains that require
        specialty restoration, indirect or consequential damages, or
        losses resulting from circumstances outside our reasonable
        control (power outages, frozen pipes, acting on inaccurate
        information you provided, etc.).
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "8. Governing law",
    body: (
      <p>
        These terms are governed by the laws of the{" "}
        <strong>Province of Manitoba</strong> and the federal laws of
        Canada applicable therein. Any dispute will be handled first
        through good-faith conversation; if that fails, through the
        courts of Manitoba.
      </p>
    ),
  },
  {
    id: "changes",
    title: "9. Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The "Last updated"
        date at the top of this page reflects the most recent revision.
        Continued use of our services after a change constitutes
        acceptance of the updated terms. For material changes (e.g., to
        the cancellation policy or the satisfaction guarantee), we will
        make a reasonable effort to notify active customers by email.
      </p>
    ),
  },
  {
    id: "contact",
    title: "10. Contact us",
    body: (
      <p>
        Questions about these terms, your booking, or anything else?
        Reach out:
      </p>
    ),
  },
] as const;

const REFUSAL_EXAMPLES = [
  "Biohazards (blood, raw sewage, bodily fluids)",
  "Black mold or other hazardous biological contamination",
  "Extreme hoarding requiring professional remediation",
  "Unsafe physical conditions (unsecured pets, structural hazards, hostile or threatening environment)",
  "Active pest infestations until professionally treated",
];

export function Terms() {
  return (
    <main id="main" className="bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-brand-sky-tint">
        <div className="mx-auto max-w-3xl px-4 pt-16 pb-3 sm:px-6 lg:px-8">
          <div
                     >
            <p className="text-xs font-semibold tracking-wide text-brand-deep uppercase">
              Legal
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-brand-slate">
              The rules and expectations for using scrubfair.ca and hiring
              ScrubFair for residential cleaning in Winnipeg.
            </p>
            <p className="mt-3 text-xs text-brand-slate">
              Last updated: <strong>{LAST_UPDATED}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 sm:px-6 lg:px-8">
          {SECTIONS.map((section, idx) => (
            <article
              key={section.id}
              id={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-brand-ink">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-base leading-relaxed text-brand-slate">
                {section.body}
              </div>

              {/* Refusal examples list under §5 */}
              {section.id === "refuse-service" && (
                <ul className="mt-3 ml-5 list-disc space-y-1.5 text-base leading-relaxed text-brand-slate">
                  {REFUSAL_EXAMPLES.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}

              {/* Contact card lives under §10 */}
              {section.id === "contact" && (
                <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 size-5 shrink-0 text-brand-deep"
                      aria-hidden
                    />
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-brand-slate uppercase">
                        Email
                      </p>
                      <Link
                        to="/contact"
                        className="text-base font-semibold text-brand-ink hover:text-brand-deep"
                      >
                        {BRAND.email}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone
                      className="mt-0.5 size-5 shrink-0 text-brand-deep"
                      aria-hidden
                    />
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-brand-slate uppercase">
                        Phone
                      </p>
                      <a
                        href={`tel:${BRAND.phoneTel}`}
                        className="text-base font-semibold text-brand-ink hover:text-brand-deep"
                      >
                        {BRAND.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}

          {/* Footer-of-page CTA */}
          <div className="rounded-2xl border border-brand-sky/40 bg-brand-sky-tint p-7 text-center sm:p-8">
            <Sparkles
              className="mx-auto size-8 text-brand-deep"
              aria-hidden
            />
            <p className="mt-3 text-base text-brand-ink">
              Ready to book a clean?
            </p>
            <Link
              to="/contact"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink"
            >
              Request a quote
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Terms;
