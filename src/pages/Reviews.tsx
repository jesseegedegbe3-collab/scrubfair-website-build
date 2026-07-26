import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Star, Quote, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";
import { BRAND } from "@/lib/brand";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// Shape for a real testimonial. When the first reviews come in, replace the
// empty placeholders below with real objects in this shape.
export type Testimonial = {
  name: string;
  neighbourhood: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  service: "Standard Cleaning" | "Deep Cleaning";
};

const PLACEHOLDER_CARDS: { id: number; service: Testimonial["service"] }[] = [
  { id: 1, service: "Standard Cleaning" },
  { id: 2, service: "Deep Cleaning" },
  { id: 3, service: "Standard Cleaning" },
];

export default function Reviews() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white"
    >
      {/* ─────────── Page header ─────────── */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              Reviews
            </p>
            <h1 className="mt-3 text-4xl font-bold text-brand-ink sm:text-5xl">
              We're just getting started —{" "}
              <span className="text-brand-deep">and we'd love your story.</span>
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              ScrubFair is brand new in Winnipeg. We don't have a wall of
              reviews yet — and we don't want to fake one. Here's the story of
              why we started, and how you can help us earn our first.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─────────── Founder's note ─────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="grid gap-10 lg:grid-cols-5 lg:items-center"
          >
            <div className="lg:col-span-3">
              <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
                A note from Evelyne
              </p>
              <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
                Why I started ScrubFair.
              </h2>
              <div className="mt-6 space-y-4 text-lg text-brand-slate">
                <p>
                  Hi, I'm Evelyne — the founder of ScrubFair. I started this
                  business with a simple idea: a cleaning service should feel
                  the way it feels when a really thoughtful friend tidies your
                  home. Quiet, careful, and without making you feel like you
                  need to apologize for the mess.
                </p>
                <p>
                  Winnipeg has given me a lot. I wanted to build a small
                  business that gives back — to the families who let us into
                  their homes, and to the neighbourhoods we work in. That
                  means showing up on time, doing the work the right way, and
                  never leaving a job until I'd be happy to see it myself.
                </p>
                <p>
                  We're new, which means every visit matters. If you let us
                  into your home, I want to earn your trust — and your review
                  — one visit at a time.
                </p>
              </div>
              <p className="mt-6 text-base font-semibold text-brand-ink">
                — Evelyne Gedegbe, Founder
              </p>
            </div>

            <div className="relative lg:col-span-2">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-brand-sky-soft" />
              <img
                src={IMAGES.reviewBathroom}
                alt="Clean, calm bathroom interior"
                className="relative h-[460px] w-full rounded-2xl bg-brand-sky-tint object-cover shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────── Reviews grid (placeholder, ready for real testimonials) ─────────── */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              What our customers are saying
            </p>
            <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
              Reviews coming soon.
            </h2>
            <p className="mt-4 text-lg text-brand-slate">
              As we serve more Winnipeg homes, we'll share real, unedited
              reviews from our customers here. Book a visit and yours could be
              the first.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PLACEHOLDER_CARDS.map((card, i) => (
              <ReviewPlaceholderCard key={card.id} index={i} {...card} />
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover"
            >
              <Link to="/contact">
                Be our first review
                <ArrowRight className="ml-2 size-5" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 border-brand-deep px-8 text-base text-brand-deep hover:bg-white"
            >
              <a href={`mailto:${BRAND.email}`}>
                <Mail className="mr-2 size-5" aria-hidden />
                Email us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function ReviewPlaceholderCard({
  index,
  service,
}: {
  index: number;
  service: Testimonial["service"];
}) {
  return (
    <motion.article
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      custom={index}
      className="flex h-full flex-col rounded-2xl border border-dashed border-slate-300 bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <Quote className="size-7 text-brand-deep" aria-hidden />
        <span className="rounded-full bg-brand-sky-soft px-2.5 py-0.5 text-xs font-medium text-brand-deep">
          Coming soon
        </span>
      </div>
      <div className="mt-4 flex gap-1 text-brand-deep">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="size-4" aria-hidden />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm text-brand-slate">
        "Your review could go here — we're earning these one home at a time."
      </p>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-brand-ink">
          Your name, your neighbourhood
        </p>
        <p className="text-xs text-brand-slate">{service} client</p>
      </div>
    </motion.article>
  );
}
