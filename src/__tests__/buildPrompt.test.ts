import { describe, it, expect } from "vitest";
import { buildPrompt, EMPTY_PARAMS, PromptParams } from "../lib/routeUtils";

describe("buildPrompt", () => {

  // ── Always present ───────────────────────────────────────────────────────
  it("includes the destination in the prompt", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo, Japan", days: 3 });
    expect(prompt).toContain("Tokyo, Japan");
  });

  it("includes the number of days", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 5 });
    expect(prompt).toContain("5-day");
  });

  it("includes the budget level", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 3, budget: "luxury" });
    expect(prompt).toContain("luxury");
  });

  it("includes fallback interests when interests is empty", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 3 });
    expect(prompt).toContain("general sightseeing, local food, culture");
  });

  it("includes custom interests when provided", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 3, interests: "jazz, museums" });
    expect(prompt).toContain("jazz, museums");
  });

  // ── Travel logistics ─────────────────────────────────────────────────────
  it("includes departure city when provided", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, departureCity: "Dublin" });
    expect(prompt).toContain("Dublin");
  });

  it("omits travel logistics section when no travel fields are set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4 });
    expect(prompt).not.toContain("Travel logistics:");
  });

  it("includes travel logistics section when departure city is set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, departureCity: "Dublin" });
    expect(prompt).toContain("Travel logistics:");
  });

  it("includes stay area routing instruction when stayArea is set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, stayArea: "Chamberí" });
    expect(prompt).toContain("Chamberí");
    expect(prompt).toContain("optimise routing");
  });

  it("includes arrival time instruction when arrivalTime is set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3, arrivalTime: "14:00" });
    expect(prompt).toContain("14:00 local time");
    expect(prompt).toContain("do not schedule morning activities on Day 1");
  });

  it("includes departure time wind-down instruction", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3, departureTime: "10:30" });
    expect(prompt).toContain("wind down the final day");
  });

  // ── Style profile ────────────────────────────────────────────────────────
  it("omits traveller profile section when no style fields are set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4 });
    expect(prompt).not.toContain("Traveller profile:");
  });

  it("includes traveller profile section when group type is set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, groupType: "couple" });
    expect(prompt).toContain("Traveller profile:");
    expect(prompt).toContain("Couple");
  });

  it("includes pace instruction in prompt", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, pace: "relaxed" });
    expect(prompt).toContain("1 to 2 highlights per day");
  });

  it("includes atmosphere in prompt", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, atmosphere: ["historic", "artistic"] });
    expect(prompt).toContain("historic and artistic");
  });

  it("includes dining style instruction", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, diningStyle: "local" });
    expect(prompt).toContain("Avoid tourist traps");
  });

  it("includes specialty coffee instruction when coffee is in beverages", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, beverages: ["coffee"] });
    expect(prompt).toContain("specialty coffee stop per day");
  });

  it("includes non-alcoholic instruction when nonalcoholic is in beverages", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, beverages: ["nonalcoholic"] });
    expect(prompt).toContain("Avoid recommending bars, pubs");
  });

  it("includes shopping instruction for brands", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, shopping: "brands" });
    expect(prompt).toContain("flagship retail suggestions");
  });

  it("includes 'do not include shopping' when shopping is none", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, shopping: "none" });
    expect(prompt).toContain("Do not include shopping");
  });

  it("includes transit routing instruction when transport is transit", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Madrid", days: 4, transport: "transit" });
    expect(prompt).toContain("Name the specific line and stop");
  });

  // ── Matrix ───────────────────────────────────────────────────────────────
  it("includes matrix table headers", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3 });
    expect(prompt).toContain("| Day | Morning | Afternoon | Evening |");
  });

  it("generates correct number of matrix rows", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3 });
    // 3 rows of [Morning anchor, 4 words]
    const rows = prompt.match(/\[Morning anchor, 4 words\]/g);
    expect(rows).toHaveLength(3);
  });

  it("includes dated matrix rows when arrivalDate is set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3, arrivalDate: "2025-05-20" });
    expect(prompt).toContain("Day 1 –");
  });

  it("includes departure row when departureDate is set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3, departureDate: "2025-05-23" });
    expect(prompt).toContain("Departure –");
    expect(prompt).toContain("Transfer to airport");
  });

  it("includes repeat matrix instruction for trips over 4 days", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 5 });
    expect(prompt).toContain("Quick-reference matrix");
  });

  it("omits repeat matrix for trips of 4 days or fewer", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 4 });
    expect(prompt).not.toContain("Quick-reference matrix");
  });

  // ── Weather ──────────────────────────────────────────────────────────────
  it("always includes weather section", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3 });
    expect(prompt).toContain("Weather and practical tips");
  });

  it("includes travel month when arrivalDate is set", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Tokyo", days: 3, arrivalDate: "2025-05-20" });
    expect(prompt).toContain("May");
  });

  // ── Full Madrid profile ───────────────────────────────────────────────────
  it("produces a complete prompt for the Madrid traveller profile", () => {
    const madrid: PromptParams = {
      destination: "Madrid, Spain",
      days: 4,
      interests: "architecture, art, food markets",
      budget: "mid-range",
      departureCity: "Dublin",
      stayArea: "Chamberí",
      arrivalDate: "2025-05-20",
      arrivalTime: "09:50",
      departureDate: "2025-05-24",
      departureTime: "10:30",
      groupType: "couple",
      pace: "moderate",
      atmosphere: ["historic", "artistic"],
      diningStyle: "local",
      beverages: ["coffee", "wine"],
      shopping: "brands",
      transport: "transit",
    };
    const prompt = buildPrompt(madrid);
    expect(prompt).toContain("Madrid, Spain");
    expect(prompt).toContain("Dublin");
    expect(prompt).toContain("Chamberí");
    expect(prompt).toContain("Couple");
    expect(prompt).toContain("Moderate pace");
    expect(prompt).toContain("specialty coffee");
    expect(prompt).toContain("flagship retail");
    expect(prompt).toContain("Name the specific line and stop");
    expect(prompt).toContain("May");
    expect(prompt).toContain("Day 1 –");
    expect(prompt).toContain("Departure –");
  });
});
