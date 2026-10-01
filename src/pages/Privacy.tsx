import { Link } from "react-router";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/brand";

const LAST_UPDATED = "September 26, 2026";

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
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Name</strong> — to address you in our reply
          </li>
          <li>
            <strong>Email</strong> — to send your quote and follow-up
            correspondence
          </li>
          <li>
            <strong>Phone number</strong> (optional) — so we can reach you
            quickly by call or text if you prefer
          </li>
          <li>
            <strong>Selected service</strong> — which of our services your
            inquiry relates to, so we can prepare an accurate quote
          </li>
          <li>
            <strong>Message</strong> — details about the home, square
            footage, pets, scheduling, or anything else you share
          </li>
        </ul>
        <p>
          When you use our <strong>booking request form</strong> (/book), we
          additionally collect, to prepare your estimated quote and reserve a
          time:
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Home service address</strong> (street, unit, city, postal
            code) — to confirm we serve your area and to schedule the right
            team
          </li>
          <li>
            <strong>Home details</strong> — square footage (excluding the
            basement), number of bedrooms and bathrooms, and home type — used
            only to calculate your estimate and estimate job length
          </li>
          <li>
            <strong>Service preferences</strong> — type of clean, frequency,
            add-ons, and the home's current condition
          </li>
          <li>
            <strong>Scheduling details</strong> — your requested date and
            time (held, not confirmed, until we confirm it with you)
          </li>
          <li>
            <strong>Practical notes</strong> — pets, preferred entry method,
            and any special requests you choose to share
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect passport numbers, payment card
          numbers, or any government-issued identifiers through this website.
          We do <strong>not</strong> ask for or store door codes, gate codes,
          alarm codes, or passwords through this website — entry details are
          only ever collected by phone after a booking is confirmed. No
          online payment is taken through this site. Payment processing
          happens offline after a quote is accepted.
        </p>
        <p>
          If you submit a review through our website, the review text,
          rating, and the display name you provide are published on our
          Reviews page. Please do not include personal details in a review
          that you would not want visible to other visitors.
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
        customer — communicate with you about upcoming bookings. Booking
        requests are reviewed by our team before any booking is confirmed,
        and your requested time is held (not guaranteed) until we confirm.
        We do not sell, rent, or trade your personal information. We do not
        use your information for automated profiling or marketing
        decision-making.
      </p>
    ),
  },
  {
    id: "third-party-processors",
    title: "4. Third-party processors (who we share your data with)",
    body: (
      <>
        <p>
          To deliver the contact-form experience and route quote requests
          to our team, ScrubFair uses a small number of secure, vetted
          third-party service providers. When you submit our contact form,
          your name, email, phone number, and message are transmitted to:
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>Convex (database hosting on Amazon Web Services in
            Canada / North America)</strong> — to securely store your
            submission in our private database so we can track, prioritize,
            and respond to your inquiry.
          </li>
          <li>
            <strong>Resend (transactional email delivery)</strong> — to route
            an automated notification email to our internal business inbox
            (<code>{BRAND.email}</code>) with your submission details and
            your email address set as the reply-to.
          </li>
          <li>
            <strong>Telegram (Bot API, internal notification)</strong> — to
            send a private, instant text notification to our team's mobile
            devices via our private Telegram bot. Only the ScrubFair
            operators receive these messages; nothing is forwarded to a
            third party through Telegram.
          </li>
        </ul>
        <p>
          Each of these service providers is contractually or
          technically limited to processing your information on ScrubFair's
          behalf, for the sole purpose of delivering a quote response.
          They do not use your data for their own marketing, and we do not
          share your data with any other party.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "5. How long we keep your information",
    body: (
      <p>
        We retain your submission and any related correspondence for as
        long as our business relationship is active, and for up to{" "}
        <strong>two (2) years</strong> after your last interaction with us,
        for bookkeeping, service-quality follow-up, and audit purposes.
        You may ask us to delete your information at any time (see Section
        7 below) and we will do so promptly, except where retention is
        required by Canadian tax or record-keeping law.
      </p>
    ),
  },
  {
    id: "cookies-and-tracking",
    title: "6. Cookies and analytics",
    body: (
      <>
        <p>
          This website uses <strong>Google Ads</strong> measurement tags to
          understand how visitors find us and whether our advertising is
          effective. When you visit scrubfair.ca, Google may set cookies on
          your device and collect information such as pages visited and how
          you arrived at the site. This data may be used by Google to
          measure ad performance and, per Google's policies, may be shared
          with other Google services.
        </p>
        <p>
          You can opt out of Google Ads measurement at{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-deep underline-offset-4 hover:underline"
          >
            adssettings.google.com
          </a>{" "}
          or by adjusting your browser's cookie settings. We do not run
          remarketing or advertising campaigns that build individual
          profiles of visitors.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: (
      <>
        7. Your rights: access, correction, and deletion{" "}
        <span className="text-sm font-normal text-brand-slate">
          (PIPEDA Principles 8 &amp; 9)
        </span>
      </>
    ),
    body: (
      <>
        <p>
          You have the right to know what personal information we have on
          file for you, to request correction of anything inaccurate, and
          to request permanent deletion of your information.
        </p>
        <p>
          To exercise any of these rights, email{" "}
          <Link
            to="/contact"
            className="font-semibold text-brand-deep underline-offset-4 hover:underline"
          >
            {BRAND.email}
          </Link>{" "}
          with the subject line "Privacy request." We will acknowledge
          your request within <strong>5 business days</strong> and respond
          substantively within <strong>30 days</strong>, as required by
          PIPEDA.
        </p>
        <p>
          If you are not satisfied with our response, you have the right
          to escalate a complaint to the Office of the Privacy
          Commissioner of Canada.
        </p>
      </>
    ),
  },
  {
    id: "safeguards",
    title: (
      <>
        8. How we protect your information{" "}
        <span className="text-sm font-normal text-brand-slate">
          (PIPEDA Principle 5)
        </span>
      </>
    ),
    body: (
      <p>
        Submitted data is transmitted over HTTPS, stored in an
        authenticated Convex database with role-based access controls, and
        only accessible to authorized ScrubFair operators. We restrict
        access on a need-to-know basis and revoke credentials when staff
        or contractors leave the business.
      </p>
    ),
  },
  {
    id: "contact",
    title: "9. Contact us — our privacy officer",
    body: (
      <p>
        For any privacy-related question, concern, or access request,
        please contact our privacy officer:
      </p>
    ),
  },
] as const;

export function Privacy() {
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
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-brand-slate">
              How ScrubFair collects, uses, and protects your personal
              information in Winnipeg, Manitoba — in compliance with
              Canada's PIPEDA.
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

              {/* Contact card lives under §9 */}
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
            <ShieldCheck
              className="mx-auto size-8 text-brand-deep"
              aria-hidden
            />
            <p className="mt-3 text-base text-brand-ink">
              Questions about your privacy or this policy?
            </p>
            <Link
              to="/contact"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-ink"
            >
              Reach out
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Privacy;
