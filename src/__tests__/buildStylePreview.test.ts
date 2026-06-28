import { describe, it, expect } from "vitest";
import { buildStylePreview, StyleForm } from "../lib/tripUtils";

const EMPTY_STYLE: StyleForm = {
  groupType: "",
  pace: "",
  atmosphere: [],
  diningStyle: "",
  beverages: [],
  shopping: "",
  transport: "",
};

describe("buildStylePreview", () => {

  // ── Empty state ──────────────────────────────────────────────────────────
  it("returns empty string when no fields are set", () => {
    expect(buildStylePreview(EMPTY_STYLE)).toBe("");
  });

  // ── Group type ───────────────────────────────────────────────────────────
  it("includes correct label for couple", () => {
    const style = { ...EMPTY_STYLE, groupType: "couple" };
    expect(buildStylePreview(style)).toContain("Couple");
  });

  it("includes correct label for solo", () => {
    const style = { ...EMPTY_STYLE, groupType: "solo" };
    expect(buildStylePreview(style)).toContain("Solo traveller");
  });

  it("includes correct label for family", () => {
    const style = { ...EMPTY_STYLE, groupType: "family" };
    expect(buildStylePreview(style)).toContain("Family with kids");
  });

  it("includes correct label for group", () => {
    const style = { ...EMPTY_STYLE, groupType: "group" };
    expect(buildStylePreview(style)).toContain("Group of friends");
  });

  // ── Pace ─────────────────────────────────────────────────────────────────
  it("includes relaxed pace description", () => {
    const style = { ...EMPTY_STYLE, pace: "relaxed" };
    expect(buildStylePreview(style)).toContain("relaxed pace");
  });

  it("includes moderate pace description", () => {
    const style = { ...EMPTY_STYLE, pace: "moderate" };
    expect(buildStylePreview(style)).toContain("moderate pace");
  });

  it("includes packed pace description", () => {
    const style = { ...EMPTY_STYLE, pace: "packed" };
    expect(buildStylePreview(style)).toContain("packed schedule");
  });

  // ── Atmosphere ───────────────────────────────────────────────────────────
  it("includes single atmosphere value", () => {
    const style = { ...EMPTY_STYLE, atmosphere: ["historic"] };
    expect(buildStylePreview(style)).toContain("drawn to historic destinations");
  });

  it("joins two atmosphere values with 'and'", () => {
    const style = { ...EMPTY_STYLE, atmosphere: ["historic", "artistic"] };
    expect(buildStylePreview(style)).toContain("drawn to historic and artistic destinations");
  });

  // ── Dining ───────────────────────────────────────────────────────────────
  it("includes local dining label", () => {
    const style = { ...EMPTY_STYLE, diningStyle: "local" };
    expect(buildStylePreview(style)).toContain("local and casual dining");
  });

  it("includes veggie dining label", () => {
    const style = { ...EMPTY_STYLE, diningStyle: "veggie" };
    expect(buildStylePreview(style)).toContain("vegetarian or vegan");
  });

  // ── Beverages ────────────────────────────────────────────────────────────
  it("includes beverage preferences when set", () => {
    const style = { ...EMPTY_STYLE, beverages: ["coffee", "wine"] };
    expect(buildStylePreview(style)).toContain("coffee, wine woven into each day");
  });

  it("omits beverages when only 'none' is selected", () => {
    const style = { ...EMPTY_STYLE, beverages: ["none"] };
    expect(buildStylePreview(style)).not.toContain("woven into each day");
  });

  it("omits beverages when array is empty", () => {
    const style = { ...EMPTY_STYLE, beverages: [] };
    expect(buildStylePreview(style)).not.toContain("woven into each day");
  });

  // ── Shopping ─────────────────────────────────────────────────────────────
  it("includes markets shopping label", () => {
    const style = { ...EMPTY_STYLE, shopping: "markets" };
    expect(buildStylePreview(style)).toContain("local markets and independent shops");
  });

  it("includes brands shopping label", () => {
    const style = { ...EMPTY_STYLE, shopping: "brands" };
    expect(buildStylePreview(style)).toContain("quality flagship retail");
  });

  it("omits shopping when set to 'none'", () => {
    const style = { ...EMPTY_STYLE, shopping: "none" };
    expect(buildStylePreview(style)).not.toContain("shopping");
  });

  // ── Transport ────────────────────────────────────────────────────────────
  it("includes transit transport label", () => {
    const style = { ...EMPTY_STYLE, transport: "transit" };
    expect(buildStylePreview(style)).toContain("metro and public transit");
  });

  it("includes walking transport label", () => {
    const style = { ...EMPTY_STYLE, transport: "walking" };
    expect(buildStylePreview(style)).toContain("walk everywhere possible");
  });

  // ── Output format ────────────────────────────────────────────────────────
  it("ends with a full stop", () => {
    const style = { ...EMPTY_STYLE, groupType: "couple", pace: "moderate" };
    const result = buildStylePreview(style);
    expect(result.endsWith(".")).toBe(true);
  });

  it("separates parts with '. '", () => {
    const style = { ...EMPTY_STYLE, groupType: "couple", pace: "moderate" };
    const result = buildStylePreview(style);
    expect(result).toContain(". ");
  });

  // ── Madrid profile ───────────────────────────────────────────────────────
  it("produces correct sentence for the Madrid traveller profile", () => {
    const madridStyle: StyleForm = {
      groupType: "couple",
      pace: "moderate",
      atmosphere: ["historic", "artistic"],
      diningStyle: "local",
      beverages: ["coffee", "wine"],
      shopping: "brands",
      transport: "transit",
    };
    const result = buildStylePreview(madridStyle);
    expect(result).toContain("Couple");
    expect(result).toContain("moderate pace");
    expect(result).toContain("historic and artistic");
    expect(result).toContain("local and casual dining");
    expect(result).toContain("coffee, wine");
    expect(result).toContain("quality flagship retail");
    expect(result).toContain("metro and public transit");
  });
});
