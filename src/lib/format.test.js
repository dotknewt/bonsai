import { describe, it, expect } from "vitest";
import { plural } from "./format.js";

describe("plural", () => {
  it("pluralizes at 0 and 2, keeps singular at 1", () => {
    expect(plural(0, "task")).toBe("0 tasks");
    expect(plural(1, "task")).toBe("1 task");
    expect(plural(2, "task")).toBe("2 tasks");
  });
});
