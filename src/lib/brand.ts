// Centralized business info for ScrubFair. Update here, not in components.
export const BRAND = {
  name: "ScrubFair",
  tagline: "Winnipeg's careful, no-pressure cleaning service.",
  city: "Winnipeg",
  province: "Manitoba",
  country: "Canada",
  phone: "204-952-8685",
  phoneTel: "+12049528685",
  email: "evelynegedegbe3@gmail.com",
  hours: "Mon\u2013Sat \u00b7 8:00am\u20136:00pm",
  serviceArea: "Winnipeg, MB",
  founded: new Date().getFullYear(),
  socials: {
    // Add real social handles when known.
  },
} as const;

export const SERVICES = [
  {
    id: "standard",
    name: "Standard Cleaning",
    tagline: "Your home, fresh and consistently cared for.",
    description:
      "A reliable, top-to-bottom routine clean that keeps your home feeling light and welcoming every visit. Ideal as a recurring weekly, biweekly, or monthly service.",
    benefits: [
      "Walk in to a kitchen that smells clean and a living room that already feels tidied",
      "Predictable results you can count on, visit after visit",
      "More free time back in your week \u2014 we'll handle the dust, you enjoy the calm",
    ],
    includes: [
      "Dusting all reachable surfaces, baseboards, and window sills",
      "Vacuuming and mopping floors throughout",
      "Kitchen: counters, stovetop, exterior of appliances, sinks",
      "Bathrooms: toilets, tubs, showers, mirrors, vanities",
      "Emptying trash bins and making beds (linens left out)",
    ],
    idealFor:
      "Busy households, working professionals, and anyone who wants a consistently clean home without having to think about it.",
  },
  {
    id: "deep",
    name: "Deep Cleaning",
    tagline: "The reset your home has been waiting for.",
    description:
      "A meticulous, room-by-room reset that tackles the buildup regular cleans can't reach. Recommended as a first-time visit, seasonally, or before a special occasion.",
    benefits: [
      "A truly fresh start \u2014 surfaces, edges, and corners you'll notice every day",
      "Healthier indoor air with detailed dusting, vent, and detail work",
      "A home that feels new again, ready for a fresh rhythm of standard cleans",
    ],
    includes: [
      "Everything in Standard Cleaning, plus:",
      "Detailed scrub of baseboards, door frames, light switches, and trim",
      "Behind and under accessible furniture and appliances",
      "Kitchen: cabinet exteriors, inside microwave, detailed appliance wipe-down",
      "Bathrooms: tile & grout scrub, mineral deposit removal, full detail",
      "Vents, reachable ceiling fans, and window interiors (within reach)",
    ],
    idealFor:
      "First-time customers, post-renovation or post-move cleans, spring refreshes, and homes that haven't had a detailed clean in a while.",
  },
] as const;

export const TRUST_BADGES = [
  {
    id: "licensed",
    label: "Licensed & Insured",
    description: "Full coverage for your peace of mind.",
  },
  {
    id: "guaranteed",
    label: "Satisfaction Guaranteed",
    description: "If something's off, we'll make it right.",
  },
  {
    id: "local",
    label: "Winnipeg Local",
    description: "Proudly serving our hometown.",
  },
] as const;
