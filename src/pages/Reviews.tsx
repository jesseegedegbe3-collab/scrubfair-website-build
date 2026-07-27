import { Link } from "react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Star, Quote, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../convex/_generated/api";

// Mirrors the database shape for ReviewCard rendering.
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
    <div className="no-scroll-page grid h-full grid-cols-1 gap-3 p-3 md:grid-cols-12 md:gap-4 md:p-4">
      {/* LEFT — Header + founder's note */}
      <section className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-brand-sky-tint p-4 md:col-span-5 md:p-5">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            Reviews
          </p>
          <h1 className="mt-1 text-xl font-bold leading-tight text-brand-ink sm:text-2xl">
            {hasReviews ? (
              <>
                What Winnipeg families are saying.{" "}
                <span className="text-brand-deep">
                  {real.length} review{real.length === 1 ? "" : "s"} and
                  counting.
                </span>
              </>
            ) : (
              <>
                Reviews,{" "}
                <span className="text-brand-deep">coming soon.</span>
              </>
            )}
          </h1>
          <p className="mt-1 text-xs text-brand-slate sm:text-sm">
            {hasReviews
              ? "Every review below was left by a real customer, after a real visit."
              : "ScrubFair is brand new in Winnipeg — we're earning our wall of reviews one careful visit at a time."}
          </p>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            A note from Evelyn
          </p>
          <h2 className="mt-0.5 text-base font-bold leading-tight text-brand-ink sm:text-lg">
            Why I started ScrubFair.
          </h2>
          <div className="mt-2 space-y-2 text-xs leading-snug text-brand-slate sm:text-sm">
            <p>
              Hi, I'm Evelyn &mdash; the founder of ScrubFair. I started this
              business with a simple idea: a cleaning service should feel the
              way it feels when a really thoughtful friend tidies your home.
            </p>
            <p>
              Winnipeg has given me a lot. I wanted to build a small business
              that gives back — to the families who let us into their homes,
              and to the neighbourhoods we work in.
            </p>
            <p>
              We're new, which means every visit matters. If you let us into
              your home, I want to earn your trust — and your review — one
              visit at a time.
            </p>
          </div>
          <p className="mt-auto pt-2 text-xs font-semibold text-brand-ink">
            &mdash; Evelyn Egedegbe, Founder
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-deep p-2.5 text-white">
          <p className="text-xs font-semibold">Be the first to review.</p>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="h-7 bg-white px-2.5 text-[11px] font-semibold text-brand-deep hover:bg-brand-sky-tint"
            >
              <Link to="/leave-review">
                <Sparkles className="mr-1 size-3" aria-hidden />
                Leave a review
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] font-semibold text-white hover:bg-white/10"
            >
              <Link to="/contact">
                <Mail className="mr-1 size-3" aria-hidden />
                Email
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* RIGHT — Reviews grid */}
      <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white md:col-span-7">
        <div className="border-b border-slate-200 bg-white px-4 py-2.5">
          <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
            {hasReviews ? "What customers are saying" : "Be the first"}
          </p>
          <h2 className="mt-0.5 text-base font-bold text-brand-ink sm:text-lg">
            {hasReviews
              ? "Real stories from Winnipeg homes."
              : "Three slots, ready for the first reviews."}
          </h2>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2.5 overflow-hidden p-2.5 sm:grid-cols-2 md:grid-cols-3 md:gap-3 md:p-3">
          {!hasReviews &&
            [1, 2, 3].map((i) => (
              <ReviewPlaceholderCard key={i} index={i - 1} />
            ))}
          {hasReviews &&
            real.slice(0, 6).map((review, i) => (
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
            ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-brand-sky-tint px-4 py-2">
          <p className="text-[11px] text-brand-slate">
            Earned one visit at a time — share yours.
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              size="sm"
              className="h-7 px-2.5 text-[11px] font-semibold text-white"
            >
              <Link to="/leave-review">
                Leave yours
                <ArrowRight className="ml-1 size-3" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
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
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-deep text-[10px] font-bold tracking-wide text-white"
        >
          {initials || "?"}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-brand-slate">
          {review.neighbourhood}
        </span>
      </div>

      <div
        className="mt-1.5 flex gap-0.5 text-brand-deep"
        aria-label={`Rated ${review.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, s) => (
          <Star
            key={s}
            className={`size-2.5 ${
              s < review.rating ? "fill-current" : "text-slate-300"
            }`}
            aria-hidden
          />
        ))}
      </div>

      <p className="mt-1.5 flex-1 text-[11px] leading-snug text-brand-slate">
        &ldquo;{review.body}&rdquo;
      </p>

      <div className="mt-2 border-t border-slate-200 pt-1.5">
        <p className="text-[11px] font-semibold text-brand-ink">
          {review.name}
        </p>
        <p className="mt-0.5 text-[9px] text-brand-slate">
          {review.service} client
        </p>
      </div>
    </article>
  );
}

function ReviewPlaceholderCard({ index }: { index: number }) {
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white p-3">
      <div className="flex items-center justify-between">
        <Quote className="size-4 text-brand-deep" aria-hidden />
        <span className="rounded-full bg-brand-sky-soft px-1.5 py-0.5 text-[9px] font-medium text-brand-deep">
          Be one of the first
        </span>
      </div>
      <div
        className="mt-1.5 flex gap-0.5 text-brand-deep"
        aria-label="Awaiting 5 out of 5 stars"
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="size-2.5" aria-hidden />
        ))}
      </div>
      <p className="mt-1.5 flex-1 text-[11px] leading-snug text-brand-slate">
        &ldquo;Your story goes here &mdash; we&rsquo;re earning these one
        careful visit at a time.&rdquo;
      </p>
      <div className="mt-2 border-t border-slate-200 pt-1.5">
        <p className="text-[11px] font-semibold text-brand-ink">
          Your name &middot; your neighbourhood
        </p>
        <p className="text-[9px] text-brand-slate">
          Standard or Deep Cleaning client
        </p>
      </div>
    </article>
  );
}
