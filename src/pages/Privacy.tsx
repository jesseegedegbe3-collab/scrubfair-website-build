import { motion } from "framer-motion";
import { Link } from "react-router";
import { Mail, Phone, ShieldCheck, FileText } from "lucide-react";
import { ScrollHint } from "@/components/ScrollHint";
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
            <strong>Message</strong> — details about the home, preferred
            service, square footage, pets, scheduling
          </li>
          <li>
            <strong>Referrer / page source</strong> (technical, optional) —
            the URL of the page you submitted the form from, used only to
            understand which marketing channels are working
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect passport numbers, payment card
          numbers, or any government-issued identifiers through this
          website. Payment processing happens offline after a quote is
          accepted.
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
        customer — communicate with you about upcoming bookings. We do not
        sell, rent, or trade your personal information. We do not use your
        information for automated profiling or marketing decision-making.
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
    title: "6. Cookies and tracking",
    body: (
      <p>
        <strong>scrubfair.ca currently uses no cookies, no tracking
        pixels, and no third-party analytics.</strong> We only use
        essential, first-party HTML and CSS — no Google Analytics, no
        Facebook Pixel, no advertising cookies. If we ever add analytics
        or cookies in the future, we will update this section and, where
        required by Canadian privacy law, ask for your consent before
        setting any non-essential cookies.
      </p>
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
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
          </motion.div>

          <ScrollHint />
        </div>
      </section>

      {/* Template banner */}
      <section className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <FileText
              className="mt-0.5 size-5 shrink-0 text-amber-700"
              aria-hidden
            />
            <p className="text-sm text-amber-900">
              <strong>Template copy.</strong> This policy is provided as
              starting language for our website and remains subject to
              final review by a Canadian legal professional before being
              relied upon. It does not constitute legal advice.
            </p>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 sm:px-6 lg:px-8">
          {SECTIONS.map((section, idx) => (
            <motion.article
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.05 * idx,
              }}
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
            </motion.article>
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
