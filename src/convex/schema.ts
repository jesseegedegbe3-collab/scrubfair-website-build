import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ScrubFair: contact form submissions
    contactSubmissions: defineTable({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      service: v.string(),
      message: v.string(),
      source: v.optional(v.string()),
      isPrivacyRequest: v.boolean(),
      status: v.union(
        v.literal("new"),
        v.literal("contacted"),
        v.literal("archived"),
      ),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // ScrubFair: public customer reviews (open submission, immediate publish,
    // manual moderation via the Convex dashboard if needed).
    reviews: defineTable({
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
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // ------------------------------------------------------------------------
    // ScrubFair booking system (quote-first)
    // ------------------------------------------------------------------------
    // Lifecycle: lead → requested → confirmed → completed
    //                    ↘ declined / cancelled
    // A "lead" is saved after Step 1 (contact + address). "requested" is set
    // when the full form is submitted (slot held / quote_required). The owner
    // confirms (enters final price), declines or cancels from /admin.
    // NOTE: never store door codes, passwords or alarm codes — access
    // details are collected by phone after confirmation.
    bookings: defineTable({
      status: v.union(
        v.literal("lead"),
        v.literal("requested"),
        v.literal("confirmed"),
        v.literal("declined"),
        v.literal("cancelled"),
        v.literal("completed"),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),

      // Contact (Step 1)
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.string(),
      consent: v.boolean(),
      consentAt: v.optional(v.number()),

      // Home address (Step 1)
      addressStreet: v.string(),
      addressUnit: v.optional(v.string()),
      addressCity: v.string(),
      addressPostal: v.string(),
      outsideArea: v.boolean(), // flagged "outside_area"

      // Home details (Step 2)
      sqft: v.number(), // excludes basement
      sqftSource: v.optional(v.string()), // "exact" | "estimate"
      bedrooms: v.number(),
      fullBaths: v.number(),
      halfBaths: v.number(),
      homeType: v.string(),

      // Service & frequency (Step 3)
      serviceType: v.string(), // "standard" | "deep" | "move_in_out" | "other" | "manual"
      frequency: v.string(), // "one_time" | "weekly" | "biweekly" | "monthly"
      addons: v.array(v.string()),
      condition: v.string(), // "maintained" | "months" | "year_plus"

      // Questions (Step 5)
      pests: v.boolean(), // pest_review flag
      pets: v.boolean(),
      petsNote: v.optional(v.string()),
      entryMethod: v.string(), // "home" | "key" | "lockbox" | "other"

      // Flags
      needsReview: v.boolean(), // condition sets this; price NOT auto-changed
      pestReview: v.boolean(),
      outsideAreaFlag: v.optional(v.boolean()),
      quoteRequired: v.boolean(), // estimate() returned null
      slotExpired: v.optional(v.boolean()), // hold expired before owner acted

      // Reserved slot (UTC timestamps; display in America/Winnipeg)
      slotStartUtc: v.optional(v.number()),
      slotEndUtc: v.optional(v.number()), // start + duration + buffer
      durationMinutes: v.optional(v.number()),
      teamId: v.optional(v.number()),
      holdExpiresAt: v.optional(v.number()), // owner-response deadline
      expiryAlertedAt: v.optional(v.number()), // owner warned pre-expiry
      reminderSentAt: v.optional(v.number()), // 48h reminder sent

      // PRICE SNAPSHOT (estimate shown to customer + config version)
      priceFirstVisit: v.optional(v.number()),
      pricePerVisit: v.optional(v.number()),
      configVersion: v.optional(v.string()),
      finalPrice: v.optional(v.number()), // owner-entered at confirm

      // Owner workflow
      confirmedAt: v.optional(v.number()), // when the owner confirmed
      ownerNotes: v.optional(v.string()),
      source: v.optional(v.string()), // "website" | "phone" | "admin"
      utm: v.optional(
        v.object({
          source: v.optional(v.string()),
          medium: v.optional(v.string()),
          campaign: v.optional(v.string()),
          gclid: v.optional(v.string()),
        }),
      ),
    })
      .index("by_status_createdAt", ["status", "createdAt"])
      .index("by_email", ["email"])
      .index("by_phone", ["phone"])
      .index("by_slotStart", ["slotStartUtc"])
      .index("by_holdExpiresAt", ["holdExpiresAt"]),

    // Temporary 10-minute holds while a customer finishes the form.
    slotHolds: defineTable({
      slotStartUtc: v.number(),
      slotEndUtc: v.number(), // start + duration + buffer
      durationMinutes: v.number(),
      bookingId: v.id("bookings"),
      expiresAt: v.number(),
      email: v.string(),
    })
      .index("by_booking", ["bookingId"])
      .index("by_expiresAt", ["expiresAt"])
      .index("by_slotStart", ["slotStartUtc"]),

    // Owner-blocked time ranges (holidays, days off, admin-blocked hours).
    calendarBlocks: defineTable({
      startUtc: v.number(),
      endUtc: v.number(),
      reason: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_startUtc", ["startUtc"]),

    // One document per Winnipeg date. Every mutation that reserves a slot or
    // places a hold writes to this document so that two simultaneous
    // transactions contending for the same day conflict under Convex OCC —
    // one retries, re-checks availability, and fails cleanly. This is what
    // makes double-booking impossible.
    scheduleDays: defineTable({
      dateKey: v.string(), // "YYYY-MM-DD" Winnipeg local
      version: v.number(),
      updatedAt: v.number(),
    }).index("by_dateKey", ["dateKey"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
