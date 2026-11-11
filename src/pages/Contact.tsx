import { Link } from "react-router";
import {
  ArrowRight,
  CalendarCheck,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";
import { BRAND } from "@/lib/brand";

export default function Contact() {
  return (
    <div className="bg-white">
      {/* ─────────── Page header ─────────── */}
      <section className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6 lg:px-8 lg:pt-24 lg:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
              Contact
            </p>
            <h1 className="mt-3 text-4xl font-bold text-brand-ink sm:text-5xl">
              Give us a call.
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              Booking a clean takes about three minutes online — you'll see your
              estimated price before you pick a time. For anything else,
              questions, changes, or a request about your personal information,
              the fastest way to reach us is by phone.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────── Call / book / info ─────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-sky-soft text-brand-deep">
                    <Phone className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-brand-ink">
                      Call or text us
                    </h2>
                    <p className="mt-1 text-sm text-brand-slate">
                      {BRAND.hours} · Winnipeg, {BRAND.province}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${BRAND.phoneTel}`}
                  className="mt-6 block rounded-2xl bg-brand-deep px-6 py-5 text-center text-2xl font-bold tracking-tight text-white shadow-brand transition hover:bg-brand-deep-hover sm:text-3xl"
                >
                  {BRAND.phone}
                </a>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 flex-1 bg-brand-deep px-6 text-base text-white shadow-brand hover:bg-brand-deep-hover"
                  >
                    <Link to="/book">
                      <CalendarCheck className="mr-2 size-5" aria-hidden />
                      Book online instead
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 flex-1 border-brand-deep px-6 text-base text-brand-deep hover:bg-brand-sky-tint"
                  >
                    <a href={`mailto:${BRAND.email}`}>
                      <Mail className="mr-2 size-5" aria-hidden />
                      Email us
                    </a>
                  </Button>
                </div>

                {/* Personal-data requests → phone */}
                <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck
                    className="mt-0.5 size-5 shrink-0 text-brand-deep"
                    aria-hidden
                  />
                  <p className="text-sm text-brand-slate">
                    <span className="font-semibold text-brand-ink">
                      Requesting your personal information?
                    </span>{" "}
                    Please call{" "}
                    <a
                      href={`tel:${BRAND.phoneTel}`}
                      className="font-semibold text-brand-deep underline-offset-2 hover:underline"
                    >
                      {BRAND.phone}
                    </a>{" "}
                    so we can verify it's you before we share, correct, or
                    delete anything. Details are in our{" "}
                    <Link
                      to="/privacy"
                      className="font-semibold text-brand-deep underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="lg:col-span-2">
              <div className="relative h-full overflow-hidden rounded-3xl bg-brand-sky-soft p-8">
                <div className="absolute -right-12 -top-12 size-48 rounded-full bg-brand-sky opacity-40 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-brand-deep opacity-30 blur-3xl" />

                <div className="relative">
                  <h2 className="text-xl font-bold text-brand-ink">
                    Reach us directly
                  </h2>
                  <p className="mt-2 text-sm text-brand-slate">
                    A real person answers — no phone tree, no hold music.
                  </p>

                  <ul className="mt-8 space-y-5">
                    <li>
                      <a
                        href={`tel:${BRAND.phoneTel}`}
                        className="group flex items-start gap-4"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm">
                          <Phone className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold tracking-wide text-brand-deep uppercase">
                            Phone
                          </span>
                          <span className="mt-0.5 block text-base font-medium text-brand-ink group-hover:text-brand-deep">
                            {BRAND.phone}
                          </span>
                          <span className="mt-0.5 block text-sm text-brand-slate">
                            {BRAND.hours}
                          </span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href={`mailto:${BRAND.email}`}
                        className="group flex items-start gap-4"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm">
                          <Mail className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold tracking-wide text-brand-deep uppercase">
                            Email
                          </span>
                          <span className="mt-0.5 block break-all text-base font-medium text-brand-ink group-hover:text-brand-deep">
                            {BRAND.email}
                          </span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <div className="flex items-start gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-deep shadow-sm">
                          <MapPin className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold tracking-wide text-brand-deep uppercase">
                            Service area
                          </span>
                          <span className="mt-0.5 block text-base font-medium text-brand-ink">
                            {BRAND.serviceArea}
                          </span>
                          <span className="mt-0.5 block text-sm text-brand-slate">
                            {BRAND.hours}
                          </span>
                        </span>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-10 overflow-hidden rounded-2xl">
                    <img
                      src={IMAGES.contactInterior}
                      alt="Clean, calm interior"
                      className="h-56 w-full bg-brand-sky-tint object-cover"
                    />
                  </div>

                  <Link
                    to="/book"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-deep hover:text-brand-deep-hover"
                  >
                    See your estimated price
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
