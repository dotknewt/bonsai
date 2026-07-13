import { describe, it, expect } from "vitest";
import {
  clampDay, dateFor, normalizeTask, windowStatus, angleForMonthDay,
  fmtDate, fmtWindow, fmtISODate, sortTasksByStart, daysUntilText,
} from "./dates.js";

describe("clampDay", () => {
  it("clamps below 1 up to 1", () => {
    expect(clampDay(4, 0)).toBe(1);
    expect(clampDay(4, -5)).toBe(1);
  });

  it("clamps above the month length down to it", () => {
    expect(clampDay(4, 31)).toBe(30); // April has 30 days
  });

  it("always clamps February to 28, even in what would be a leap year", () => {
    expect(clampDay(2, 29)).toBe(28);
    expect(clampDay(2, 30)).toBe(28);
  });

  it("passes through valid days unchanged", () => {
    expect(clampDay(1, 15)).toBe(15);
  });
});

describe("dateFor", () => {
  it("returns local midnight", () => {
    const d = dateFor(2020, 6, 15);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it("clamps an out-of-range day instead of throwing/rolling over", () => {
    const d = dateFor(2020, 2, 30);
    expect(d.getMonth()).toBe(1); // still February
    expect(d.getDate()).toBe(28);
  });
});

describe("normalizeTask", () => {
  it("migrates legacy month/day to startMonth/startDay and strips the legacy keys", () => {
    const out = normalizeTask({ title: "Repot", month: 4, day: 15, category: "repot" });
    expect(out.startMonth).toBe(4);
    expect(out.startDay).toBe(15);
    expect(out).not.toHaveProperty("month");
    expect(out).not.toHaveProperty("day");
  });

  it("clamps a legacy day that's invalid for its month", () => {
    const out = normalizeTask({ title: "X", month: 2, day: 30 });
    expect(out.startDay).toBe(28);
  });

  it("passes through the current shape unchanged (aside from computing an end)", () => {
    const out = normalizeTask({ title: "X", startMonth: 5, startDay: 1, endMonth: 5, endDay: 20 });
    expect(out.startMonth).toBe(5);
    expect(out.startDay).toBe(1);
    expect(out.endMonth).toBe(5);
    expect(out.endDay).toBe(20);
  });

  it("computes a missing end from the category's default span", () => {
    const out = normalizeTask({ title: "X", startMonth: 4, startDay: 1, category: "repot" }); // spanDays: 21
    expect(out.endMonth).toBe(4);
    expect(out.endDay).toBe(22);
  });

  it("computes a missing end that rolls into the next month", () => {
    // "feed" has spanDays: 90 — Dec 20 + 90 days rolls well into the next year (REF_YEAR-relative)
    const out = normalizeTask({ title: "X", startMonth: 12, startDay: 20, category: "feed" });
    expect(out.endMonth).toBe(3);
    expect(out.endDay).toBe(20);
  });

  it("falls back to the 'other' span for an unknown category", () => {
    const out = normalizeTask({ title: "X", startMonth: 1, startDay: 1, category: "bogus" }); // other: 14
    expect(out.endMonth).toBe(1);
    expect(out.endDay).toBe(15);
  });

  it("still clamps a provided endDay", () => {
    const out = normalizeTask({ title: "X", startMonth: 1, startDay: 1, endMonth: 2, endDay: 30 });
    expect(out.endDay).toBe(28);
  });

  it("recomputes both end fields when only one of endMonth/endDay is provided", () => {
    const out = normalizeTask({ title: "X", startMonth: 4, startDay: 1, endMonth: 5, category: "repot" });
    // endDay was missing, so both get recomputed from the category span rather than
    // keeping the stale endMonth: 5
    expect(out.endMonth).toBe(4);
    expect(out.endDay).toBe(22);
  });
});

describe("windowStatus", () => {
  it("is open when today falls inside a non-wrapping window", () => {
    const task = { startMonth: 4, startDay: 15, endMonth: 5, endDay: 5 };
    const st = windowStatus(task, new Date(2024, 3, 20));
    expect(st.open).toBe(true);
  });

  it("is closed, with a same-year start, when today is before a non-wrapping window", () => {
    const task = { startMonth: 4, startDay: 15, endMonth: 5, endDay: 5 };
    const st = windowStatus(task, new Date(2024, 2, 1)); // March 1
    expect(st.open).toBe(false);
    expect(st.start.getFullYear()).toBe(2024);
    expect(st.start.getMonth()).toBe(3);
  });

  it("is closed, with a next-year start, when today is after a non-wrapping window", () => {
    const task = { startMonth: 4, startDay: 15, endMonth: 5, endDay: 5 };
    const st = windowStatus(task, new Date(2024, 5, 1)); // June 1
    expect(st.open).toBe(false);
    expect(st.start.getFullYear()).toBe(2025);
  });

  describe("year-wrapping window (Nov 15 - Feb 1)", () => {
    const task = { startMonth: 11, startDay: 15, endMonth: 2, endDay: 1 };

    it("is open when today is in December (end rolls into next year)", () => {
      const st = windowStatus(task, new Date(2024, 11, 20));
      expect(st.open).toBe(true);
      expect(st.end.getFullYear()).toBe(2025);
    });

    it("is open when today is in January (start rolled back into previous year)", () => {
      const st = windowStatus(task, new Date(2025, 0, 10));
      expect(st.open).toBe(true);
      expect(st.start.getFullYear()).toBe(2024);
    });

    it("is closed with the correct next start when today is strictly between end and start", () => {
      const st = windowStatus(task, new Date(2024, 5, 15)); // June
      expect(st.open).toBe(false);
      expect(st.start.getFullYear()).toBe(2024);
      expect(st.start.getMonth()).toBe(10); // November this year, not next
      expect(st.start.getDate()).toBe(15);
    });
  });

  it("treats the exact start day as open", () => {
    const task = { startMonth: 4, startDay: 15, endMonth: 5, endDay: 5 };
    const st = windowStatus(task, new Date(2024, 3, 15));
    expect(st.open).toBe(true);
  });

  it("treats the exact end day as open", () => {
    const task = { startMonth: 4, startDay: 15, endMonth: 5, endDay: 5 };
    const st = windowStatus(task, new Date(2024, 4, 5));
    expect(st.open).toBe(true);
  });
});

describe("angleForMonthDay", () => {
  it("puts Jan 1 at -90 degrees (top of the circle)", () => {
    expect(angleForMonthDay(1, 1)).toBe(-90);
  });

  it("puts late December just short of a full turn back to -90", () => {
    const angle = angleForMonthDay(12, 31);
    expect(angle).toBeGreaterThan(260);
    expect(angle).toBeLessThan(270);
  });
});

describe("fmtDate / fmtWindow", () => {
  it("formats a date without throwing and includes the day number", () => {
    const d = new Date(2024, 3, 15);
    expect(fmtDate(d)).toMatch(/15/);
  });

  it("formats a window as 'start – end'", () => {
    const start = new Date(2024, 3, 15);
    const end = new Date(2024, 4, 5);
    expect(fmtWindow({ start, end })).toContain("–");
  });
});

describe("fmtISODate", () => {
  it("parses YYYY-MM-DD as a local date, not through UTC", () => {
    const out = fmtISODate("2024-04-15");
    // Reconstruct what a local-date parse should look like and compare via
    // the same locale formatter, so this isn't sensitive to the runner's TZ.
    const expected = new Date(2024, 3, 15).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    expect(out).toBe(expected);
  });
});

describe("sortTasksByStart", () => {
  it("sorts by startMonth then startDay without mutating the input", () => {
    const tasks = [
      { id: "b", startMonth: 3, startDay: 1 },
      { id: "a", startMonth: 1, startDay: 15 },
      { id: "c", startMonth: 1, startDay: 5 },
    ];
    const original = [...tasks];
    const sorted = sortTasksByStart(tasks);
    expect(sorted.map((t) => t.id)).toEqual(["c", "a", "b"]);
    expect(tasks).toEqual(original); // input untouched
    expect(sorted).not.toBe(tasks); // new array
  });
});

describe("daysUntilText", () => {
  const today = new Date(2024, 3, 15);

  it("says 'Today' at diff 0", () => {
    expect(daysUntilText(new Date(2024, 3, 15), today)).toBe("Today");
  });

  it("says 'Tomorrow' at diff 1", () => {
    expect(daysUntilText(new Date(2024, 3, 16), today)).toBe("Tomorrow");
  });

  it("says 'in N days' at diff 30", () => {
    expect(daysUntilText(new Date(2024, 4, 15), today)).toBe("in 30 days");
  });

  it("falls back to a formatted date at diff 31", () => {
    const out = daysUntilText(new Date(2024, 4, 16), today);
    expect(out).not.toMatch(/^in \d+ days$/);
    expect(out).not.toBe("Today");
  });

  it("doesn't crash on a date in the past", () => {
    expect(() => daysUntilText(new Date(2024, 2, 1), today)).not.toThrow();
  });
});
