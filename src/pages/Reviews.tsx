import { Link } from "react-router";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { ArrowRight, Star, Quote, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";
import { BRAND } from "@/lib/brand";
import { api } from "../convex/_generated/api";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// Shape of a REAL review row stored in the `reviews` Convex table.
// Mirrors the database schema; used to render `ReviewCard` either from
// live data (useQuery) or from a static fixture.
export type Testimonial = {
  name: string;
  neighbourhood: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  service: "Standard Cleaning" | "Deep Cleaning";
};

export default function Reviews() {
  const real = useQuery(api.reviewsList.listApproved) ?? [];
  const hasReviews = real.length > 0;

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
              {hasReviews ? (
                <>
                  What Winnipeg families are saying.{" "}
                  <span className="text-brand-deep">
                    {real.length} review{real.length === 1 ? "" : "s"} and counting.
                  </span>
                </>
              ) : (
                <>
                  Reviews,{" "}
                  <span className="text-brand-deep">coming soon.</span>
                </>
              )}
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              {hasReviews
                ? "Honest feedback from across Winnipeg — every review on this page was left by a real customer, after a real visit."
                : "ScrubFair is brand new in Winnipeg. We're earning our wall of reviews the right way \u2014 one careful visit at a time."}
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
                A note from Evelyn
              </p>
              <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
                Why I started ScrubFair.
              </h2>
              <div className="mt-6 space-y-4 text-lg text-brand-slate">
                <p>
                  Hi, I&rsquo;m Evelyn &mdash; the founder of ScrubFair. I
                  started this business with a simple idea: a cleaning service
                  should feel the way it feels when a really thoughtful friend
                  tidies your home. Quiet, careful, and without making you
                  feel like you need to apologise for the mess.
                </p>
                <p>
                  Winnipeg has given me a lot. I wanted to build a small
                  business that gives back &mdash; to the families who let us
                  into their homes, and to the neighbourhoods we work in. That
                  means showing up on time, doing the work the right way, and
                  never leaving a job until I&rsquo;d be happy to see it
                  myself.
                </p>
                <p>
                  We&rsquo;re new, which means every visit matters. If you
                  let us into your home, I want to earn your trust &mdash; and
                  your review &mdash; one visit at a time.
                </p>
              </div>
              <p className="mt-6 text-base font-semibold text-brand-ink">
                &mdash; Evelyn Egedegbe, Founder
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

      {/* ─────────── Reviews grid (live data or empty placeholders) ─────────── */}
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
              {hasReviews ? "What customers are saying" : "Be the first"}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
              {hasReviews
                ? "Real stories from Winnipeg homes."
                : "Earn your first review here."}
            </h2>
            <p className="mt-4 text-lg text-brand-slate">
              {hasReviews
                ? "Every review below was left by a real customer, after a real cleaning. Newest first."
                : "Three empty slots, ready for the first Winnipeg families who trust ScrubFair with a clean. After your visit, your story goes right here."}
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hasReviews
              ? real.map((review, i) => (
                  <ReviewCard
                    key={review._id}
                    review={{
                      name: review.name,
                      neighbourhood: review.neighbourhood,
                      rating: review.rating,
                      body: review.body,
                      service: review.service,
                    }}
                    index={i}
                  />
                ))
              : [1, 2, 3].map((i) => <ReviewPlaceholderCard key={i} index={i - 1} />)}
          </div>

          <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover"
            >
              <Link to="/leave-review">
                <Sparkles className="mr-2 size-5" aria-hidden />
                Leave your own review
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 border-brand-deep px-8 text-base text-brand-deep hover:bg-white"
            >
              <Link to="/contact">
                <Mail className="mr-2 size-5" aria-hidden />
                Email us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function ReviewCard({
  review,
  index,
}: {
  review: Testimonial;
  index: number;
}) {
  const initials = review.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.article
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      custom={index}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-brand"
    >
      <div className="flex items-center justify-between gap-3">
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-sm font-bold tracking-wide text-white ring-2 ring-white"
        >
          {initials || "?"}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-brand-slate">
          {review.neighbourhood}
        </span>
      </div>

      <div
        className="mt-4 flex gap-1 text-brand-deep"
        aria-label={`Rated ${review.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, s) => (
          <Star
            key={s}
            className={`size-4 ${
              s < review.rating ? "fill-current" : "text-slate-300"
            }`}
            aria-hidden
          />
        ))}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-slate">
        &ldquo;{review.body}&rdquo;
      </p>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-brand-ink">{review.name}</p>
        <p className="mt-0.5 text-xs text-brand-slate">{review.service} client</p>
      </div>
    </motion.article>
  );
}

function ReviewPlaceholderCard({ index }: { index: number }) {
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
          Be one of the first
        </span>
      </div>
      <div
        className="mt-4 flex gap-1 text-brand-deep"
        aria-label="Awaiting 5 out of 5 stars"
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="size-4" aria-hidden />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm text-brand-slate">
        &ldquo;Your story goes here &mdash; we&rsquo;re earning these one
        careful visit at a time.&rdquo;
      </p>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-brand-ink">
          Your name &middot; your neighbourhood
        </p>
        <p className="text-xs text-brand-slate">
          Standard or Deep Cleaning client
        </p>
      </div>
    </motion.article>
  );
}
