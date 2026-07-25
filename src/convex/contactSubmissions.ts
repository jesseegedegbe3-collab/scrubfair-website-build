import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Called by the public submitContactForm action. Kept in its own file so the
// action file can use the "use node" directive (Node.js actions only).
export const saveSubmission = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    source: v.optional(v.string()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contactSubmissions", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      message: args.message,
      source: args.source,
      status: "new",
      createdAt: args.now,
    });
  },
});
