import { defaultSpanDays } from "./categories.js";

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTH_LETTERS = ["J","F","M","A","M","J","J","A","S","O","N","D"];
export const REF_YEAR = 2001; // non-leap year used for pure month/day arithmetic

export function seasonLabel(month) {
  return ({
    1: "Late winter", 2: "Late winter", 3: "Early spring", 4: "Early spring",
    5: "Spring", 6: "Early summer", 7: "Midsummer", 8: "Late summer",
    9: "Autumn", 10: "Autumn", 11: "Early winter", 12: "Winter",
  })[month];
}

export function clampDay(month, day) {
  return Math.max(1, Math.min(day, DAYS_IN_MONTH[month - 1]));
}

export function dateFor(year, month, day) {
  const d = new Date(year, month - 1, clampDay(month, day));
  d.setHours(0, 0, 0, 0);
  return d;
}

/* Accepts both the current shape (startMonth/startDay/endMonth/endDay) and the
   legacy single-date shape (month/day). A missing end gets the category's
   default span. */
export function normalizeTask(t) {
  const startMonth = t.startMonth ?? t.month ?? 1;
  const startDay = clampDay(startMonth, t.startDay ?? t.day ?? 1);
  let { endMonth, endDay } = t;
  if (endMonth == null || endDay == null) {
    const end = dateFor(REF_YEAR, startMonth, startDay);
    end.setDate(end.getDate() + defaultSpanDays(t.category));
    endMonth = end.getMonth() + 1;
    endDay = end.getDate();
  } else {
    endDay = clampDay(endMonth, endDay);
  }
  const { month, day, ...rest } = t;
  return { ...rest, startMonth, startDay, endMonth, endDay };
}

/* Where does today fall relative to a task's yearly window? Windows may wrap
   the year boundary (e.g. Nov 15 – Feb 1). */
export function windowStatus(t, from = new Date()) {
  const today = new Date(from); today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  for (const sy of [y - 1, y]) {
    const start = dateFor(sy, t.startMonth, t.startDay);
    let end = dateFor(sy, t.endMonth, t.endDay);
    if (end < start) end = dateFor(sy + 1, t.endMonth, t.endDay);
    if (today >= start && today <= end) return { open: true, start, end };
  }
  let start = dateFor(y, t.startMonth, t.startDay);
  if (start < today) start = dateFor(y + 1, t.startMonth, t.startDay);
  let end = dateFor(start.getFullYear(), t.endMonth, t.endDay);
  if (end < start) end = dateFor(start.getFullYear() + 1, t.endMonth, t.endDay);
  return { open: false, start, end };
}

export function angleForMonthDay(month, day) {
  const dim = DAYS_IN_MONTH[month - 1];
  const frac = (month - 1) / 12 + ((day - 1) / Math.max(dim, 1)) / 12;
  return frac * 360 - 90;
}

export function fmtDate(d) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function fmtWindow(status) {
  return `${fmtDate(status.start)} – ${fmtDate(status.end)}`;
}

export function daysUntilText(d, from = new Date()) {
  const today = new Date(from); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 30) return `in ${diff} days`;
  return fmtDate(d);
}
