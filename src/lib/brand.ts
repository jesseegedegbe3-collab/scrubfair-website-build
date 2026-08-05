// Centralized business info for ScrubFair. Update here, not in components.
export const BRAND = {
  name: "ScrubFair",
  tagline: "Winnipeg's careful, no-pressure cleaning service.",
  city: "Winnipeg",
  province: "Manitoba",
  country: "Canada",
  phone: "204-952-8685",
  phoneTel: "+12049528685",
  email: "contact@scrubfair.ca",
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
    image: "standardSupplies",
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
    image: "deepKitchen",
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
  {
    id: "commercial",
    image: "commercialOffice",
    name: "Commercial Cleaning",
    tagline: "A cleaner workplace, ready for business.",
    description:
      "Dependable cleaning for offices, studios, retail spaces, and other commercial environments — so your team and customers walk into a space that feels cared for.",
    benefits: [
      "A professional first impression for customers and visitors",
      "A cleaner, more comfortable environment for your team",
      "A dependable cleaning rhythm that fits your operating hours",
    ],
    includes: [
      "Workstations, common areas, and high-touch surfaces",
      "Kitchen, lunchroom, and washroom cleaning",
      "Vacuuming, mopping, dusting, and garbage removal",
    ],
    idealFor:
      "Offices, retail spaces, studios, clinics, and small businesses in Winnipeg.",
  },
  {
    id: "move-in-out",
    image: "moveInOut",
    name: "Move In / Move Out Cleaning",
    tagline: "A fresh start for the next chapter.",
    description:
      "Take the cleaning off your moving checklist. We prepare an empty home for its next occupants or leave your old place feeling finished and ready to hand over.",
    benefits: [
      "Walk into your new space feeling settled from day one",
      "A more polished handoff for landlords, buyers, or new tenants",
      "One less time-consuming job during an already busy move",
    ],
    includes: [
      "Cabinets, drawers, appliances, counters, and closets",
      "Bathrooms, floors, baseboards, doors, and trim",
      "Reachable windows, fixtures, and detail areas in empty rooms",
    ],
    idealFor:
      "Tenants, homeowners, landlords, buyers, sellers, and property managers between occupants.",
  },
  {
    id: "showhomes",
    image: "showhome",
    name: "Showhome Cleaning",
    tagline: "Make every viewing feel move-in ready.",
    description:
      "Keep a showhome polished between viewings with careful attention to the details buyers notice — from spotless surfaces to presentation-ready floors and bathrooms.",
    benefits: [
      "A stronger first impression for every prospective buyer",
      "A consistently polished presentation between showings",
      "More time for your sales team to focus on the viewing experience",
    ],
    includes: [
      "Dust-free surfaces, fixtures, trim, and display areas",
      "Spotless kitchens, bathrooms, floors, and entryways",
      "Touch-up cleaning after viewings or before open houses",
    ],
    idealFor:
      "Builders, developers, real estate teams, and homeowners preparing a property for sale.",
  },
  {
    id: "post-construction",
    image: "postConstruction",
    name: "Post-Construction Cleaning",
    tagline: "Turn construction dust into a finished space.",
    description:
      "A detailed clean after renovation or construction that helps reveal the finished work and gets your space ready to use, photograph, or welcome people into.",
    benefits: [
      "Fine dust and residue cleared from the surfaces you can see and feel",
      "A finished, comfortable space without the cleanup burden",
      "A better final presentation for owners, tenants, or clients",
    ],
    includes: [
      "Fine dust removal from surfaces, ledges, trim, and fixtures",
      "Cabinet, countertop, appliance, bathroom, and floor cleaning",
      "Final detail pass for accessible areas before occupancy or handoff",
    ],
    idealFor:
      "Home renovations, remodels, new builds, contractors, and property owners preparing for occupancy.",
  },
  {
    id: "carpet",
    image: "carpet",
    name: "Carpet Cleaning",
    tagline: "A fresher feel underfoot.",
    description:
      "Refresh carpeted rooms by lifting everyday dirt and buildup, helping your floors look brighter and your home feel cleaner from the ground up.",
    benefits: [
      "A visibly fresher look in high-traffic rooms",
      "Less tracked-in dirt and buildup around your home",
      "A cleaner-feeling space for family, guests, tenants, or buyers",
    ],
    includes: [
      "Pre-treatment of common traffic areas and visible spots",
      "Thorough carpet cleaning across requested rooms",
      "Careful attention to edges, entrances, and high-use areas",
    ],
    idealFor:
      "Homes, rentals, offices, showhomes, and move-in or move-out refreshes.",
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
