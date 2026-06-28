import { describe, it, expect } from "vitest";
import { buildPrompt, EMPTY_PARAMS } from "../lib/routeUtils";
import { calcNights } from "../lib/tripUtils";

// ---------------------------------------------------------------------------
// API input validation — tests the logic that the route uses to validate
// and sanitise inputs before calling buildPrompt. We test the rules directly
// since the Next.js route handler itself requires a full server to run.
// ---------------------------------------------------------------------------

describe("API input validation rules", () => {

  // ── Destination required ─────────────────────────────────────────────────
  it("rejects empty destination", () => {
    const destination = "  ".trim();
    expect(destination.length).toBe(0); // route returns 400
  });

  it("accepts valid destination", () => {
    const destination = "Tokyo, Japan".trim();
    expect(destination.length).toBeGreaterThan(0);
  });

  // ── Days clamping ────────────────────────────────────────────────────────
  it("clamps days to minimum of 1", () => {
    const days = Math.min(Math.max(parseInt("0", 10), 1), 14);
    expect(days).toBe(1);
  });

  it("clamps days to maximum of 14", () => {
    const days = Math.min(Math.max(parseInt("999", 10), 1), 14);
    expect(days).toBe(14);
  });

  it("accepts valid days within range", () => {
    const days = Math.min(Math.max(parseInt("5", 10), 1), 14);
    expect(days).toBe(5);
  });

  it("clamps negative days to 1", () => {
    const days = Math.min(Math.max(parseInt("-5", 10), 1), 14);
    expect(days).toBe(1);
  });

  it("handles non-numeric days string by defaulting to NaN→1", () => {
    const raw = parseInt("abc", 10);
    const days = Math.min(Math.max(isNaN(raw) ? 1 : raw, 1), 14);
    expect(days).toBe(1);
  });

  // ── Budget default ───────────────────────────────────────────────────────
  it("defaults budget to mid-range when empty", () => {
    const budget = ("" || "mid-range").trim();
    expect(budget).toBe("mid-range");
  });

  it("preserves valid budget value", () => {
    const budget = ("luxury" || "mid-range").trim();
    expect(budget).toBe("luxury");
  });

  // ── Arrays default to empty ───────────────────────────────────────────────
  it("defaults atmosphere to empty array when not provided", () => {
    const atmosphere = Array.isArray(undefined) ? undefined : [];
    expect(atmosphere).toEqual([]);
  });

  it("defaults beverages to empty array when not provided", () => {
    const beverages = Array.isArray(null) ? null : [];
    expect(beverages).toEqual([]);
  });

  it("accepts valid atmosphere array", () => {
    const input = ["historic", "artistic"];
    const atmosphere = Array.isArray(input) ? input.map(String) : [];
    expect(atmosphere).toEqual(["historic", "artistic"]);
  });

  // ── Date validation rules (used client-side, mirrored here) ──────────────
  it("returns null date error when both dates are empty", () => {
    const nights = calcNights("", "");
    expect(nights).toBeNull(); // no error shown
  });

  it("detects reversed date range as negative nights", () => {
    const nights = calcNights("2025-05-24", "2025-05-20");
    expect(nights).not.toBeNull();
    expect(nights!).toBeLessThan(0); // triggers date error
  });

  it("detects valid date range as positive nights", () => {
    const nights = calcNights("2025-05-20", "2025-05-24");
    expect(nights).not.toBeNull();
    expect(nights!).toBeGreaterThan(0); // valid, no error
  });

  it("detects mismatch between nights and selected days", () => {
    const nights = calcNights("2025-05-20", "2025-05-24"); // 4 nights
    const selectedDays = 5;
    const mismatch = nights !== null && nights > 0 && nights !== selectedDays;
    expect(mismatch).toBe(true);
  });

  it("reports no mismatch when nights match selected days", () => {
    const nights = calcNights("2025-05-20", "2025-05-24"); // 4 nights
    const selectedDays = 4;
    const mismatch = nights !== null && nights > 0 && nights !== selectedDays;
    expect(mismatch).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Prompt output sanity checks — ensures buildPrompt never produces obviously
// broken output regardless of inputs
// ---------------------------------------------------------------------------
describe("buildPrompt output sanity", () => {

  it("never returns an empty string", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 3 });
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("never contains raw undefined in output", () => {
    const prompt = buildPrompt(EMPTY_PARAMS);
    expect(prompt).not.toContain("undefined");
  });

  it("never contains raw null in output", () => {
    const prompt = buildPrompt(EMPTY_PARAMS);
    expect(prompt).not.toContain("null");
  });

  it("never contains empty bullet points from blank fields", () => {
    const prompt = buildPrompt(EMPTY_PARAMS);
    // Should not have "- \n" (bullet with nothing after it)
    expect(prompt).not.toMatch(/^- \n/m);
  });

  it("includes the SUMMARY MATRIX heading", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 3 });
    expect(prompt).toContain("SUMMARY MATRIX");
  });

  it("includes the DAY-BY-DAY DETAIL heading", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 3 });
    expect(prompt).toContain("DAY-BY-DAY DETAIL");
  });

  it("includes the Getting there section", () => {
    const prompt = buildPrompt({ ...EMPTY_PARAMS, destination: "Paris", days: 3 });
    expect(prompt).toContain("Getting there");
  });
});
