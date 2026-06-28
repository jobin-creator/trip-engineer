import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  isRateLimited,
  rateLimitMap,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from "../lib/routeUtils";

// Use a unique IP prefix per test file to avoid cross-test pollution
const IP = "test-rate-1.2.3.";

describe("isRateLimited", () => {

  beforeEach(() => {
    // Clear all entries that belong to this test suite before each test
    for (const key of rateLimitMap.keys()) {
      if (key.startsWith(IP)) rateLimitMap.delete(key);
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── First request ────────────────────────────────────────────────────────
  it("allows the first request from a new IP", () => {
    expect(isRateLimited(`${IP}1`)).toBe(false);
  });

  it("sets count to 1 after first request", () => {
    const ip = `${IP}2`;
    isRateLimited(ip);
    expect(rateLimitMap.get(ip)?.count).toBe(1);
  });

  // ── Within limit ─────────────────────────────────────────────────────────
  it("allows requests up to the max limit", () => {
    const ip = `${IP}3`;
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      expect(isRateLimited(ip)).toBe(false);
    }
  });

  it("increments count correctly across multiple requests", () => {
    const ip = `${IP}4`;
    isRateLimited(ip); // 1
    isRateLimited(ip); // 2
    isRateLimited(ip); // 3
    expect(rateLimitMap.get(ip)?.count).toBe(3);
  });

  // ── At limit ─────────────────────────────────────────────────────────────
  it("blocks the request that exceeds the max limit", () => {
    const ip = `${IP}5`;
    // Use up all allowed requests
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      isRateLimited(ip);
    }
    // This one should be blocked
    expect(isRateLimited(ip)).toBe(true);
  });

  it("keeps blocking after the limit is exceeded", () => {
    const ip = `${IP}6`;
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      isRateLimited(ip);
    }
    expect(isRateLimited(ip)).toBe(true);
    expect(isRateLimited(ip)).toBe(true);
  });

  // ── Window reset ─────────────────────────────────────────────────────────
  it("resets the count after the window expires", () => {
    vi.useFakeTimers();
    const ip = `${IP}7`;

    // Max out the limit
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      isRateLimited(ip);
    }
    expect(isRateLimited(ip)).toBe(true);

    // Advance time past the window
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);

    // Should be allowed again
    expect(isRateLimited(ip)).toBe(false);
  });

  it("resets the window start time after expiry", () => {
    vi.useFakeTimers();
    const now = Date.now();
    const ip = `${IP}8`;

    isRateLimited(ip);
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);
    isRateLimited(ip);

    const entry = rateLimitMap.get(ip);
    expect(entry?.windowStart).toBeGreaterThan(now);
  });

  // ── Different IPs are independent ────────────────────────────────────────
  it("tracks different IPs independently", () => {
    const ip1 = `${IP}9`;
    const ip2 = `${IP}10`;

    // Max out ip1
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      isRateLimited(ip1);
    }

    // ip2 should still be allowed
    expect(isRateLimited(ip1)).toBe(true);
    expect(isRateLimited(ip2)).toBe(false);
  });
});
