import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { installCallTracking } from "@/lib/analytics";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Home = lazy(() => import("./pages/Landing.tsx"));
const Services = lazy(() => import("./pages/Services.tsx"));
const Reviews = lazy(() => import("./pages/Reviews.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Book = lazy(() => import("./pages/Book.tsx"));
const BookThanks = lazy(() => import("./pages/BookThanks.tsx"));
const AdminBookings = lazy(() => import("./pages/AdminBookings.tsx"));
const LeaveReview = lazy(() => import("./pages/LeaveReview.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const SiteLayout = lazy(() =>
  import("./components/SiteLayout.tsx").then((m) => ({ default: m.SiteLayout })),
);

// Skeleton preview shown while a route's code is loading. It mirrors the
// general page structure (header, tinted hero, content cards) so the layout
// doesn't jump when the real page arrives.
function RouteLoading() {
  return (
    <div
      className="min-h-screen bg-white"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading…</span>

      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="size-[42px] animate-pulse rounded-lg bg-slate-200" />
          <div className="hidden items-center gap-3 md:flex">
            {[64, 76, 68, 64].map((w) => (
              <div
                key={w}
                className="h-4 animate-pulse rounded bg-slate-200"
                style={{ width: w }}
              />
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="size-10 animate-pulse rounded-md bg-slate-200 md:hidden" />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-brand-sky-tint">
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8 lg:pt-24 lg:pb-16">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="mx-auto h-3 w-24 animate-pulse rounded bg-slate-300/70" />
            <div className="mx-auto h-10 w-full max-w-xl animate-pulse rounded bg-slate-300/70 sm:h-12" />
            <div className="mx-auto h-10 w-3/4 max-w-md animate-pulse rounded bg-slate-300/70 sm:h-12" />
            <div className="mx-auto mt-6 h-4 w-full max-w-lg animate-pulse rounded bg-slate-300/50" />
            <div className="mx-auto h-4 w-2/3 max-w-sm animate-pulse rounded bg-slate-300/50" />
          </div>
        </div>
      </div>

      {/* Content cards */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="size-12 animate-pulse rounded-xl bg-slate-200" />
              <div className="mt-5 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
// GitHub Pages has no server-side routing: a direct load or refresh on a
// client-side route (e.g. /services) gets served public/404.html, which
// redirects here with the original path preserved in ?redirect=. Restore it
// before React Router mounts so the correct page renders instead of Home.
{
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (redirect) {
    window.history.replaceState(null, "", redirect);
  }
}



// Fire a conversion event whenever any tel: link is tapped (spec §1).
if (typeof window !== "undefined") installCallTracking();

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
    // Scroll to the top of the page whenever a new route is entered.
    // Plain two-arg form is unambiguous and always instant across browsers.
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/book" element={<Book />} />
                <Route path="/book/thanks" element={<BookThanks />} />
                <Route path="/leave-review" element={<LeaveReview />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Route>
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route path="/admin" element={<AdminBookings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
