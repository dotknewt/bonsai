import { describe, it, expect } from "vitest";
import { CATS, defaultSpanDays, catOf } from "./categories.js";

describe("defaultSpanDays", () => {
  it("returns the known category's span", () => {
    expect(defaultSpanDays("repot")).toBe(CATS.repot.spanDays);
  });

  it("falls back to 'other' for an unknown category", () => {
    expect(defaultSpanDays("bogus")).toBe(CATS.other.spanDays);
    expect(defaultSpanDays(undefined)).toBe(CATS.other.spanDays);
  });
});

describe("catOf", () => {
  it("passes through a known category", () => {
    expect(catOf({ category: "prune" })).toBe("prune");
  });

  it("falls back to 'other' for an unknown or missing category", () => {
    expect(catOf({ category: "bogus" })).toBe("other");
    expect(catOf({})).toBe("other");
  });
});
