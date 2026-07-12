import { DAYS_IN_MONTH, REF_YEAR, clampDay, dateFor, fmtDate } from "./dates.js";

/* ---------- day-of-year math for overlap detection (non-leap, 365 days) ---------- */
export const YEAR_DAYS = 365;

export function doyOf(month, day) {
  let n = 0;
  for (let i = 0; i < month - 1; i++) n += DAYS_IN_MONTH[i];
  return n + (clampDay(month, day) - 1);
}

function monthDayFromDoy(doy) {
  let m = 0, d = doy;
  while (d >= DAYS_IN_MONTH[m]) { d -= DAYS_IN_MONTH[m]; m++; }
  return { month: m + 1, day: d + 1 };
}

export function angleForDoy(doy) {
  return (doy / YEAR_DAYS) * 360 - 90;
}

export function fmtDoy(doy) {
  const { month, day } = monthDayFromDoy(doy);
  return fmtDate(dateFor(REF_YEAR, month, day));
}

export function doyInRange(doy, r) {
  return r.start <= r.end ? doy >= r.start && doy <= r.end : doy >= r.start || doy <= r.end;
}

/* Ranges of the year where windows from at least two *different* species are
   open at once. Consecutive days are grouped while the set of open species
   stays the same, so each returned range names exactly who is in it. */
export function overlapRanges(tasks) {
  const perDay = Array.from({ length: YEAR_DAYS }, () => new Set());
  tasks.forEach((t) => {
    const s = doyOf(t.startMonth, t.startDay), e = doyOf(t.endMonth, t.endDay);
    if (s <= e) for (let d = s; d <= e; d++) perDay[d].add(t.speciesId);
    else {
      for (let d = s; d < YEAR_DAYS; d++) perDay[d].add(t.speciesId);
      for (let d = 0; d <= e; d++) perDay[d].add(t.speciesId);
    }
  });
  const sig = perDay.map((set) => set.size >= 2 ? [...set].sort().join("|") : "");
  const ranges = [];
  let start = null;
  for (let d = 0; d < YEAR_DAYS; d++) {
    if (!sig[d]) continue;
    if (d === 0 || sig[d] !== sig[d - 1]) start = d;
    if (d === YEAR_DAYS - 1 || sig[d + 1] !== sig[d]) ranges.push({ start, end: d, key: sig[d] });
  }
  // a range that runs across New Year comes out as two pieces — stitch them
  if (ranges.length >= 2) {
    const first = ranges[0], last = ranges[ranges.length - 1];
    if (first.start === 0 && last.end === YEAR_DAYS - 1 && first.key === last.key) {
      first.start = last.start;
      ranges.pop();
    }
  }
  return ranges.map((r) => ({ ...r, speciesIds: r.key.split("|") }));
}
