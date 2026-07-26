import { query } from "./_generated/server";

// Public query used by /reviews to render the latest reviews, newest first.
// Reviews publish immediately on submit (manual moderation via Convex
// dashboard) so listing is just a flat public read with `order("desc")` +
// by_createdAt index.
export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
  },
});
