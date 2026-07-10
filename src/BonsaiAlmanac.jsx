import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw, Droplet, Scissors, Link2, Sprout, Bug, Leaf,
  Plus, X, Check, Trash2, Upload, CalendarDays, Loader2,
  Share2, Copy, BookOpen
} from "lucide-react";
import FormatGuide from "./FormatGuide.jsx";

/* ---------- theme tokens ---------- */
const CATS = {
  repot:     { label: "Repot",      color: "#C97A3D", icon: RotateCcw },
  feed:      { label: "Feed",       color: "#8FA876", icon: Droplet },
  prune:     { label: "Prune",      color: "#D9A441", icon: Scissors },
  wire:      { label: "Wire",       color: "#C1552E", icon: Link2 },
  propagate: { label: "Propagate",  color: "#5B8C7B", icon: Sprout },
  seed:      { label: "Seed",       color: "#B08968", icon: Leaf },
  pest:      { label: "Pest watch", color: "#B4483A", icon: Bug },
  other:     { label: "General",    color: "#8A9086", icon: CalendarDays },
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_LETTERS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

function seasonLabel(month) {
  return ({
    1: "Late winter", 2: "Late winter", 3: "Early spring", 4: "Early spring",
    5: "Spring", 6: "Early summer", 7: "Midsummer", 8: "Late summer",
    9: "Autumn", 10: "Autumn", 11: "Early winter", 12: "Winter",
  })[month];
}

function angleForMonthDay(month, day) {
  const dim = DAYS_IN_MONTH[month - 1];
  const frac = (month - 1) / 12 + ((day - 1) / Math.max(dim, 1)) / 12;
  return frac * 360 - 90;
}

function nextOccurrence(month, day, from = new Date()) {
  const y = from.getFullYear();
  let candidate = new Date(y, month - 1, Math.min(day, DAYS_IN_MONTH[month - 1]));
  candidate.setHours(0, 0, 0, 0);
  const today = new Date(from); today.setHours(0, 0, 0, 0);
  if (candidate < today) candidate = new Date(y + 1, month - 1, Math.min(day, DAYS_IN_MONTH[month - 1]));
  return candidate;
}

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
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
  id: "beech-fagus-sylvatica",
  name: "European Beech",
  botanicalName: "Fagus sylvatica",
  tasks: [
    { id: "t1", title: "Repot (every 2 years)", month: 5, day: 1, category: "repot", description: "Repot in a basic soil mix as buds swell. Norwegian springs run 3–4 weeks behind the UK, so go by bud movement, not the date." },
    { id: "t2", title: "Start feeding — trees still developing", month: 5, day: 10, category: "feed", description: "If trunk or branch structure is still being built, feed as soon as leaves unfurl." },
    { id: "t3", title: "Begin fortnightly feeding — refined trees", month: 6, day: 5, category: "feed", description: "Refined trees get a 3–4 week feeding hold after leaf-out to keep spring growth fine. Start fortnightly feeding now." },
    { id: "t4", title: "Prune to bud", month: 6, day: 15, category: "prune", description: "Once spring growth has fully extended, cut back to a bud facing the direction you want new growth to take." },
    { id: "t5", title: "Wiring — check often", month: 6, day: 16, category: "wire", description: "Branches thicken fast now. Beech bark is smooth and scars easily, so inspect wire every few days." },
    { id: "t6", title: "Air-layering window", month: 7, day: 5, category: "propagate", description: "Take air-layers once this year's spring growth has hardened off." },
    { id: "t7", title: "Optional hard pruning", month: 7, day: 6, category: "prune", description: "Midsummer is an alternative to late-winter hard pruning — wounds heal fastest now, so it's also the best time to remove large branches." },
    { id: "t8", title: "Pest & disease check", month: 7, day: 20, category: "pest", description: "Watch for aphids, whitefly, bark scale and powdery mildew through the growing season." },
    { id: "t9", title: "Final feed of the season", month: 8, day: 20, category: "feed", description: "Stop feeding around now so growth can harden off before autumn." },
    { id: "t10", title: "Autumn colour & seed sowing", month: 9, day: 25, category: "seed", description: "Foliage turns yellow to orange-brown and often stays on through winter. Sow fresh beechmast outdoors now for natural stratification." },
    { id: "t11", title: "Start winter seed stratification", month: 11, day: 15, category: "seed", description: "If seed wasn't sown outdoors in autumn, begin cold-stratifying it indoors for a spring sowing." },
    { id: "t12", title: "Late-winter hard pruning window", month: 2, day: 15, category: "prune", description: "The alternative to midsummer hard pruning — do this before spring growth resumes." },
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
function SeasonRing({ tasks, size = 260 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.34;
  const rDots = size * 0.34;
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
      {tasks.map((t) => {
        const ang = angleForMonthDay(t.month, t.day);
        const p = { x: cx + rDots * Math.cos(ang * Math.PI / 180), y: cy + rDots * Math.sin(ang * Math.PI / 180) };
        const meta = CATS[t.category] || CATS.other;
        return (
          <circle key={t.id} cx={p.x} cy={p.y} r={5.5} fill={meta.color} stroke="#1F2A1C" strokeWidth={1.5}>
            <title>{`${t.title} — ${fmtDate(nextOccurrence(t.month, t.day))}`}</title>
          </circle>
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
      if (!sp) { sp = SEED_SPECIES; await saveJSON("bonsai-species", sp); }
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
      const d = nextOccurrence(t.month, t.day);
      rows.push({ speciesId: s.id, speciesName: s.name, task: t, date: d, done: !!completions[`${s.id}:${t.id}:${year}`] });
    }));
    return rows.sort((a, b) => a.date - b.date).slice(0, 10);
  }, [species, completions, year]);

  const active = species.find((s) => s.id === activeId) || null;
  const activeTasks = active ? [...active.tasks].sort((a, b) => (a.month - b.month) || (a.day - b.day)) : [];

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
    const next = species.map((s) => s.id === speciesId ? { ...s, tasks: [...s.tasks, { ...task, id: `t${Date.now()}` }] } : s);
    persistSpecies(next);
  };
  const addSpeciesBatch = (list) => {
    let firstId = null;
    const additions = list.map((sp, si) => {
      const id = `${(sp.name || "species").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${si}`;
      if (!firstId) firstId = id;
      const tasks = (sp.tasks || []).map((t, ti) => ({
        id: `t${Date.now()}${si}${ti}`,
        title: t.title, month: t.month, day: t.day,
        category: CATS[t.category] ? t.category : "other",
        description: t.description || "",
      }));
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
              const soon = (row.date - new Date()) / 86400000 <= 14;
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "#26331F" }}>
                  <button onClick={() => toggleDone(row.speciesId, row.task.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition"
                    style={{ border: `1.5px solid ${row.done ? meta.color : "#4A5540"}`, background: row.done ? meta.color : "transparent" }}>
                    {row.done && <Check size={12} color="#1F2A1C" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ opacity: row.done ? 0.5 : 1, textDecoration: row.done ? "line-through" : "none" }}>{row.task.title}</div>
                    <div className="text-[11px]" style={{ color: "#8A9483" }}>{row.speciesName} · {seasonLabel(row.date.getMonth() + 1)}</div>
                  </div>
                  <div className="text-[12px] text-right shrink-0" style={{ color: soon ? "#D9A441" : "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>
                    {daysUntilText(row.date)}
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
              const d = nextOccurrence(t.month, t.day);
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
                      <p className="text-[11px] mt-1" style={{ color: "#6E7A64", fontFamily: "IBM Plex Mono, monospace" }}>{seasonLabel(t.month)} · next {fmtDate(d)}</p>
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

function AddTaskModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(1);
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");

  return (
    <ModalShell title="Add a care task" onClose={onClose}>
      <div className="space-y-3">
        <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(+e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={inputStyle}>
            {MONTH_LETTERS.map((_, i) => <option key={i} value={i + 1}>{new Date(2000, i, 1).toLocaleString(undefined, { month: "long" })}</option>)}
          </select>
          <input type="number" min={1} max={31} value={day} onChange={(e) => setDay(+e.target.value)} className="w-20 px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
          {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <textarea placeholder="Notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />
        <button disabled={!title.trim()} onClick={() => onAdd({ title: title.trim(), month, day, category, description: description.trim() })}
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
