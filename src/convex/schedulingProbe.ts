// Temporary probe: verifies the Convex bundler can import shared scheduling
// code from outside src/convex/. Deleted after the first successful push.
import { checkSlot } from "../lib/scheduling";
import { query } from "./_generated/server";

export const probeSchedulingImport = query({
  args: {},
  handler: async () => {
    const ok = checkSlot({
      nowMs: 0,
      startUtc: 0,
      durationMinutes: 60,
      busy: [],
    });
    return typeof ok === "string" || ok === null;
  },
});
