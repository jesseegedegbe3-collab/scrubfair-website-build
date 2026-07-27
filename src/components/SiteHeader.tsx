import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X, Phone } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="z-50 w-full shrink-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="ScrubFair home"
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
        >
          <BrandLogo size={26} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-sky-tint text-brand-deep"
                    : "text-brand-slate hover:text-brand-deep hover:bg-brand-sky-tint",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${BRAND.phoneTel}`}
            className="hidden items-center gap-1.5 text-xs font-medium text-brand-slate hover:text-brand-deep lg:inline-flex"
          >
            <Phone className="size-3.5" aria-hidden />
            {BRAND.phone}
          </a>
          <Button
            asChild
            size="sm"
            className="h-8 bg-brand-deep px-3 text-xs font-semibold text-white shadow-brand hover:bg-brand-deep-hover"
          >
            <Link to="/contact">Get a Free Quote</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-md text-brand-slate hover:bg-brand-sky-tint hover:text-brand-deep md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 border-t border-slate-200 bg-white px-4 py-2 sm:px-6"
            aria-label="Mobile"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-sky-tint text-brand-deep"
                      : "text-brand-slate hover:bg-brand-sky-tint hover:text-brand-deep",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <a
              href={`tel:${BRAND.phoneTel}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-slate hover:bg-brand-sky-tint hover:text-brand-deep"
            >
              <Phone className="size-4" aria-hidden />
              {BRAND.phone}
            </a>
            <Button
              asChild
              size="sm"
              className="mt-1 bg-brand-deep text-white shadow-brand hover:bg-brand-deep-hover"
            >
              <Link to="/contact">Get a Free Quote</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
