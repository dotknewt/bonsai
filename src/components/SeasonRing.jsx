import React, { useState, useEffect } from "react";
import { CATS } from "../lib/categories.js";
import { MONTH_LETTERS, angleForMonthDay, windowStatus, fmtWindow, fmtDate } from "../lib/dates.js";
import { arcPath, packLanes } from "../lib/ringGeometry.js";

/* ---------- Season Ring (signature visual) ---------- */
/* legend glyph: concentric rings with one band highlighted */
function BandGlyph({ index, count }) {
  const s = 14, c = s / 2;
  const radii = Array.from({ length: count }, (_, i) => 5.5 - (i * 3.5) / Math.max(count - 1, 1));
  return (
    <svg width={s} height={s} aria-hidden="true" className="shrink-0">
      {radii.map((rr, i) => (
        <circle key={i} cx={c} cy={c} r={rr} fill="none"
          stroke={i === index ? "#EDE6D6" : "#4A5540"} strokeWidth={i === index ? 1.6 : 1} />
      ))}
    </svg>
  );
}

/* overlays: [{ a1, sweep, label }] — bright arcs marking overlap ranges.
   speciesOrder: [{ id, name }] — when given (comparison view), each species
   gets its own contiguous band of lanes, outermost band first, so radius alone
   says whose arc it is. Tapping an arc shows its details in the wheel's center. */
export default function SeasonRing({ tasks, overlays = [], size = 260, speciesOrder = null }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const cx = size / 2, cy = size / 2;
  const r = size * 0.34;
  const rTicks = size * 0.42;
  const rLabels = size * 0.47;
  const circumference = 2 * Math.PI * r;
  const quarter = circumference / 4;
  const pt = (rr, ang) => ({ x: cx + rr * Math.cos(ang * Math.PI / 180), y: cy + rr * Math.sin(ang * Math.PI / 180) });
  const seasonArcs = [
    { color: "#7A93B0" }, // winter Dec-Feb (drawn starting at Dec)
    { color: "#8FA876" }, // spring Mar-May
    { color: "#D9A441" }, // summer Jun-Aug
    { color: "#C1552E" }, // autumn Sep-Nov
  ];
  const today = new Date();
  const todayAngle = angleForMonthDay(today.getMonth() + 1, today.getDate());
  const todayPt = pt(rTicks, todayAngle);

  // ids repeat across species (and single-species tasks carry no speciesId),
  // so selection keys are speciesId-qualified
  const keyOf = (t) => `${t.speciesId || ""}:${t.id}`;
  useEffect(() => {
    if (selectedKey && !tasks.some((t) => keyOf(t) === selectedKey)) setSelectedKey(null);
  }, [tasks, selectedKey]);

  const taskArcs = tasks.map((t) => {
    const startAngle = angleForMonthDay(t.startMonth, t.startDay);
    let sweep = angleForMonthDay(t.endMonth, t.endDay) - startAngle;
    if (sweep <= 0) sweep += 360;
    return { t, startAngle, sweep };
  });

  // one contiguous band of lanes per species (selection order, outermost band
  // first), or a single shared band when no species grouping is requested
  const bands = [];
  let totalLanes = 0;
  if (speciesOrder) {
    speciesOrder.forEach((sp) => {
      const group = taskArcs.filter((a) => a.t.speciesId === sp.id);
      if (!group.length) return;
      const n = packLanes(group);
      group.forEach((a) => { a.lane += totalLanes; });
      bands.push({ id: sp.id, name: sp.name, from: totalLanes, to: totalLanes + n - 1 });
      totalLanes += n;
    });
  } else {
    totalLanes = packLanes(taskArcs);
  }
  // shrink lane spacing when bands would push arcs into the center
  const laneStep = Math.min(0.033, totalLanes > 1 ? 0.215 / (totalLanes - 1) : 0.033);
  const rLane = (lane) => size * (0.295 - lane * laneStep);

  const selected = selectedKey ? taskArcs.find((a) => keyOf(a.t) === selectedKey) : null;
  const selectedMeta = selected ? (CATS[selected.t.category] || CATS.other) : null;
  const selectedStatus = selected ? windowStatus(selected.t) : null;

  return (
    <div>
      <svg width={size} height={size} className="mx-auto block" onClick={() => setSelectedKey(null)}>
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
          const tp = pt(rTicks, ang);
          const lp = pt(rLabels, ang);
          const ip = pt(rTicks - 4, ang);
          return (
            <g key={i}>
              <line x1={ip.x} y1={ip.y} x2={tp.x} y2={tp.y} stroke="#A9B29C" strokeWidth={1} opacity={0.4} />
              <text x={lp.x} y={lp.y} fontSize={10} fill="#A9B29C" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" opacity={0.7}>{m}</text>
            </g>
          );
        })}
        <line x1={cx} y1={cy} x2={todayPt.x} y2={todayPt.y} stroke="#D9A441" strokeWidth={1.5} opacity={0.9} />
        <circle cx={todayPt.x} cy={todayPt.y} r={4} fill="#D9A441" />
        {bands.slice(1).map((b, i) => (
          <circle key={`sep-${b.id}`} cx={cx} cy={cy} r={(rLane(bands[i].to) + rLane(b.from)) / 2}
            fill="none" stroke="#3A4830" strokeWidth={0.75} opacity={0.6} />
        ))}
        {taskArcs.map(({ t, startAngle, sweep, lane }) => {
          const meta = CATS[t.category] || CATS.other;
          const rr = rLane(lane);
          const k = keyOf(t);
          const isSel = selectedKey === k;
          const startPt = pt(rr, startAngle);
          const endIn = pt(rr - 4, startAngle + sweep);
          const endOut = pt(rr + 4, startAngle + sweep);
          const label = `${t.speciesName ? `${t.speciesName} — ` : ""}${t.title} — ${fmtWindow(windowStatus(t))}`;
          return (
            <g key={k} opacity={selectedKey && !isSel ? 0.25 : 1}>
              <path d={arcPath(cx, cy, rr, startAngle, sweep)} fill="none" stroke={meta.color}
                strokeWidth={isSel ? 6 : 5} strokeLinecap="round" opacity={isSel ? 1 : 0.85} />
              <line x1={endIn.x} y1={endIn.y} x2={endOut.x} y2={endOut.y} stroke={meta.color} strokeWidth={1.5} opacity={0.9} />
              <circle cx={startPt.x} cy={startPt.y} r={3} fill={meta.color} stroke="#1F2A1C" strokeWidth={1} />
              <path d={arcPath(cx, cy, rr, startAngle, sweep)} fill="none" stroke="transparent" strokeWidth={16}
                role="button" tabIndex={0} aria-label={label} aria-pressed={isSel}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setSelectedKey(isSel ? null : k); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedKey(isSel ? null : k); } }}>
                <title>{label}</title>
              </path>
            </g>
          );
        })}
        {overlays.map((o, i) => (
          <path key={`ov${i}`} d={arcPath(cx, cy, size * 0.385, o.a1, o.sweep)} fill="none"
            stroke="#EDE6D6" strokeWidth={3} strokeLinecap="round" opacity={0.95}>
            <title>{o.label}</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={2} fill="#EDE6D6" />
        {!selected && (
          <text x={cx} y={cy + 15} fontSize={10} fill="#D9A441" textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace"
            stroke="#1F2A1C" strokeWidth={3} paintOrder="stroke" aria-hidden="true">
            {`Today · ${fmtDate(today)}`}
          </text>
        )}
        {selected && (
          <foreignObject x={cx - size * 0.3} y={cy - size * 0.21} width={size * 0.6} height={size * 0.42}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="rounded-xl px-2.5 py-2 text-center"
                style={{ background: "rgba(31,42,28,0.93)", border: "1px solid #3A4830", maxWidth: "100%" }}>
                <div className="text-[12px] font-medium leading-snug"
                  style={{ color: "#EDE6D6", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {selected.t.title}
                </div>
                {selected.t.speciesName && (
                  <div className="text-[10px] italic" style={{ color: "#A9B29C", fontFamily: "Fraunces, serif" }}>{selected.t.speciesName}</div>
                )}
                <div className="text-[10px] mt-0.5" style={{ color: selectedMeta.color, fontFamily: "IBM Plex Mono, monospace" }}>{selectedMeta.label}</div>
                <div className="text-[10px]" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>
                  {fmtWindow(selectedStatus)}
                  {selectedStatus.open && <span style={{ color: "#8FA876" }}> · open</span>}
                </div>
              </div>
            </div>
          </foreignObject>
        )}
      </svg>
      {bands.length > 1 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
          {bands.map((b, i) => (
            <span key={b.id} className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#A9B29C" }}>
              <BandGlyph index={i} count={bands.length} /> {b.name}
            </span>
          ))}
        </div>
      )}
      {tasks.length > 0 && (
        <p className="text-[10px] mt-1 text-center" style={{ color: "#6E7A64" }}>
          {selected ? "Tap the wheel to dismiss" : "Tap an arc to identify it"}
        </p>
      )}
    </div>
  );
}
