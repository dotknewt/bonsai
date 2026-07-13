import { describe, it, expect } from "vitest";
import { doyOf, doyInRange, overlapRanges } from "./overlap.js";

describe("doyOf", () => {
  it("Jan 1 is day 0", () => {
    expect(doyOf(1, 1)).toBe(0);
  });

  it("Dec 31 is day 364", () => {
    expect(doyOf(12, 31)).toBe(364);
  });

  it("clamps an invalid day (Feb 29) before computing", () => {
    expect(doyOf(2, 29)).toBe(doyOf(2, 28));
  });
});

describe("doyInRange", () => {
  it("handles a non-wrapping range", () => {
    const r = { start: 10, end: 20 };
    expect(doyInRange(15, r)).toBe(true);
    expect(doyInRange(10, r)).toBe(true);
    expect(doyInRange(20, r)).toBe(true);
    expect(doyInRange(5, r)).toBe(false);
    expect(doyInRange(25, r)).toBe(false);
  });

  it("handles a wrapping range (start > end)", () => {
    const r = { start: 350, end: 10 };
    expect(doyInRange(355, r)).toBe(true); // tail end
    expect(doyInRange(5, r)).toBe(true);   // head end
    expect(doyInRange(180, r)).toBe(false); // mid-year, outside
  });
});

describe("overlapRanges", () => {
  const task = (speciesId, startMonth, startDay, endMonth, endDay) =>
    ({ speciesId, startMonth, startDay, endMonth, endDay });

  it("finds one range where two different species' windows overlap", () => {
    const tasks = [
      task("a", 4, 1, 4, 20),
      task("b", 4, 10, 4, 30),
    ];
    const ranges = overlapRanges(tasks);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].speciesIds.sort()).toEqual(["a", "b"]);
  });

  it("returns nothing when windows don't overlap", () => {
    const tasks = [
      task("a", 1, 1, 1, 10),
      task("b", 6, 1, 6, 10),
    ];
    expect(overlapRanges(tasks)).toEqual([]);
  });

  it("does not count the same species' own two tasks as an overlap", () => {
    const tasks = [
      task("a", 4, 1, 4, 20),
      task("a", 4, 10, 4, 30),
    ];
    expect(overlapRanges(tasks)).toEqual([]);
  });

  it("splits into distinct ranges when the overlapping set changes mid-window", () => {
    // A+B overlap days 10-14, then A+B+C overlap days 15-17
    const tasks = [
      task("a", 1, 10, 1, 17),
      task("b", 1, 10, 1, 17),
      task("c", 1, 15, 1, 20),
    ];
    const ranges = overlapRanges(tasks);
    expect(ranges.length).toBeGreaterThanOrEqual(2);
    const keys = ranges.map((r) => r.key);
    expect(new Set(keys).size).toBe(ranges.length); // each range has a distinct signature
  });

  it("stitches an overlap that spans the New Year boundary into a single range", () => {
    const tasks = [
      task("a", 12, 20, 1, 10), // wraps year: late Dec through early Jan
      task("b", 12, 15, 1, 5),  // also wraps, overlapping "a" across the boundary
    ];
    const ranges = overlapRanges(tasks);
    // Without stitching this would show up as two separate ranges split at the
    // day-364/day-0 array boundary.
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start).toBeGreaterThan(340);
    expect(ranges[0].end).toBeLessThan(20);
  });

  it("does not stitch when the boundary-touching ranges have different signatures", () => {
    const tasks = [
      task("a", 12, 28, 12, 31), // ends at the year boundary, doesn't wrap
      task("b", 12, 28, 12, 31),
      task("c", 1, 1, 1, 3),     // starts at the year boundary, different combo
      task("d", 1, 1, 1, 3),
    ];
    const ranges = overlapRanges(tasks);
    expect(ranges).toHaveLength(2);
    expect(ranges[0].key).not.toBe(ranges[1].key);
  });
});
