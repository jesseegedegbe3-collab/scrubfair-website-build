// Temporary validation probe — verifies the timezone/scheduling helpers run
// correctly inside Convex's server runtime (not just Node). Deleted after
// validation.
import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  utcFromWpgDateAndTime,
  winnipegDateKey,
  winnipegTimeKey,
} from "../lib/tz";
import { checkSlot, generateSlots } from "../lib/scheduling";
import { jobDurationMinutes } from "../config/availability";

export const tzProbe = query({
  args: {},
  handler: async () => {
    const checks: { name: string; pass: boolean; detail: string }[] = [];

    const winter = utcFromWpgDateAndTime("2026-01-15", "09:00");
    checks.push({
      name: "winter CST offset (UTC-6)",
      pass: new Date(winter).toISOString() === "2026-01-15T15:00:00.000Z",
      detail: new Date(winter).toISOString(),
    });

    const summer = utcFromWpgDateAndTime("2026-07-15", "09:00");
    checks.push({
      name: "summer CDT offset (UTC-5)",
      pass: new Date(summer).toISOString() === "2026-07-15T14:00:00.000Z",
      detail: new Date(summer).toISOString(),
    });

    const round = utcFromWpgDateAndTime("2026-11-02", "08:30");
    checks.push({
      name: "round-trip after fall-back",
      pass:
        winnipegDateKey(round) === "2026-11-02" &&
        winnipegTimeKey(round) === "08:30",
      detail: `${winnipegDateKey(round)} ${winnipegTimeKey(round)}`,
    });

    // Availability sanity inside the server runtime.
    const now = utcFromWpgDateAndTime("2026-10-01", "12:00");
    const start = utcFromWpgDateAndTime("2026-10-05", "09:00");
    const reject = checkSlot({
      nowMs: now,
      startUtc: start,
      durationMinutes: 180,
      busy: [],
    });
    checks.push({
      name: "checkSlot clean Monday 09:00",
      pass: reject === null,
      detail: String(reject),
    });

    const slots = generateSlots({
      nowMs: now,
      durationMinutes: jobDurationMinutes({ sqft: 900, isFirstVisit: true, addonCount: 0 }),
      busy: [],
      scanDays: 14,
    });
    checks.push({
      name: "generateSlots returns slots",
      pass: slots.length > 0,
      detail: `${slots.length} slots; first ${slots[0]?.dateKey ?? "none"} ${slots[0]?.timeKey ?? ""}`,
    });

    return {
      pass: checks.every((c) => c.pass),
      checks,
      runtime: typeof process === "undefined" ? "v8-isolate" : "node",
    };
  },
});

export const noop = query({
  args: { x: v.optional(v.string()) },
  handler: async () => null,
});
