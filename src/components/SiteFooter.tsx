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
  { to: "/services#standard", label: "Standard" },
  { to: "/services#deep", label: "Deep" },
  { to: "/contact", label: "Quote" },
] as const;

export function SiteFooter() {
  return (
    <footer className="z-50 w-full shrink-0 border-t border-slate-200 bg-white">
      <div className="mx-auto flex h-12 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 text-xs text-brand-slate sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="ScrubFair home" className="shrink-0">
            <BrandLogo size={22} />
          </Link>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <MapPin className="size-3.5 text-brand-deep" aria-hidden />
            {BRAND.serviceArea}
          </span>
          <a
            href={`tel:${BRAND.phoneTel}`}
            className="hidden items-center gap-1 hover:text-brand-deep md:inline-flex"
          >
            <Phone className="size-3.5 text-brand-deep" aria-hidden />
            {BRAND.phone}
          </a>
          <Link
            to="/contact"
            className="hidden items-center gap-1 hover:text-brand-deep lg:inline-flex"
          >
            <Mail className="size-3.5 text-brand-deep" aria-hidden />
            {BRAND.email}
          </Link>
        </div>

        <nav aria-label="Footer" className="flex items-center gap-1.5">
          {QUICK_LINKS.map((l, i) => (
            <span key={l.to} className="flex items-center gap-1.5">
              <Link
                to={l.to}
                className="hover:text-brand-deep"
              >
                {l.label}
              </Link>
              {i < QUICK_LINKS.length - 1 && (
                <span aria-hidden className="text-slate-300">
                  ·
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {SERVICE_LINKS.map((l, i) => (
            <span key={l.to} className="flex items-center gap-1.5">
              <Link to={l.to} className="hover:text-brand-deep">
                {l.label}
              </Link>
              {i < SERVICE_LINKS.length - 1 && (
                <span aria-hidden className="text-slate-300">
                  ·
                </span>
              )}
            </span>
          ))}
          <span aria-hidden className="ml-1 text-slate-300">·</span>
          <Link to="/privacy" className="hover:text-brand-deep">
            Privacy
          </Link>
          <span aria-hidden className="text-slate-300">·</span>
          <Link to="/terms" className="hover:text-brand-deep">
            Terms
          </Link>
        </div>

        <p className="text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>
    </footer>
  );
}
