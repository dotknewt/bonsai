import { describe, it, expect } from "vitest";
import { arcPath, packLanes } from "./ringGeometry.js";

describe("arcPath", () => {
  it("uses the small-arc flag when sweep <= 180", () => {
    expect(arcPath(50, 50, 30, 0, 90)).toMatch(/A 30 30 0 0 1/);
  });

  it("uses the small-arc flag exactly at the 180 boundary", () => {
    expect(arcPath(50, 50, 30, 0, 180)).toMatch(/A 30 30 0 0 1/);
  });

  it("uses the large-arc flag when sweep > 180", () => {
    expect(arcPath(50, 50, 30, 0, 181)).toMatch(/A 30 30 0 1 1/);
  });

  it("doesn't throw on a degenerate zero-sweep arc", () => {
    expect(() => arcPath(50, 50, 30, 0, 0)).not.toThrow();
  });

  it("returns a well-formed SVG path string", () => {
    const path = arcPath(50, 50, 30, 0, 90);
    expect(path).toMatch(/^M /);
    expect(path).toContain("A");
  });
});

describe("packLanes", () => {
  it("puts non-overlapping items all in lane 0", () => {
    const items = [
      { startAngle: 0, sweep: 10 },
      { startAngle: 100, sweep: 10 },
    ];
    const laneCount = packLanes(items, 0);
    expect(laneCount).toBe(1);
    expect(items[0].lane).toBe(0);
    expect(items[1].lane).toBe(0);
  });

  it("splits two overlapping items into different lanes", () => {
    const items = [
      { startAngle: 0, sweep: 20 },
      { startAngle: 10, sweep: 20 },
    ];
    const laneCount = packLanes(items, 0);
    expect(laneCount).toBe(2);
    expect(items[0].lane).not.toBe(items[1].lane);
  });

  it("uses three distinct lanes when all three mutually overlap", () => {
    const items = [
      { startAngle: 0, sweep: 30 },
      { startAngle: 10, sweep: 30 },
      { startAngle: 20, sweep: 30 },
    ];
    const laneCount = packLanes(items, 0);
    expect(laneCount).toBe(3);
    const lanes = items.map((i) => i.lane);
    expect(new Set(lanes).size).toBe(3);
  });

  it("detects overlap across the 360-degree wraparound", () => {
    const items = [
      { startAngle: 350, sweep: 30 }, // wraps: covers [350,360) and [0,20)
      { startAngle: 10, sweep: 10 },  // sits at [10,20) — inside the wrapped piece
    ];
    const laneCount = packLanes(items, 0);
    expect(laneCount).toBe(2);
    expect(items[0].lane).not.toBe(items[1].lane);
  });

  it("applies padding asymmetrically — only to the end of the interval", () => {
    // item A: [0, 10); item B starts right where A's padded-forward copy would
    // reach (10 + padding), so they should be forced apart...
    const padded = [
      { startAngle: 0, sweep: 10 },
      { startAngle: 15, sweep: 10 },
    ];
    expect(packLanes(padded, 6)).toBe(2);

    // ...but with no padding, those same two non-touching items fit in one lane.
    const unpadded = [
      { startAngle: 0, sweep: 10 },
      { startAngle: 15, sweep: 10 },
    ];
    expect(packLanes(unpadded, 0)).toBe(1);
  });

  it("mutates the input items directly rather than returning a new array", () => {
    const items = [{ startAngle: 0, sweep: 10 }];
    const result = packLanes(items, 0);
    expect(typeof result).toBe("number");
    expect(items[0]).toHaveProperty("lane", 0);
  });
});
