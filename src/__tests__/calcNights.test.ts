import { describe, it, expect } from "vitest";
import { calcNights } from "../lib/tripUtils";

describe("calcNights", () => {

  // ── Happy path ──────────────────────────────────────────────────────────
  it("returns correct nights for a standard range", () => {
    expect(calcNights("2025-05-20", "2025-05-24")).toBe(4);
  });

  it("returns 1 for consecutive days", () => {
    expect(calcNights("2025-05-20", "2025-05-21")).toBe(1);
  });

  it("returns correct nights across a month boundary", () => {
    expect(calcNights("2025-05-29", "2025-06-02")).toBe(4);
  });

  it("returns correct nights across a year boundary", () => {
    expect(calcNights("2025-12-29", "2026-01-02")).toBe(4);
  });

  it("returns correct nights for a long trip", () => {
    expect(calcNights("2025-05-01", "2025-05-15")).toBe(14);
  });

  // ── Same day ─────────────────────────────────────────────────────────────
  it("returns 0 when arrival and departure are the same day", () => {
    expect(calcNights("2025-05-20", "2025-05-20")).toBe(0);
  });

  // ── Reversed dates ───────────────────────────────────────────────────────
  it("returns negative number when departure is before arrival", () => {
    const result = calcNights("2025-05-24", "2025-05-20");
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(0);
  });

  it("returns -4 for a 4-day reversed range", () => {
    expect(calcNights("2025-05-24", "2025-05-20")).toBe(-4);
  });

  // ── Empty / null inputs ──────────────────────────────────────────────────
  it("returns null when arrival is empty string", () => {
    expect(calcNights("", "2025-05-24")).toBeNull();
  });

  it("returns null when departure is empty string", () => {
    expect(calcNights("2025-05-20", "")).toBeNull();
  });

  it("returns null when both are empty strings", () => {
    expect(calcNights("", "")).toBeNull();
  });

  // ── Invalid inputs ───────────────────────────────────────────────────────
  it("returns null for invalid arrival date string", () => {
    expect(calcNights("not-a-date", "2025-05-24")).toBeNull();
  });

  it("returns null for invalid departure date string", () => {
    expect(calcNights("2025-05-20", "not-a-date")).toBeNull();
  });

  it("returns null for both invalid date strings", () => {
    expect(calcNights("abc", "xyz")).toBeNull();
  });

  it("returns 31 for partial date strings that JavaScript can parse (YYYY-MM)", () => {
    // new Date("2025-05") parses as May 1 2025 — this is valid JS behaviour
    // calcNights correctly returns the difference (31 days = May to June)
    const result = calcNights("2025-05", "2025-06");
    expect(result).toBe(31);
  });
});
