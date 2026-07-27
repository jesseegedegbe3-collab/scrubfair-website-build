import { Link } from "react-router";
import { Mail, Phone, ShieldCheck, FileText } from "lucide-react";
import { BRAND } from "@/lib/brand";

const LAST_UPDATED = "July 26, 2026";

const SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction & scope",
    body: (
      <>
        <p>
          At ScrubFair, we treat your home with care — and that extends to
          your personal information. This Privacy Policy explains how we
          collect, use, store, and protect the information you give us when
          you visit <strong>scrubfair.ca</strong> or request a quote or
          cleaning booking in Winnipeg, Manitoba.
        </p>
        <p>
          ScrubFair is the data controller for the personal information
          described in this policy. We handle your data in accordance with
          Canada's <em>Personal Information Protection and Electronic
          Documents Act</em> (PIPEDA) and the related fair information
          principles in PIPEDA's Schedule 1.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "2. What personal information we collect",
    body: (
      <>
        <p>
          We collect personal information directly from you, and only when
          you choose to provide it:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Name</strong> — to address you in our reply
          </li>
          <li>
            <strong>Email</strong> — for your quote and follow-up
          </li>
          <li>
            <strong>Phone number</strong> (optional)
          </li>
          <li>
            <strong>Message</strong> — details about the home and service
            requested
          </li>
          <li>
            <strong>Referrer / page source</strong> (technical)
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect passport numbers, payment card
          numbers, or any government-issued identifiers through this
          website. Payment processing happens offline.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How we use your information",
    body: (
      <p>
        We use the information you submit solely to respond to your inquiry,
        prepare and confirm a quote, schedule service, and — once you're a
        customer — communicate about upcoming bookings. We do not sell,
        rent, or trade your personal information. We do not use your
        information for automated profiling or marketing decision-making.
      </p>
    ),
  },
  {
    id: "third-party-processors",
    title: "4. Third-party processors",
    body: (
      <>
        <p>
          To deliver the contact-form experience and route quote requests,
          ScrubFair uses a small number of secure, vetted third-party
          providers:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Convex</strong> (database hosting on AWS in North
            America) — to securely store your submission.
          </li>
          <li>
            <strong>Resend</strong> (transactional email delivery) — to route
            an email to <code>{BRAND.email}</code>.
          </li>
          <li>
            <strong>Telegram</strong> (internal Bot API) — to send a private
            text notification to our team's devices.
          </li>
        </ul>
        <p>
          Each provider is limited to processing your information for the
          sole purpose of delivering a quote response.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "5. How long we keep your information",
    body: (
      <p>
        We retain your submission for as long as our business relationship
        is active, and for up to <strong>two (2) years</strong> after your
        last interaction with us. You may ask us to delete your information
        at any time (see Section 7) and we will do so promptly, except where
        retention is required by Canadian tax or record-keeping law.
      </p>
    ),
  },
  {
    id: "cookies-and-tracking",
    title: "6. Cookies and tracking",
    body: (
      <p>
        <strong>scrubfair.ca currently uses no cookies, no tracking pixels,
        and no third-party analytics.</strong> No Google Analytics, no
        Facebook Pixel, no advertising cookies. If we ever add analytics or
        cookies, we will update this section and, where required by
        Canadian privacy law, ask for your consent.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "7. Your rights (PIPEDA Principles 8 & 9)",
    body: (
      <>
        <p>
          You have the right to know what personal information we have on
          file, request correction of anything inaccurate, and request
          permanent deletion.
        </p>
        <p>
          To exercise any right, email{" "}
          <Link
            to="/contact"
            className="font-semibold text-brand-deep underline-offset-4 hover:underline"
          >
            {BRAND.email}
          </Link>{" "}
          with subject "Privacy request." We will acknowledge within{" "}
          <strong>5 business days</strong> and respond substantively within{" "}
          <strong>30 days</strong>, as required by PIPEDA.
        </p>
        <p>
          If not satisfied, you have the right to escalate to the Office of
          the Privacy Commissioner of Canada.
        </p>
      </>
    ),
  },
  {
    id: "safeguards",
    title: "8. How we protect your information (Principle 5)",
    body: (
      <p>
        Submitted data is transmitted over HTTPS, stored in an authenticated
        Convex database with role-based access controls, and only accessible
        to authorized ScrubFair operators. We restrict access on a
        need-to-know basis and revoke credentials when staff leave.
      </p>
    ),
  },
  {
    id: "contact",
    title: "9. Contact our privacy officer",
    body: (
      <p>
        For any privacy-related question, concern, or access request:
      </p>
    ),
  },
];

export function Privacy() {
  return (
    <div className="no-scroll-page flex h-full flex-col gap-3 p-3 md:gap-4 md:p-4">
      <header className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-brand-sky-tint px-4 py-2.5 md:col-span-8 md:px-5">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
              Legal
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-brand-ink sm:text-xl">
              Privacy Policy
            </h1>
            <p className="mt-0.5 text-xs text-brand-slate sm:text-sm">
              How ScrubFair protects your information under PIPEDA.
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
            <strong>Template copy.</strong> Subject to final review by a
            Canadian legal professional before being relied upon. Not legal
            advice.
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
          <ShieldCheck className="size-4 text-brand-deep" aria-hidden />
          Questions about this policy?
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-full bg-brand-deep px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand-ink"
        >
          Reach out
        </Link>
      </div>
    </div>
  );
}

export default Privacy;
