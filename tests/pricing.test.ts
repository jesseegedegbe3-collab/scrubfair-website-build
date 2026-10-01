import { describe, expect, it } from "vitest";
import { estimate, PRICING } from "../src/config/pricing";

// Required pricing table (spec §3) — exact expected outputs.
describe("pricing engine — required table", () => {
  const cases: {
    name: string;
    input: Parameters<typeof estimate>[0];
    firstVisit: number | null;
    perVisit: number | null;
  }[] = [
    {
      name: "500/1/1/1 apartment none",
      input: { sqft: 500, bedrooms: 1, fullBaths: 1, halfBaths: 1, homeType: "apartment" },
      firstVisit: 222,
      perVisit: null,
    },
    {
      name: "500/1/1/1 apartment biweekly (minimum applies)",
      input: { sqft: 500, bedrooms: 1, fullBaths: 1, halfBaths: 1, homeType: "apartment", frequency: "biweekly" },
      firstVisit: 222,
      perVisit: 100,
    },
    {
      name: "400/0/1/0 apartment none",
      input: { sqft: 400, bedrooms: 0, fullBaths: 1, halfBaths: 0, homeType: "apartment" },
      firstVisit: 177,
      perVisit: null,
    },
    {
      name: "1000/2/1/0 bungalow monthly",
      input: { sqft: 1000, bedrooms: 2, fullBaths: 1, halfBaths: 0, homeType: "bungalow", frequency: "monthly" },
      firstVisit: 326,
      perVisit: 137,
    },
    {
      name: "1200/3/1/1 split_level biweekly",
      input: { sqft: 1200, bedrooms: 3, fullBaths: 1, halfBaths: 1, homeType: "split_level", frequency: "biweekly" },
      firstVisit: 410,
      perVisit: 136,
    },
    {
      name: "2000/3/2/1 story_2 none",
      input: { sqft: 2000, bedrooms: 3, fullBaths: 2, halfBaths: 1, homeType: "story_2" },
      firstVisit: 623,
      perVisit: null,
    },
    {
      name: "2000/3/2/1 story_2 biweekly",
      input: { sqft: 2000, bedrooms: 3, fullBaths: 2, halfBaths: 1, homeType: "story_2", frequency: "biweekly" },
      firstVisit: 623,
      perVisit: 206,
    },
    {
      name: "2000/3/2/1 story_2 weekly + 2 add-ons",
      input: { sqft: 2000, bedrooms: 3, fullBaths: 2, halfBaths: 1, homeType: "story_2", frequency: "weekly", addons: ["a", "b"] },
      firstVisit: 687,
      perVisit: 187,
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const r = estimate(c.input);
      expect(r).not.toBeNull();
      expect(r!.firstVisit).toBe(c.firstVisit);
      expect(r!.perVisit).toBe(c.perVisit);
      expect(r!.configVersion).toBe(PRICING.configVersion);
    });
  }

  it("null for 250 sqft", () => {
    expect(estimate({ sqft: 250, bedrooms: 1, fullBaths: 1, halfBaths: 0, homeType: "apartment" })).toBeNull();
  });

  it("null for 4001 sqft", () => {
    expect(estimate({ sqft: 4001, bedrooms: 1, fullBaths: 1, halfBaths: 0, homeType: "apartment" })).toBeNull();
  });

  it("null for homeType 'other'", () => {
    expect(estimate({ sqft: 1000, bedrooms: 2, fullBaths: 1, halfBaths: 0, homeType: "other" })).toBeNull();
  });

  it("null for 7 bedrooms", () => {
    expect(estimate({ sqft: 1000, bedrooms: 7, fullBaths: 1, halfBaths: 0, homeType: "apartment" })).toBeNull();
  });
});

// Verify the engine against hand-computed expectations so coefficients stay
// honest even if the required table is regenerated later.
describe("pricing engine — arithmetic sanity", () => {
  it("matches the raw formula for a mid-size home", () => {
    const sig =
      (PRICING.base + PRICING.perSqft * 1000 + PRICING.perBed * 2 + PRICING.perFull * 1 + PRICING.perHalf * 0) *
      PRICING.homeType.bungalow;
    const initial = Math.max(sig * PRICING.discount, PRICING.minInitial);
    const r = estimate({ sqft: 1000, bedrooms: 2, fullBaths: 1, halfBaths: 0, homeType: "bungalow", frequency: "monthly" });
    expect(r!.firstVisit).toBe(Math.round(initial));
    expect(r!.perVisit).toBe(Math.round(initial * PRICING.frequency.monthly));
  });

  it("respects minInitial", () => {
    const r = estimate({ sqft: 300, bedrooms: 0, fullBaths: 1, halfBaths: 0, homeType: "apartment" });
    expect(r!.firstVisit).toBeGreaterThanOrEqual(PRICING.minInitial);
  });

  it("respects minRecurring", () => {
    const r = estimate({ sqft: 500, bedrooms: 1, fullBaths: 1, halfBaths: 1, homeType: "apartment", frequency: "weekly" });
    expect(r!.perVisit).toBeGreaterThanOrEqual(PRICING.minRecurring);
  });

  it("add-ons are first-visit only", () => {
    const noAddon = estimate({ sqft: 2000, bedrooms: 3, fullBaths: 2, halfBaths: 1, homeType: "story_2", frequency: "weekly" })!;
    const withAddon = estimate({ sqft: 2000, bedrooms: 3, fullBaths: 2, halfBaths: 1, homeType: "story_2", frequency: "weekly", addons: ["x"] })!;
    expect(withAddon.firstVisit).toBe(noAddon.firstVisit + PRICING.addon);
    expect(withAddon.perVisit).toBe(noAddon.perVisit);
  });
});
