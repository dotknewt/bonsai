import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw, Droplet, Scissors, Link2, Sprout, Bug, Leaf,
  Plus, X, Check, Trash2, Upload, CalendarDays, Loader2,
  Share2, Copy, BookOpen
} from "lucide-react";
import FormatGuide from "./FormatGuide.jsx";

/* ---------- theme tokens ---------- */
/* spanDays = default window length when a task is given without an end date */
const CATS = {
  repot:     { label: "Repot",      color: "#C97A3D", icon: RotateCcw,    spanDays: 21 },
  feed:      { label: "Feed",       color: "#8FA876", icon: Droplet,      spanDays: 90 },
  prune:     { label: "Prune",      color: "#D9A441", icon: Scissors,     spanDays: 30 },
  wire:      { label: "Wire",       color: "#C1552E", icon: Link2,        spanDays: 60 },
  propagate: { label: "Propagate",  color: "#5B8C7B", icon: Sprout,       spanDays: 30 },
  seed:      { label: "Seed",       color: "#B08968", icon: Leaf,         spanDays: 21 },
  pest:      { label: "Pest watch", color: "#B4483A", icon: Bug,          spanDays: 90 },
  other:     { label: "General",    color: "#8A9086", icon: CalendarDays, spanDays: 14 },
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_LETTERS = ["J","F","M","A","M","J","J","A","S","O","N","D"];
const REF_YEAR = 2001; // non-leap year used for pure month/day arithmetic

function seasonLabel(month) {
  return ({
    1: "Late winter", 2: "Late winter", 3: "Early spring", 4: "Early spring",
    5: "Spring", 6: "Early summer", 7: "Midsummer", 8: "Late summer",
    9: "Autumn", 10: "Autumn", 11: "Early winter", 12: "Winter",
  })[month];
}

function clampDay(month, day) {
  return Math.max(1, Math.min(day, DAYS_IN_MONTH[month - 1]));
}

function dateFor(year, month, day) {
  const d = new Date(year, month - 1, clampDay(month, day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultSpanDays(category) {
  return (CATS[category] || CATS.other).spanDays;
}

/* Accepts both the current shape (startMonth/startDay/endMonth/endDay) and the
   legacy single-date shape (month/day). A missing end gets the category's
   default span. */
function normalizeTask(t) {
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
function windowStatus(t, from = new Date()) {
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

function angleForMonthDay(month, day) {
  const dim = DAYS_IN_MONTH[month - 1];
  const frac = (month - 1) / 12 + ((day - 1) / Math.max(dim, 1)) / 12;
  return frac * 360 - 90;
}

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function fmtWindow(status) {
  return `${fmtDate(status.start)} – ${fmtDate(status.end)}`;
}

function daysUntilText(d, from = new Date()) {
  const today = new Date(from); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 30) return `in ${diff} days`;
  return fmtDate(d);
}

/* ---------- seed data (Norwegian-shifted timing) ---------- */
const SEED_SPECIES = [{
  id: "juniper-juniperus-procumbens",
  name: "Japanese Garden Juniper",
  botanicalName: "Juniperus procumbens",
  // Care windows adapted from the Bonsai4me Juniperus species guide, shifted ~3-4 weeks for Norway.
  tasks: [
    { id: "j1", title: "Spring health check", month: 4, day: 20, category: "other", description: "Junipers wake late, and a dead one can hold normal foliage colour for weeks after the roots have died. Confirm new growth is actually extending before doing any real work. Full sun all day suits procumbens' needle foliage." },
    { id: "j2", title: "Start high-nitrogen feeding", month: 5, day: 10, category: "feed", description: "Feed fortnightly with a high-nitrogen fertiliser from the start of growth until midsummer. An occasional acidic feed helps, especially in hard-water areas." },
    { id: "j3", title: "Pinch & scissor-prune new shoots", month: 6, day: 1, category: "prune", description: "Through the growing season, pinch only soft new tips; scissor-cut anything that has hardened — pinching hardened growth tears the bark away. Never remove more than about 25% of the foliage at once." },
    { id: "j4", title: "Wiring — growth is supple", month: 6, day: 15, category: "wire", description: "Juniper wood is extremely flexible and can be wired year-round, but wire takes 3 months to a year to set, so check often for biting as branches thicken." },
    { id: "j5", title: "Pest watch", month: 7, day: 10, category: "pest", description: "Dense pads shelter spider mites and scale. Part the foliage and check the interior — mite damage shows as dull, grey-green needles." },
    { id: "j6", title: "Switch to balanced feed", month: 7, day: 15, category: "feed", description: "From midsummer, swap the high-nitrogen fertiliser for a balanced feed, still fortnightly, and continue until winter." },
    { id: "j7", title: "Thin the foliage pads", month: 8, day: 1, category: "prune", description: "Repeated pruning makes pads dense enough to block light and air from interior and lower branches, weakening them until they die back. Thin now so inner shoots stay strong." },
    { id: "j8", title: "Repot (every 3–5 years)", month: 8, day: 20, category: "repot", description: "Junipers repot best in late summer/early autumn, not spring. An inorganic clay-based soil is essential. Never bare-root — replace no more than a third of the soil in any one repotting." },
    { id: "j9", title: "Autumn watering check", month: 9, day: 15, category: "other", description: "Junipers in old, compacted organic soil rot easily if overwatered. As growth slows and autumn rain sets in, make sure the pot drains freely and ease off the can." },
    { id: "j10", title: "Structural wiring window", month: 10, day: 1, category: "wire", description: "The whole tree will need 100% wiring at least once in its life, and autumn is a calm window for it. No heavy bends in trunks or branches once temperatures reach 0°C or below." },
    { id: "j11", title: "Winter protection below −10°C", month: 11, day: 1, category: "other", description: "Fully hardy outdoors, but shelter it (cold frame or unheated shed) when frosts drop below −10°C. Never overwinter indoors — low light, dry air and lost dormancy will kill it." },
  ],
}, {
  id: "mugo-pinus-mugo",
  name: "Mugo Pine",
  botanicalName: "Pinus mugo",
  // Care windows adapted from the Bonsai4me "Pinus mugo Indepth" article and Pinus species guide, shifted ~3-4 weeks for Norway.
  tasks: [
    { id: "m1", title: "Full-sun position for the season", month: 4, day: 20, category: "other", description: "Give maximum light from snowmelt onwards — insufficient sunlight means extended needles and dieback of shaded branches. Plenty of water too, but the soil must drain fast; roots should never sit in water." },
    { id: "m2", title: "Start strong slow-release feeding", month: 5, day: 10, category: "feed", description: "Feed strongly with a slow-release fertiliser from spring through to late summer — mugos take heavy feeding and repay it with vigour." },
    { id: "m3", title: "Pinch the strongest candles", month: 5, day: 25, category: "prune", description: "When candles reach 2.5–4 cm, gently break away the top of any that are noticeably more vigorous than the rest to balance energy across the tree." },
    { id: "m4", title: "Bud selection — reduce to pairs", month: 6, day: 5, category: "prune", description: "Wherever buds cluster, reduce to 2 so each branch forks into two sub-branches. Remove excess buds as and when they appear through spring and summer." },
    { id: "m5", title: "Pest & needle-cast check", month: 6, day: 20, category: "pest", description: "Watch for aphids and pine sawfly larvae on new growth. Needle discolouration in spring or summer can mean fungal needle cast — autumn yellowing of the oldest needles is just natural shedding." },
    { id: "m6", title: "Cut back the first flush", month: 7, day: 1, category: "prune", description: "Cut the first flush back to 1–4 sets of new needles (by branch strength) to force a compact second flush this season. Never remove more than 50% of top growth in one year, and keep old needles wherever you want backbuds — mugos backbud where needles remain, not where they've been removed." },
    { id: "m7", title: "Repot window — summer, not spring", month: 7, day: 20, category: "repot", description: "Mugos react far better to summer repotting than the spring timing used for other pines: do it after the first flush is cut back. Pick old, poor-draining soil out by hand (never wash the roots); on weaker trees remove only half the compacted soil. In heat above ~27°C, shade for two weeks and mist the foliage twice daily." },
    { id: "m8", title: "Final feed of the season", month: 8, day: 25, category: "feed", description: "Feeding runs to late summer, then stops so the second flush can harden off before the Norwegian winter." },
    { id: "m9", title: "Styling & wiring window", month: 9, day: 1, category: "wire", description: "Late summer/early autumn is the main window to style and wire mugo pines. One insult per year: after repotting, styling or drastic pruning, wait 12 months before the next major work — a tree styled now can't be repotted next summer." },
    { id: "m10", title: "Heavy pruning / trunk chops", month: 10, day: 1, category: "prune", description: "Autumn is the time for trunk chops and heavy branch removal on pines. Leave a short stump and seal the wound. This counts as the year's one insult." },
    { id: "m11", title: "Winter — hardiness check", month: 10, day: 20, category: "other", description: "A mountain native, mugo shrugs off severe cold, but shield it from freezing winds while the rootball is frozen. Yellowing oldest needles now is natural shedding, not trouble." },
  ],
}, {
  id: "beech-fagus-sylvatica",
  name: "European Beech",
  botanicalName: "Fagus sylvatica",
  tasks: [
    { id: "t1", title: "Repot (every 2 years)", startMonth: 5, startDay: 1, endMonth: 5, endDay: 21, category: "repot", description: "Repot in a basic soil mix as buds swell. Norwegian springs run 3–4 weeks behind the UK, so go by bud movement, not the date." },
    { id: "t2", title: "Feed — trees still developing", startMonth: 5, startDay: 10, endMonth: 8, endDay: 20, category: "feed", description: "If trunk or branch structure is still being built, feed from the moment leaves unfurl right through the growing season." },
    { id: "t3", title: "Fortnightly feeding — refined trees", startMonth: 6, startDay: 5, endMonth: 8, endDay: 20, category: "feed", description: "Refined trees get a 3–4 week feeding hold after leaf-out to keep spring growth fine, then feed fortnightly until late summer." },
    { id: "t4", title: "Prune to bud", startMonth: 6, startDay: 15, endMonth: 7, endDay: 15, category: "prune", description: "Once spring growth has fully extended, cut back to a bud facing the direction you want new growth to take." },
    { id: "t5", title: "Wiring — check often", startMonth: 6, startDay: 16, endMonth: 9, endDay: 15, category: "wire", description: "Branches thicken fast now. Beech bark is smooth and scars easily, so inspect wire every few days while it's on." },
    { id: "t6", title: "Air-layering window", startMonth: 7, startDay: 5, endMonth: 8, endDay: 5, category: "propagate", description: "Take air-layers once this year's spring growth has hardened off." },
    { id: "t7", title: "Optional hard pruning", startMonth: 7, startDay: 6, endMonth: 8, endDay: 1, category: "prune", description: "Midsummer is an alternative to late-winter hard pruning — wounds heal fastest now, so it's also the best time to remove large branches." },
    { id: "t8", title: "Pest & disease watch", startMonth: 6, startDay: 1, endMonth: 9, endDay: 15, category: "pest", description: "Watch for aphids, whitefly, bark scale and powdery mildew through the growing season." },
    { id: "t9", title: "Final feeds of the season", startMonth: 8, startDay: 20, endMonth: 9, endDay: 10, category: "feed", description: "Taper feeding off through this window so growth can harden before autumn." },
    { id: "t10", title: "Autumn colour & seed sowing", startMonth: 9, startDay: 25, endMonth: 10, endDay: 31, category: "seed", description: "Foliage turns yellow to orange-brown and often stays on through winter. Sow fresh beechmast outdoors now for natural stratification." },
    { id: "t11", title: "Start winter seed stratification", startMonth: 11, startDay: 15, endMonth: 12, endDay: 31, category: "seed", description: "If seed wasn't sown outdoors in autumn, begin cold-stratifying it indoors for a spring sowing." },
    { id: "t12", title: "Late-winter hard pruning window", startMonth: 2, startDay: 15, endMonth: 3, endDay: 20, category: "prune", description: "The alternative to midsummer hard pruning — do this before spring growth resumes." },
  ],
}];

/* ---------- export helper ---------- */
function toExportObject(s) {
  return { name: s.name, botanicalName: s.botanicalName, tasks: s.tasks.map(({ id, ...rest }) => rest) };
}

/* ---------- storage helpers (localStorage) ---------- */
async function loadJSON(key, fallback) {
  try {
    const r = window.localStorage.getItem(key);
    return r !== null ? JSON.parse(r) : fallback;
  } catch { return fallback; }
}
async function saveJSON(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

/* ---------- Season Ring (signature visual) ---------- */
function arcPath(cx, cy, r, startAngle, sweep) {
  const rad = (a) => (a * Math.PI) / 180;
  const p1 = { x: cx + r * Math.cos(rad(startAngle)), y: cy + r * Math.sin(rad(startAngle)) };
  const p2 = { x: cx + r * Math.cos(rad(startAngle + sweep)), y: cy + r * Math.sin(rad(startAngle + sweep)) };
  const large = sweep > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
}

/* Assign each task arc to a "lane" (concentric radius) so overlapping windows
   don't draw on top of each other. Intervals are in degrees and may wrap 360. */
function assignLanes(items, padding = 6) {
  const segs = (iv) => {
    const s = ((iv.start % 360) + 360) % 360;
    const e = s + (iv.end - iv.start);
    return e <= 360 ? [[s, e]] : [[s, 360], [0, e - 360]];
  };
  const overlaps = (a, b) => segs(a).some(([s1, e1]) => segs(b).some(([s2, e2]) => s1 < e2 && s2 < e1));
  const lanes = [];
  [...items].sort((a, b) => a.startAngle - b.startAngle).forEach((item) => {
    const iv = { start: item.startAngle, end: item.startAngle + item.sweep + padding };
    let lane = lanes.findIndex((l) => l.every((o) => !overlaps(iv, o)));
    if (lane === -1) { lanes.push([]); lane = lanes.length - 1; }
    lanes[lane].push(iv);
    item.lane = lane;
  });
  return items;
}

function SeasonRing({ tasks, size = 260 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.34;
  const rTicks = size * 0.42;
  const rLabels = size * 0.47;
  const circumference = 2 * Math.PI * r;
  const quarter = circumference / 4;
  const seasonArcs = [
    { color: "#7A93B0" }, // winter Dec-Feb (drawn starting at Dec)
    { color: "#8FA876" }, // spring Mar-May
    { color: "#D9A441" }, // summer Jun-Aug
    { color: "#C1552E" }, // autumn Sep-Nov
  ];
  const today = new Date();
  const todayAngle = angleForMonthDay(today.getMonth() + 1, today.getDate());
  const todayPt = { x: cx + rTicks * Math.cos(todayAngle * Math.PI / 180), y: cy + rTicks * Math.sin(todayAngle * Math.PI / 180) };

  const taskArcs = assignLanes(tasks.map((t) => {
    const startAngle = angleForMonthDay(t.startMonth, t.startDay);
    let sweep = angleForMonthDay(t.endMonth, t.endDay) - startAngle;
    if (sweep <= 0) sweep += 360;
    return { t, startAngle, sweep };
  }));
  const rLane = (lane) => size * (0.295 - lane * 0.033);

  return (
    <svg width={size} height={size} className="mx-auto block">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3A4830" strokeWidth={10} opacity={0.4} />
      <g transform={`rotate(-120 ${cx} ${cy})`}>
        {seasonArcs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={10}
            strokeDasharray={`${quarter * 0.94} ${circumference}`}
            strokeDashoffset={-i * quarter}
            opacity={0.55} strokeLinecap="round" />
        ))}
      </g>
      {MONTH_LETTERS.map((m, i) => {
        const ang = (i / 12) * 360 - 90;
        const tp = { x: cx + rTicks * Math.cos(ang * Math.PI / 180), y: cy + rTicks * Math.sin(ang * Math.PI / 180) };
        const lp = { x: cx + rLabels * Math.cos(ang * Math.PI / 180), y: cy + rLabels * Math.sin(ang * Math.PI / 180) };
        return (
          <g key={i}>
            <line x1={cx + (rTicks - 4) * Math.cos(ang * Math.PI / 180)} y1={cy + (rTicks - 4) * Math.sin(ang * Math.PI / 180)} x2={tp.x} y2={tp.y} stroke="#A9B29C" strokeWidth={1} opacity={0.4} />
            <text x={lp.x} y={lp.y} fontSize={10} fill="#A9B29C" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" opacity={0.7}>{m}</text>
          </g>
        );
      })}
      <line x1={cx} y1={cy} x2={todayPt.x} y2={todayPt.y} stroke="#D9A441" strokeWidth={1.5} opacity={0.9} />
      <circle cx={todayPt.x} cy={todayPt.y} r={4} fill="#D9A441" />
      {taskArcs.map(({ t, startAngle, sweep, lane }) => {
        const meta = CATS[t.category] || CATS.other;
        const rr = rLane(lane);
        const startPt = { x: cx + rr * Math.cos(startAngle * Math.PI / 180), y: cy + rr * Math.sin(startAngle * Math.PI / 180) };
        return (
          <g key={t.id}>
            <path d={arcPath(cx, cy, rr, startAngle, sweep)} fill="none" stroke={meta.color}
              strokeWidth={4} strokeLinecap="round" opacity={0.85}>
              <title>{`${t.title} — ${fmtWindow(windowStatus(t))}`}</title>
            </path>
            <circle cx={startPt.x} cy={startPt.y} r={3} fill={meta.color} stroke="#1F2A1C" strokeWidth={1} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={2} fill="#EDE6D6" />
    </svg>
  );
}

/* ---------- small UI atoms ---------- */
function Badge({ category }) {
  const meta = CATS[category] || CATS.other;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: meta.color + "22", color: meta.color, fontFamily: "IBM Plex Mono, monospace" }}>
      <Icon size={11} /> {meta.label}
    </span>
  );
}

function ConfirmButton({ onConfirm, label = "", icon: Icon = Trash2 }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (armed) { const t = setTimeout(() => setArmed(false), 2500); return () => clearTimeout(t); } }, [armed]);
  return armed ? (
    <button onClick={onConfirm} className="text-[11px] px-2 py-1 rounded" style={{ background: "#B4483A", color: "#EDE6D6" }}>
      Remove?
    </button>
  ) : (
    <button onClick={() => setArmed(true)} className="p-1 rounded hover:bg-white/10 transition" style={{ color: "#A9B29C" }}>
      <Icon size={14} />
    </button>
  );
}

/* ---------- main app ---------- */
export default function BonsaiAlmanac() {
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState([]);
  const [completions, setCompletions] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [showAddSpecies, setShowAddSpecies] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [exportPayload, setExportPayload] = useState(null); // { title, text }

  useEffect(() => {
    (async () => {
      let sp = await loadJSON("bonsai-species", null);
      if (!sp) sp = SEED_SPECIES;
      // migrate any legacy single-date tasks to windows
      sp = sp.map((s) => ({ ...s, tasks: (s.tasks || []).map(normalizeTask) }));
      await saveJSON("bonsai-species", sp);
      const co = await loadJSON("bonsai-completions", {});
      setSpecies(sp);
      setCompletions(co);
      setActiveId(sp[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const persistSpecies = async (next) => { setSpecies(next); await saveJSON("bonsai-species", next); };
  const persistCompletions = async (next) => { setCompletions(next); await saveJSON("bonsai-completions", next); };

  const year = new Date().getFullYear();
  const toggleDone = (speciesId, taskId) => {
    const key = `${speciesId}:${taskId}:${year}`;
    const next = { ...completions, [key]: !completions[key] };
    persistCompletions(next);
  };

  const allUpcoming = useMemo(() => {
    const rows = [];
    species.forEach((s) => s.tasks.forEach((t) => {
      const st = windowStatus(t);
      rows.push({ speciesId: s.id, speciesName: s.name, task: t, ...st, done: !!completions[`${s.id}:${t.id}:${year}`] });
    }));
    // open windows first (closing soonest at the top), then upcoming by start date
    return rows.sort((a, b) => {
      if (a.open !== b.open) return a.open ? -1 : 1;
      return a.open ? a.end - b.end : a.start - b.start;
    }).slice(0, 10);
  }, [species, completions, year]);

  const active = species.find((s) => s.id === activeId) || null;
  const activeTasks = active ? [...active.tasks].sort((a, b) => (a.startMonth - b.startMonth) || (a.startDay - b.startDay)) : [];

  const removeSpecies = (id) => {
    const next = species.filter((s) => s.id !== id);
    persistSpecies(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  };
  const removeTask = (speciesId, taskId) => {
    const next = species.map((s) => s.id === speciesId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s);
    persistSpecies(next);
  };
  const addTask = (speciesId, task) => {
    const next = species.map((s) => s.id === speciesId ? { ...s, tasks: [...s.tasks, { ...normalizeTask(task), id: `t${Date.now()}` }] } : s);
    persistSpecies(next);
  };
  const addSpeciesBatch = (list) => {
    let firstId = null;
    const additions = list.map((sp, si) => {
      const id = `${(sp.name || "species").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${si}`;
      if (!firstId) firstId = id;
      const tasks = (sp.tasks || []).map((t, ti) => {
        const nt = normalizeTask(t);
        return {
          id: `t${Date.now()}${si}${ti}`,
          title: nt.title,
          startMonth: nt.startMonth, startDay: nt.startDay,
          endMonth: nt.endMonth, endDay: nt.endDay,
          category: CATS[nt.category] ? nt.category : "other",
          description: nt.description || "",
        };
      });
      return { id, name: sp.name || "Untitled", botanicalName: sp.botanicalName || "", tasks };
    });
    const next = [...species, ...additions];
    persistSpecies(next);
    if (firstId) setActiveId(firstId);
  };

  if (loading) {
    return (
      <div style={{ background: "#1F2A1C" }} className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" color="#A9B29C" size={28} />
      </div>
    );
  }

  return (
    <div style={{ background: "#1F2A1C", fontFamily: "IBM Plex Sans, sans-serif", color: "#EDE6D6", minHeight: "100vh" }} className="pb-16">
      {/* header */}
      <div className="px-5 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(237,230,214,0.1)" }}>
        <h1 className="font-display text-[26px] leading-tight" style={{ color: "#EDE6D6" }}>Bench Almanac</h1>
        <p className="text-[13px] mt-1" style={{ color: "#A9B29C" }}>Care windows for your bonsai, tuned to Norway's seasons.</p>
      </div>

      {/* dashboard */}
      <div className="px-5 pt-5">
        <h2 className="text-[12px] tracking-wide uppercase mb-2" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>On the bench</h2>
        {allUpcoming.length === 0 ? (
          <p className="text-sm py-4" style={{ color: "#A9B29C" }}>Nothing scheduled yet — add a species below to start tracking it.</p>
        ) : (
          <div className="space-y-1.5">
            {allUpcoming.map((row, i) => {
              const meta = CATS[row.task.category] || CATS.other;
              const soon = row.open || (row.start - new Date()) / 86400000 <= 14;
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "#26331F" }}>
                  <button onClick={() => toggleDone(row.speciesId, row.task.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition"
                    style={{ border: `1.5px solid ${row.done ? meta.color : "#4A5540"}`, background: row.done ? meta.color : "transparent" }}>
                    {row.done && <Check size={12} color="#1F2A1C" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ opacity: row.done ? 0.5 : 1, textDecoration: row.done ? "line-through" : "none" }}>{row.task.title}</div>
                    <div className="text-[11px]" style={{ color: "#8A9483" }}>{row.speciesName} · {seasonLabel(row.start.getMonth() + 1)}</div>
                  </div>
                  <div className="text-right shrink-0" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                    {row.open ? (
                      <>
                        <div className="text-[12px]" style={{ color: "#8FA876" }}>Open now</div>
                        <div className="text-[11px]" style={{ color: "#A9B29C" }}>until {fmtDate(row.end)}</div>
                      </>
                    ) : (
                      <div className="text-[12px]" style={{ color: soon ? "#D9A441" : "#A9B29C" }}>
                        {daysUntilText(row.start)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* species tabs */}
      <div className="px-5 pt-7">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] tracking-wide uppercase" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>Species</h2>
          {species.length > 0 && (
            <button onClick={() => setExportPayload({ title: "Export whole collection", text: JSON.stringify(species.map(toExportObject), null, 2) })}
              className="flex items-center gap-1 text-[11px]" style={{ color: "#A9B29C" }}>
              <Share2 size={12} /> Export all
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {species.map((s) => (
            <button key={s.id} onClick={() => setActiveId(s.id)}
              className="shrink-0 px-3 py-2 rounded-xl text-left transition"
              style={{ background: activeId === s.id ? "#EDE6D6" : "#26331F", color: activeId === s.id ? "#1F2A1C" : "#EDE6D6", minWidth: 130 }}>
              <div className="text-[13px] font-medium leading-tight">{s.name}</div>
              <div className="text-[11px] italic" style={{ opacity: 0.65, fontFamily: "Fraunces, serif" }}>{s.botanicalName}</div>
            </button>
          ))}
          <button onClick={() => setShowAddSpecies(true)}
            className="shrink-0 px-3 py-2 rounded-xl flex items-center gap-1 text-[13px]" style={{ background: "transparent", border: "1px dashed #4A5540", color: "#A9B29C", minWidth: 100 }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* active species detail */}
      {active && (
        <div className="px-5 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-[20px]">{active.name}</h3>
              <p className="text-[12px] italic" style={{ color: "#A9B29C", fontFamily: "Fraunces, serif" }}>{active.botanicalName}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setExportPayload({ title: `Export ${active.name}`, text: JSON.stringify(toExportObject(active), null, 2) })}
                className="p-1 rounded hover:bg-white/10 transition" style={{ color: "#A9B29C" }}>
                <Share2 size={14} />
              </button>
              <ConfirmButton onConfirm={() => removeSpecies(active.id)} />
            </div>
          </div>

          <div className="mt-4"><SeasonRing tasks={active.tasks} /></div>

          <div className="mt-6 space-y-2">
            {activeTasks.map((t) => {
              const done = !!completions[`${active.id}:${t.id}:${year}`];
              const st = windowStatus(t);
              return (
                <div key={t.id} className="rounded-lg px-3 py-2.5" style={{ background: "#26331F" }}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleDone(active.id, t.id)}
                      className="w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition"
                      style={{ border: `1.5px solid ${done ? (CATS[t.category] || CATS.other).color : "#4A5540"}`, background: done ? (CATS[t.category] || CATS.other).color : "transparent" }}>
                      {done && <Check size={12} color="#1F2A1C" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px]" style={{ opacity: done ? 0.5 : 1, textDecoration: done ? "line-through" : "none" }}>{t.title}</span>
                        <Badge category={t.category} />
                      </div>
                      <p className="text-[12px] mt-1 leading-snug" style={{ color: "#A9B29C" }}>{t.description}</p>
                      <p className="text-[11px] mt-1" style={{ color: "#6E7A64", fontFamily: "IBM Plex Mono, monospace" }}>
                        {seasonLabel(t.startMonth)} · {fmtWindow(st)}
                        {st.open && <span style={{ color: "#8FA876" }}> · open now</span>}
                      </p>
                    </div>
                    <ConfirmButton onConfirm={() => removeTask(active.id, t.id)} />
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => setShowAddTask(true)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px]" style={{ border: "1px dashed #4A5540", color: "#A9B29C" }}>
            <Plus size={14} /> Add a care task
          </button>
        </div>
      )}

      {showAddTask && active && (
        <AddTaskModal onClose={() => setShowAddTask(false)} onAdd={(task) => { addTask(active.id, task); setShowAddTask(false); }} />
      )}
      {showAddSpecies && (
        <AddSpeciesModal onClose={() => setShowAddSpecies(false)} onAdd={(list) => { addSpeciesBatch(list); setShowAddSpecies(false); }} />
      )}
      {exportPayload && (
        <ExportModal title={exportPayload.title} text={exportPayload.text} onClose={() => setExportPayload(null)} />
      )}
    </div>
  );
}

/* ---------- modals ---------- */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: "#26331F", color: "#EDE6D6" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[18px]">{title}</h3>
          <button onClick={onClose} style={{ color: "#A9B29C" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = { background: "#1F2A1C", border: "1px solid #3A4830", color: "#EDE6D6" };

function MonthDayRow({ label, month, day, onMonth, onDay }) {
  return (
    <div>
      <label className="text-[11px] block mb-1" style={{ color: "#A9B29C" }}>{label}</label>
      <div className="flex gap-2">
        <select value={month} onChange={(e) => onMonth(+e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={inputStyle}>
          {MONTH_LETTERS.map((_, i) => <option key={i} value={i + 1}>{new Date(2000, i, 1).toLocaleString(undefined, { month: "long" })}</option>)}
        </select>
        <input type="number" min={1} max={31} value={day} onChange={(e) => onDay(+e.target.value)} className="w-20 px-3 py-2 rounded-lg text-sm" style={inputStyle} />
      </div>
    </div>
  );
}

function AddTaskModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [startMonth, setStartMonth] = useState(5);
  const [startDay, setStartDay] = useState(1);
  const [endMonth, setEndMonth] = useState(5);
  const [endDay, setEndDay] = useState(15);
  const [endTouched, setEndTouched] = useState(false);
  const [description, setDescription] = useState("");

  // until the user edits the end date, keep it at the category's typical span
  useEffect(() => {
    if (endTouched) return;
    const end = dateFor(REF_YEAR, startMonth, startDay);
    end.setDate(end.getDate() + defaultSpanDays(category));
    setEndMonth(end.getMonth() + 1);
    setEndDay(end.getDate());
  }, [startMonth, startDay, category, endTouched]);

  return (
    <ModalShell title="Add a care task" onClose={onClose}>
      <div className="space-y-3">
        <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
          {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <MonthDayRow label="Window opens" month={startMonth} day={startDay} onMonth={setStartMonth} onDay={setStartDay} />
        <MonthDayRow label="Window closes" month={endMonth} day={endDay}
          onMonth={(v) => { setEndTouched(true); setEndMonth(v); }}
          onDay={(v) => { setEndTouched(true); setEndDay(v); }} />
        <textarea placeholder="Notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />
        <button disabled={!title.trim()} onClick={() => onAdd({ title: title.trim(), startMonth, startDay, endMonth, endDay, category, description: description.trim() })}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: "#D9A441", color: "#1F2A1C" }}>
          Add task
        </button>
      </div>
    </ModalShell>
  );
}

function ExportModal({ title, text, onClose }) {
  const [status, setStatus] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setStatus("Copied ✓"); }
    catch { setStatus("Tap the text above and copy it manually"); }
    setTimeout(() => setStatus(""), 2500);
  };
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="text-[12px] mb-2" style={{ color: "#A9B29C" }}>
        Send this to someone else — they paste it into "Add species" → the import box to bring it into their own almanac. Nothing here is linked back to your data.
      </p>
      <textarea readOnly value={text} rows={10} onFocus={(e) => e.target.select()}
        className="w-full px-3 py-2 rounded-lg text-[11px] font-mono resize-none" style={inputStyle} />
      <button onClick={copy} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium" style={{ background: "#D9A441", color: "#1F2A1C" }}>
        <Copy size={14} /> {status || "Copy to clipboard"}
      </button>
    </ModalShell>
  );
}

function AddSpeciesModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [botanicalName, setBotanicalName] = useState("");
  const [importText, setImportText] = useState("");
  const [error, setError] = useState("");
  const [showFormat, setShowFormat] = useState(false);

  const submit = () => {
    setError("");
    if (!importText.trim()) {
      if (!name.trim()) return;
      onAdd([{ name: name.trim(), botanicalName: botanicalName.trim(), tasks: [] }]);
      return;
    }
    let parsed;
    try { parsed = JSON.parse(importText); }
    catch { setError("That doesn't look like valid JSON — check the format and try again."); return; }

    if (Array.isArray(parsed) && parsed.length && parsed[0] && typeof parsed[0] === "object" && "tasks" in parsed[0]) {
      // a whole exported collection: [{name, botanicalName, tasks}, ...]
      onAdd(parsed.map((sp) => ({ name: sp.name || "Untitled", botanicalName: sp.botanicalName || "", tasks: sp.tasks || [] })));
    } else if (Array.isArray(parsed)) {
      // a bare task list — needs the typed name
      if (!name.trim()) { setError("Add a common name above first, then paste a bare task list."); return; }
      onAdd([{ name: name.trim(), botanicalName: botanicalName.trim(), tasks: parsed }]);
    } else if (parsed && typeof parsed === "object" && "tasks" in parsed) {
      // a single exported species
      onAdd([{ name: parsed.name || name.trim() || "Untitled", botanicalName: parsed.botanicalName || botanicalName.trim(), tasks: parsed.tasks || [] }]);
    } else {
      setError("Unrecognized format — paste a task list, or an exported species/collection.");
    }
  };

  return (
    <ModalShell title="Add a species" onClose={onClose}>
      <div className="space-y-3">
        <input placeholder="Common name (e.g. Japanese Maple)" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <input placeholder="Botanical name (e.g. Acer palmatum)" value={botanicalName} onChange={(e) => setBotanicalName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] flex items-center gap-1" style={{ color: "#A9B29C" }}><Upload size={11} /> Paste to import (optional)</label>
            <button onClick={() => setShowFormat(true)} className="text-[11px] flex items-center gap-1" style={{ color: "#D9A441" }}>
              <BookOpen size={11} /> Format guide
            </button>
          </div>
          <textarea placeholder={'A task list, a single exported species, or a whole exported collection'} value={importText}
            onChange={(e) => { setImportText(e.target.value); setError(""); }} rows={4}
            className="w-full px-3 py-2 rounded-lg text-[12px] font-mono resize-none" style={inputStyle} />
          <p className="text-[11px] mt-1" style={{ color: "#6E7A64" }}>Paste something someone shared via "Export" — or ask Claude to research a species (e.g. from bonsai4me) and hand you ready-to-paste task data.</p>
          {error && <p className="text-[11px] mt-1" style={{ color: "#D97757" }}>{error}</p>}
        </div>
        <button disabled={!name.trim() && !importText.trim()} onClick={submit}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: "#D9A441", color: "#1F2A1C" }}>
          Add species
        </button>
      </div>
      {showFormat && <FormatGuide onClose={() => setShowFormat(false)} />}
    </ModalShell>
  );
}
