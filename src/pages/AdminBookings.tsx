// ============================================================================
// /admin?token=… — Owner-only bookings dashboard (noindex)
// ============================================================================
// Confirm (final price), Decline, Cancel, Reschedule, Mark completed,
// Block time, Manual booking, CSV export. The token is verified server-side
// on every call; without a valid ADMIN_TOKEN nothing renders.
// ============================================================================

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Ban,
  CalendarOff,
  Check,
  Clock,
  Download,
  Loader2,
  Phone,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";
import { cad } from "@/lib/estimateWording";
import { winnipegParts, winnipegDateKey, winnipegTimeKey } from "../lib/tz";
import { useSearchParams } from "react-router";

function fmt(utcMs: number | undefined): string {
  if (utcMs == null) return "—";
  const p = winnipegParts(utcMs);
  const h12 = ((p.hour + 11) % 12) + 1;
  const ampm = p.hour < 12 ? "AM" : "PM";
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")} ${h12}:${String(p.minute).padStart(2, "0")} ${ampm}`;
}

const STATUS_STYLES: Record<string, string> = {
  lead: "bg-slate-100 text-slate-600",
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  declined: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-brand-sky-soft text-brand-deep",
};

type AdminBooking = {
  _id: Id<"bookings">;
  status: string;
  createdAt: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressUnit?: string;
  addressCity: string;
  addressPostal: string;
  sqft: number;
  bedrooms: number;
  fullBaths: number;
  halfBaths: number;
  homeType: string;
  serviceType: string;
  frequency: string;
  addons: string[];
  condition: string;
  pests: boolean;
  pets: boolean;
  petsNote?: string;
  entryMethod: string;
  needsReview: boolean;
  pestReview: boolean;
  outsideArea: boolean;
  quoteRequired: boolean;
  slotStartUtc?: number;
  durationMinutes?: number;
  priceFirstVisit?: number;
  pricePerVisit?: number;
  finalPrice?: number;
  specialRequests?: string;
  ownerNotes?: string;
  holdExpiresAt?: number;
  source?: string;
};

export default function AdminBookings() {
  const [params, setParams] = useSearchParams();
  const token = params.get("token") ?? "";

  // Keep the admin page out of search engines and out of the tab title.
  useEffect(() => {
    document.title = "ScrubFair — Admin";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
      document.title = "Scrubfair";
    };
  }, []);

  const [statusFilter, setStatusFilter] = useState("all");
  const [confirming, setConfirming] = useState<AdminBooking | null>(null);
  const [finalPrice, setFinalPrice] = useState("");
  const [rescheduling, setRescheduling] = useState<AdminBooking | null>(null);
  const [reschedDuration, setReschedDuration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showBlock, setShowBlock] = useState(false);

  const requests = useQuery(
    api.bookingsAdmin.listRequests,
    token ? { token, status: statusFilter } : "skip",
  );
  const summary = useQuery(api.bookingsAdmin.adminSummary, token ? { token } : "skip");
  const blocks = useQuery(api.bookingsAdmin.listBlocks, token ? { token } : "skip");

  const availableSlots = useQuery(
    api.bookings.availableSlots,
    rescheduling && reschedDuration
      ? {
          dateKey: winnipegDateKey(Date.now() + 2 * 86_400_000),
          durationMinutes: parseInt(reschedDuration, 10) || 180,
        }
      : "skip",
  );

  const confirm = useMutation(api.bookingsAdmin.confirmBooking);
  const decline = useMutation(api.bookingsAdmin.declineBooking);
  const cancel = useMutation(api.bookingsAdmin.cancelBooking);
  const complete = useMutation(api.bookingsAdmin.completeBooking);
  const reschedule = useMutation(api.bookingsAdmin.rescheduleBooking);
  const overrideDuration = useMutation(api.bookingsAdmin.overrideDuration);
  const manual = useMutation(api.bookingsAdmin.manualBooking);
  const blockTime = useMutation(api.bookingsAdmin.blockTime);
  const setNotes = useMutation(api.bookingsAdmin.setOwnerNotes);

  const csv = useQuery(api.bookingsAdmin.exportCsv, token ? { token } : "skip");

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  function downloadCsv() {
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scrubfair-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShieldAlert className="mx-auto size-10 text-slate-400" aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-brand-ink">Admin access</h1>
        <p className="mt-2 text-sm text-brand-slate">
          Append your secret token to the URL: <code>/admin?token=…</code>
        </p>
      </div>
    );
  }

  const unauthorized = requests === null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">Bookings</h1>
            <p className="text-sm text-brand-slate">
              ScrubFair owner dashboard · scrubfair.ca/admin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBlock(true)} className="border-slate-300">
              <CalendarOff className="mr-2 size-4" aria-hidden /> Block time
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowManual(true)} className="border-slate-300">
              <PlusCircle className="mr-2 size-4" aria-hidden /> Manual booking
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCsv} disabled={!csv} className="border-slate-300">
              <Download className="mr-2 size-4" aria-hidden /> CSV
            </Button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "New requests", v: summary.counts.requested, hot: true },
              { l: "Needs review", v: summary.counts.needsReview, hot: true },
              { l: "Confirmed", v: summary.counts.confirmed },
              { l: "Leads (not submitted)", v: summary.counts.leads },
              { l: "Completed", v: summary.counts.completed },
              { l: "Expiring < 6h", v: summary.expiringSoon, hot: summary.expiringSoon > 0 },
            ].map((s) => (
              <div key={s.l} className={"rounded-xl border p-4 " + (s.hot ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white")}>
                <p className="text-xs font-medium text-slate-500">{s.l}</p>
                <p className="mt-1 text-2xl font-bold text-brand-ink">{s.v}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          {["all", "requested", "confirmed", "lead", "completed", "declined", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                "rounded-full px-4 py-1.5 text-xs font-semibold capitalize " +
                (statusFilter === s ? "bg-brand-deep text-white" : "bg-white text-brand-slate ring-1 ring-slate-200 hover:ring-brand-deep")
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-6 space-y-4 pb-24">
          {requests === undefined && (
            <div className="flex items-center gap-2 py-10 text-brand-slate">
              <Loader2 className="size-5 animate-spin" aria-hidden /> Loading…
            </div>
          )}
          {unauthorized && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              Unauthorized — check the ADMIN_TOKEN in the URL and the Convex environment variable.
            </div>
          )}
          {requests?.length === 0 && (
            <p className="py-10 text-center text-sm text-brand-slate">No bookings in this view.</p>
          )}
          {requests?.map((b) => (
            <BookingCard
              key={b._id}
              b={b as AdminBooking}
              onConfirm={() => {
                setConfirming(b as AdminBooking);
                setFinalPrice(b.priceFirstVisit != null ? String(b.priceFirstVisit) : "");
              }}
              onDecline={() => run(() => decline({ token, bookingId: b._id }))}
              onCancel={() => run(() => cancel({ token, bookingId: b._id }))}
              onComplete={() => run(() => complete({ token, bookingId: b._id }))}
              onStartReschedule={() => {
                setRescheduling(b as AdminBooking);
                setReschedDuration(String(b.durationMinutes ?? 180));
              }}
              onSaveNotes={(notes) => run(() => setNotes({ token, bookingId: b._id, notes }))}
            />
          ))}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirming && (
        <Modal onClose={() => setConfirming(null)} title="Confirm booking">
          <p className="text-sm text-brand-slate">
            Confirming <b>{confirming.firstName} {confirming.lastName}</b>
            {confirming.slotStartUtc != null ? ` for ${fmt(confirming.slotStartUtc)}` : ""}. The held
            slot becomes booked and the customer is emailed "Your cleaning is booked".
          </p>
          <label className="mt-4 block text-sm font-semibold text-brand-ink">
            Final price (CAD)
            <Input
              type="number"
              min={0}
              step="1"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              className="mt-1 h-11"
            />
          </label>
          {confirming.priceFirstVisit != null && (
            <p className="mt-1 text-xs text-brand-slate">
              Original estimate: {cad(confirming.priceFirstVisit)}
              {confirming.pricePerVisit != null ? ` · est. per visit ${cad(confirming.pricePerVisit)}` : ""}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!finalPrice}
              onClick={() =>
                run(async () => {
                  await confirm({ token, bookingId: confirming._id, finalPrice: Number(finalPrice) });
                  setConfirming(null);
                })
              }
            >
              <Check className="mr-2 size-4" aria-hidden /> Confirm & email customer
            </Button>
          </div>
        </Modal>
      )}

      {/* Reschedule dialog */}
      {rescheduling && (
        <Modal onClose={() => setRescheduling(null)} title="Reschedule booking">
          <p className="text-sm text-brand-slate">
            Current: {fmt(rescheduling.slotStartUtc)}. Duration override (minutes):
          </p>
          <Input
            type="number"
            value={reschedDuration}
            onChange={(e) => setReschedDuration(e.target.value)}
            className="mt-2 h-11"
          />
          <p className="mt-4 text-sm font-semibold text-brand-ink">
            Available slots on {winnipegDateKey(Date.now() + 2 * 86_400_000)} (+2 days):
          </p>
          <div className="mt-2 grid max-h-52 grid-cols-3 gap-2 overflow-auto sm:grid-cols-4">
            {(availableSlots ?? []).map((s) => (
              <button
                key={s.startUtc}
                className="rounded-lg border border-slate-200 py-2 text-xs font-semibold hover:border-brand-deep"
                onClick={() =>
                  run(async () => {
                    await reschedule({
                      token,
                      bookingId: rescheduling._id,
                      newStartUtc: s.startUtc,
                      durationMinutes: parseInt(reschedDuration, 10) || undefined,
                    });
                    setRescheduling(null);
                  })
                }
              >
                {s.timeKey}
              </button>
            ))}
            {availableSlots?.length === 0 && (
              <p className="col-span-full text-xs text-brand-slate">No open slots that day.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Manual booking dialog */}
      {showManual && (
        <ManualBookingDialog
          token={token}
          onClose={() => setShowManual(false)}
          onSubmit={(args) =>
            run(async () => {
              await manual(args);
              setShowManual(false);
            })
          }
        />
      )}

      {/* Block time dialog */}
      {showBlock && (
        <BlockTimeDialog
          token={token}
          onClose={() => setShowBlock(false)}
          onSubmit={(args) =>
            run(async () => {
              await blockTime(args);
              setShowBlock(false);
            })
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function BookingCard({
  b,
  onConfirm,
  onDecline,
  onCancel,
  onComplete,
  onStartReschedule,
  onSaveNotes,
}: {
  b: AdminBooking;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onStartReschedule: () => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(b.ownerNotes ?? "");
  const flags = [
    b.pestReview && "🚨 PEST",
    b.needsReview && "⚠️ REVIEW",
    b.outsideArea && "📍 OUTSIDE AREA",
    b.quoteRequired && "💬 QUOTE REQ",
  ].filter(Boolean) as string[];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={"rounded-full px-2.5 py-0.5 text-xs font-bold " + (STATUS_STYLES[b.status] ?? "bg-slate-100")}>
              {b.status}
            </span>
            {flags.map((f) => (
              <span key={f} className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                {f}
              </span>
            ))}
            <span className="text-xs text-slate-400">{b.source ?? "website"}</span>
          </div>
          <p className="mt-2 font-bold text-brand-ink">
            {b.firstName} {b.lastName} ·{" "}
            <a href={`tel:${b.phone}`} className="text-brand-deep hover:underline">
              {b.phone}
            </a>
          </p>
          <p className="text-sm text-brand-slate">
            {b.addressStreet}
            {b.addressUnit ? `, ${b.addressUnit}` : ""}, {b.addressCity} {b.addressPostal} ·{" "}
            <a href={`mailto:${b.email}`} className="hover:underline">{b.email}</a>
          </p>
          <p className="mt-1 text-sm text-brand-slate">
            {b.serviceType || "—"} · {b.frequency} · {b.sqft} sqft · {b.bedrooms}bd/{b.fullBaths}ba
            {b.halfBaths ? `+${b.halfBaths}½` : ""} · {b.homeType || "—"} · cond: {b.condition || "—"}
            {b.addons.length ? ` · add-ons: ${b.addons.join(", ")}` : ""}
          </p>
          <p className="mt-1 text-sm">
            <Clock className="mr-1 inline size-3.5 text-brand-deep" aria-hidden />
            {b.slotStartUtc != null ? `${fmt(b.slotStartUtc)} · ${b.durationMinutes ?? "?"} min` : "No slot (quote required)"}
          </p>
          <p className="mt-1 text-sm text-brand-slate">
            Estimate: {b.priceFirstVisit != null ? cad(b.priceFirstVisit) : "—"}
            {b.pricePerVisit != null ? ` / visit ${cad(b.pricePerVisit)}` : ""}
            {b.finalPrice != null && <b> → Final: {cad(b.finalPrice)}</b>}
          </p>
          {b.pets && b.petsNote && <p className="mt-1 text-sm text-brand-slate">Pets: {b.petsNote}</p>}
          {b.specialRequests && <p className="mt-1 text-sm text-brand-slate">Notes: {b.specialRequests}</p>}
        </div>

        <div className="flex flex-col gap-2">
          {(b.status === "requested" || b.status === "lead") && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onConfirm}>
              <Check className="mr-1 size-3.5" aria-hidden /> Confirm
            </Button>
          )}
          {b.status === "requested" && (
            <>
              <Button size="sm" variant="outline" onClick={onStartReschedule} className="border-slate-300">
                <RefreshCw className="mr-1 size-3.5" aria-hidden /> Reschedule
              </Button>
              <Button size="sm" variant="outline" onClick={onDecline} className="border-rose-200 text-rose-600 hover:bg-rose-50">
                <Ban className="mr-1 size-3.5" aria-hidden /> Decline
              </Button>
            </>
          )}
          {b.status === "confirmed" && (
            <>
              <Button size="sm" variant="outline" onClick={onComplete} className="border-slate-300">
                Mark completed
              </Button>
              <Button size="sm" variant="outline" onClick={onStartReschedule} className="border-slate-300">
                <RefreshCw className="mr-1 size-3.5" aria-hidden /> Reschedule
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel} className="border-rose-200 text-rose-600 hover:bg-rose-50">
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <details className="mt-3 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-brand-deep">Owner notes</summary>
        <div className="mt-2 flex gap-2">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9 text-sm" />
          <Button size="sm" variant="outline" onClick={() => onSaveNotes(notes)} className="border-slate-300">
            Save
          </Button>
        </div>
      </details>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
      <button className="absolute inset-0 -z-10 cursor-default" aria-label="Close" onClick={onClose} />
    </div>
  );
}

function ManualBookingDialog({
  token,
  onClose,
  onSubmit,
}: {
  token: string;
  onClose: () => void;
  onSubmit: (args: {
    token: string;
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    addressStreet: string;
    addressCity?: string;
    addressPostal?: string;
    sqft?: number;
    startUtc: number;
    durationMinutes: number;
    price?: number;
    notes?: string;
  }) => void;
}) {
  const [f, setF] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    addressStreet: "", addressCity: "Winnipeg", addressPostal: "",
    sqft: "", startUtc: "", durationMinutes: "180", price: "", notes: "",
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Modal onClose={onClose} title="Manual booking (phone)">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Input placeholder="First name*" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} className="h-10" />
        <Input placeholder="Last name" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} className="h-10" />
        <Input placeholder="Phone*" value={f.phone} onChange={(e) => set("phone", e.target.value)} className="h-10" />
        <Input placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} className="h-10" />
        <Input placeholder="Street address*" value={f.addressStreet} onChange={(e) => set("addressStreet", e.target.value)} className="col-span-2 h-10" />
        <Input placeholder="Start (UTC ms)*" value={f.startUtc} onChange={(e) => set("startUtc", e.target.value)} className="col-span-2 h-10" />
        <Input placeholder="Duration (min)" value={f.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} className="h-10" />
        <Input placeholder="Price CAD" value={f.price} onChange={(e) => set("price", e.target.value)} className="h-10" />
        <Input placeholder="Notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} className="col-span-2 h-10" />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Start time as UTC ms (Convex dashboard can convert). Slot conflicts are re-checked server-side.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          className="bg-brand-deep text-white hover:bg-brand-deep-hover"
          disabled={!f.firstName || !f.phone || !f.addressStreet || !f.startUtc}
          onClick={() =>
            onSubmit({
              token,
              firstName: f.firstName,
              lastName: f.lastName || undefined,
              phone: f.phone,
              email: f.email || undefined,
              addressStreet: f.addressStreet,
              addressCity: f.addressCity || undefined,
              addressPostal: f.addressPostal || undefined,
              sqft: f.sqft ? Number(f.sqft) : undefined,
              startUtc: Number(f.startUtc),
              durationMinutes: f.durationMinutes ? Number(f.durationMinutes) : 180,
              price: f.price ? Number(f.price) : undefined,
              notes: f.notes || undefined,
            })
          }
        >
          Create booking
        </Button>
      </div>
    </Modal>
  );
}

function BlockTimeDialog({
  token,
  onClose,
  onSubmit,
}: {
  token: string;
  onClose: () => void;
  onSubmit: (args: {
    token: string;
    dateKey: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }) => void;
}) {
  const [f, setF] = useState({ dateKey: "", startTime: "08:00", endTime: "17:00", reason: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal onClose={onClose} title="Block time or whole day">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Input placeholder="YYYY-MM-DD*" value={f.dateKey} onChange={(e) => set("dateKey", e.target.value)} className="col-span-2 h-10" />
        <Input placeholder="Start HH:MM" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} className="h-10" />
        <Input placeholder="End HH:MM" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} className="h-10" />
        <Input placeholder="Reason (holiday, day off…)" value={f.reason} onChange={(e) => set("reason", e.target.value)} className="col-span-2 h-10" />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Winnipeg dates. For a whole day use 00:00–23:59.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          className="bg-brand-deep text-white hover:bg-brand-deep-hover"
          disabled={!/^\d{4}-\d{2}-\d{2}$/.test(f.dateKey)}
          onClick={() =>
            onSubmit({
              token,
              dateKey: f.dateKey,
              startTime: f.startTime || "00:00",
              endTime: f.endTime || "23:59",
              reason: f.reason || undefined,
            })
          }
        >
          Block
        </Button>
      </div>
    </Modal>
  );
}
