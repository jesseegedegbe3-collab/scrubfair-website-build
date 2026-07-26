import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Called by the public submitReview action in src/convex/reviews.ts.
// Kept in its own file so the action file can use the "use node" directive
// (Node.js actions only — no queries or mutations are allowed inline).
export const saveReview = internalMutation({
  args: {
    name: v.string(),
    neighbourhood: v.string(),
    service: v.union(
      v.literal("Standard Cleaning"),
      v.literal("Deep Cleaning"),
    ),
    rating: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
    ),
    body: v.string(),
    source: v.optional(v.string()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reviews", {
      name: args.name,
      neighbourhood: args.neighbourhood,
      service: args.service,
      rating: args.rating,
      body: args.body,
      source: args.source,
      createdAt: args.now,
    });
  },
});
