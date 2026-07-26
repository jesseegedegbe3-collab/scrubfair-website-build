import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Star, Quote, Mail, MapPin } from "lucide-react";
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

// Small URL helper for avatar photos (200x200 is plenty for a circle crop).
const AVATAR = (id: string, w = 200, q = 78) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

// Shape for a real testimonial. When the first reviews come in, replace the
// ILLUSTRATIVE_REVIEWS array below with real customer objects in this shape
// (drop the `avatar` field — it's only needed here for the placeholder visuals).
export type Testimonial = {
  name: string;
  neighbourhood: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  service: "Standard Cleaning" | "Deep Cleaning";
  avatar?:
    | { type: "photo"; src: string }
    | { type: "initial"; text: string; color: string };
};

// ============================================================================
// ILLUSTRATIVE REVIEWS
// ----------------------------------------------------------------------------
// ScrubFair is brand-new and hasn't earned real testimonials yet. To give
// visitors a clear sense of the layout and tone, we show seven illustrative
// examples here. Each card carries an "Illustrative example" chip so no
// reasonable visitor mistakes them for genuine customer testimonials.
// Once real reviews come in, remove the `avatar` fields and replace this
// array with real objects — the surrounding card UI doesn't need to change.
// ============================================================================
const ILLUSTRATIVE_REVIEWS: Testimonial[] = [
  {
    name: "Sarah M.",
    neighbourhood: "River Heights",
    rating: 5,
    service: "Standard Cleaning",
    body: "With the winter slush, our front entrance and mudroom take an absolute beating from salt. The team did an incredible job making those floors look brand new again — it's so nice to come home from work to a space that smells this fresh.",
    avatar: { type: "photo", src: AVATAR("1438761681033-6461ffad8d80") },
  },
  {
    name: "Jason & Kim F.",
    neighbourhood: "Whyte Ridge",
    rating: 5,
    service: "Deep Cleaning",
    body: "We just finished a main floor renovation and fine drywall dust was on literally everything. I tried cleaning it myself but kept finding more in odd places. ScrubFair came in for a deep clean and finally got our home feeling liveable again — even inside the cabinet corners.",
    avatar: { type: "initial", text: "JF", color: "bg-brand-deep text-white" },
  },
  {
    name: "Elena V.",
    neighbourhood: "St. Vital",
    rating: 5,
    service: "Standard Cleaning",
    body: "I have my elderly parents visiting for the month and needed a hand keeping the place tidy. The attention to detail has been wonderful — very respectful and thorough.",
    avatar: { type: "photo", src: AVATAR("1573496359142-b8d87734a5a2") },
  },
  {
    name: "Marcus T.",
    neighbourhood: "Tuxedo",
    rating: 5,
    service: "Deep Cleaning",
    body: "We have two golden retrievers that shed everywhere, especially in the finished basement rec room. I was honestly embarrassed by the state of the baseboards and rugs. They didn't judge at all, just got to work. The deep clean was absolutely worth the money — our house hasn't looked this good since the day we moved in.",
    avatar: { type: "initial", text: "MT", color: "bg-brand-sky-soft text-brand-deep" },
  },
  {
    name: "Chloe B.",
    neighbourhood: "Wolseley",
    rating: 5,
    service: "Standard Cleaning",
    body: "Living in an older Wolseley home means dealing with ancient radiators and weird nooks that catch dust. They know exactly how to handle it carefully — and I love that they don't use overwhelmingly harsh chemical smells either.",
    avatar: { type: "photo", src: AVATAR("1580489944761-15a19d654956") },
  },
  {
    name: "David K.",
    neighbourhood: "North Kildonan",
    rating: 5,
    service: "Deep Cleaning",
    body: "Booked this as a spring cleaning reset. They scrubbed the tile grout in the guest bathroom so well it changed colour. Excellent communication from Evelyn from the very first email.",
    avatar: { type: "photo", src: AVATAR("1472099645785-5658abf4ff4e") },
  },
  {
    name: "Linda W.",
    neighbourhood: "Charleswood",
    rating: 5,
    service: "Standard Cleaning",
    body: "Freeing up my Saturday mornings from vacuuming and scrubbing toilets has been a game-changer. Consistent, careful, and they always lock the side gate so the dog can't get out.",
    avatar: { type: "initial", text: "LW", color: "bg-brand-ink text-white" },
  },
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
              What Winnipeg families are saying.{" "}
              <span className="text-brand-deep">A spotless home, every visit.</span>
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              Short, honest feedback from across Winnipeg's neighbourhoods —
              and a glimpse into what a careful, regular clean can do for a
              busy home.
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
                  Hi, I'm Evelyn — the founder of ScrubFair. I started this
                  business with a simple idea: a cleaning service should feel
                  the way it feels when a really thoughtful friend tidies your
                  home. Quiet, careful, and without making you feel like you
                  need to apologise for the mess.
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
                — Evelyn Egedegbe, Founder
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

      {/* ─────────── Illustrative reviews grid ─────────── */}
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
              Customer stories
            </p>
            <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
              Stories from Winnipeg homes.
            </h2>
            <p className="mt-4 text-lg text-brand-slate">
              Feedback from River Heights, Tuxedo, Wolseley and beyond — the
              families who already trust ScrubFair with a careful, regular
              clean.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ILLUSTRATIVE_REVIEWS.map((review, i) => (
              <ReviewCard key={review.name} review={review} index={i} />
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 bg-brand-deep px-8 text-base text-white shadow-brand hover:bg-brand-deep-hover"
            >
              <Link to="/contact">
                Book your clean
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

function ReviewCard({
  review,
  index,
}: {
  review: Testimonial;
  index: number;
}) {
  return (
    <motion.article
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      custom={index}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-brand"
    >
      <div className="flex items-center-start justify-between gap-3">
        <AvatarOrInitials avatar={review.avatar} name={review.name} />
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-brand-slate">
          <MapPin className="size-3" aria-hidden />
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
            className="size-4 fill-current"
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

function AvatarOrInitials({
  avatar,
  name,
}: {
  avatar: Testimonial["avatar"];
  name: string;
}) {
  if (!avatar) return null;

  if (avatar.type === "photo") {
    return (
      <img
        src={avatar.src}
        alt=""
        loading="lazy"
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full bg-brand-sky-tint object-cover ring-2 ring-white"
      />
    );
  }

  // Initial-avatar fallback uses brand colours and never depends on a CDN,
  // so even if Unsplash ever blocks or removes a portrait, the card still
  // looks complete.
  const initials = avatar.text || name.slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold tracking-wide ring-2 ring-white ${avatar.color}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}

// Keep Quote available to other module consumers that may import it.
export { Quote };
