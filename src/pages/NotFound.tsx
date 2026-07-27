import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";

export default function NotFound() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-brand-sky-tint p-3 md:p-4">
      <div className="flex h-full w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Left: image */}
          <div className="relative hidden md:block md:w-2/5">
            <img
              src={IMAGES.standardSupplies}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          {/* Right: 404 message */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center md:p-10">
            <p className="text-[10px] font-semibold tracking-widest text-brand-deep uppercase">
              Page not found
            </p>
            <h1 className="text-5xl font-extrabold text-brand-ink md:text-6xl">
              404
            </h1>
            <p className="text-sm text-brand-slate md:text-base">
              We couldn&rsquo;t find that page — but our home page is right
              here and ready when you are.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-2 h-9 bg-brand-deep px-4 text-xs font-semibold text-white shadow-brand hover:bg-brand-deep-hover sm:text-sm"
            >
              <Link to="/">
                Back to Home
                <ArrowRight className="ml-1.5 size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
