import { Link } from "react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
] as const;

const SERVICE_LINKS = [
  { to: "/services#standard", label: "Standard Cleaning" },
  { to: "/services#deep", label: "Deep Cleaning" },
  { to: "/contact", label: "Get a Quote" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" aria-label="ScrubFair home">
              <BrandLogo size={44} />
            </Link>
            <p className="mt-4 max-w-md text-sm text-brand-slate">
              {BRAND.tagline} Locally owned in {BRAND.city},{" "}
              {BRAND.province}, and proudly serving Winnipeg homes with care,
              consistency, and a satisfaction guarantee.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm">
              <a
                href={`tel:${BRAND.phoneTel}`}
                className="inline-flex items-center gap-2 text-brand-slate hover:text-brand-deep"
              >
                <Phone className="size-4" aria-hidden />
                {BRAND.phone}
              </a>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-brand-slate hover:text-brand-deep"
              >
                <Mail className="size-4" aria-hidden />
                {BRAND.email}
              </Link>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-brand-slate">
                <MapPin className="size-4" aria-hidden />
                Proudly serving {BRAND.serviceArea}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-brand-ink uppercase">
              Explore
            </h3>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-brand-slate hover:text-brand-deep"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-brand-ink uppercase">
              Services
            </h3>
            <ul className="mt-4 space-y-2">
              {SERVICE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-brand-slate hover:text-brand-deep"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-sm font-semibold tracking-wide text-brand-ink uppercase">
              Hours
            </h3>
            <p className="mt-2 text-sm text-brand-slate">{BRAND.hours}</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <nav
            aria-label="Legal"
            className="flex items-center gap-3 text-xs text-slate-500"
          >
            <Link to="/privacy" className="hover:text-brand-deep">
              Privacy Policy
            </Link>
            <span aria-hidden className="text-slate-300">
              &middot;
            </span>
            <Link to="/terms" className="hover:text-brand-deep">
              Terms of Service
            </Link>
          </nav>
          <p>
            Licensed &amp; Insured &middot; Serving Winnipeg, MB &middot;{" "}
            <Link
              to="/contact"
              className="hover:text-brand-deep"
            >
              {BRAND.email}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
