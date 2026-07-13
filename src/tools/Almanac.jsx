import React, { useMemo, useState } from "react";
import { Check, Sprout } from "lucide-react";
import { CATS } from "../lib/categories.js";
import { seasonLabel, windowStatus, fmtDate, fmtWindow, daysUntilText, sortTasksByStart } from "../lib/dates.js";
import { Badge, EmptyBench } from "../components/ui.jsx";
import SpeciesPicker from "../components/SpeciesPicker.jsx";
import TaskDetailModal from "../components/TaskDetailModal.jsx";

/* The bench dashboard: every upcoming care window across the collection, plus
   one species' full care plan with check-offs. Read-only over species data —
   adding and editing happens in the Collection tool. */
const OPEN_CAP = 8;
const UPCOMING_CAP = 5;

export default function Almanac({ data, actions, activeId, onSelectSpecies }) {
  const { species, completions, specimensBySpecies, year } = data;
  const [taskDetail, setTaskDetail] = useState(null); // { speciesId, task }
  const [showAllBench, setShowAllBench] = useState(false);

  const treeNames = (speciesId) => (specimensBySpecies[speciesId] || []).map((x) => x.nickname).join(", ");

  const bench = useMemo(() => {
    const rows = [];
    species.forEach((s) => s.tasks.forEach((t) => {
      const st = windowStatus(t);
      rows.push({ speciesId: s.id, speciesName: s.name, task: t, ...st, done: !!completions[`${s.id}:${t.id}:${year}`] });
    }));
    return {
      open: rows.filter((r) => r.open).sort((a, b) => a.end - b.end),          // closing soonest first
      upcoming: rows.filter((r) => !r.open).sort((a, b) => a.start - b.start),
    };
  }, [species, completions, year]);

  const benchGroups = [
    { label: "Open now", rows: showAllBench ? bench.open : bench.open.slice(0, OPEN_CAP) },
    { label: "Coming up", rows: showAllBench ? bench.upcoming : bench.upcoming.slice(0, UPCOMING_CAP) },
  ].filter((g) => g.rows.length > 0);
  const benchTotal = bench.open.length + bench.upcoming.length;
  const benchCollapsedCount = Math.min(bench.open.length, OPEN_CAP) + Math.min(bench.upcoming.length, UPCOMING_CAP);

  // a stale id (species deleted in the Collection) falls back to the first
  const active = species.find((s) => s.id === activeId) ?? species[0] ?? null;
  const detailSpecies = taskDetail ? species.find((s) => s.id === taskDetail.speciesId) : null;
  const activeTasks = active ? sortTasksByStart(active.tasks) : [];
  const activeTrees = active ? treeNames(active.id) : "";

  return (
    <>
      {/* dashboard */}
      <div className="px-5 pt-5">
        <h2 className="text-[12px] tracking-wide uppercase mb-2" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>On the bench</h2>
        {benchTotal === 0 ? (
          <p className="text-sm py-4" style={{ color: "#A9B29C" }}>Nothing scheduled yet — add a species in the Collection to start tracking it.</p>
        ) : (
          <>
            {benchGroups.map((g) => (
              <div key={g.label} className="mb-3">
                <h3 className="text-[11px] tracking-wide uppercase mb-1.5" style={{ color: g.label === "Open now" ? "#8FA876" : "#8A9483", fontFamily: "IBM Plex Mono, monospace" }}>{g.label}</h3>
                <div className="space-y-1.5">
                  {g.rows.map((row) => {
                    const meta = CATS[row.task.category] || CATS.other;
                    // amber when the window closes (or opens) soon
                    const urgent = row.open
                      ? (row.end - new Date()) / 86400000 <= 7
                      : (row.start - new Date()) / 86400000 <= 14;
                    const trees = treeNames(row.speciesId);
                    return (
                      <div key={`${row.speciesId}:${row.task.id}`} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "#26331F" }}>
                        <button onClick={() => actions.toggleDone(row.speciesId, row.task.id)}
                          aria-label={`${row.done ? "Mark incomplete" : "Mark complete"}: ${row.task.title}`}
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition"
                          style={{ border: `1.5px solid ${meta.color}`, background: row.done ? meta.color : "transparent" }}>
                          {row.done && <Check size={12} color="#1F2A1C" aria-hidden="true" />}
                        </button>
                        <button onClick={() => setTaskDetail({ speciesId: row.speciesId, task: row.task })}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left">
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] truncate" style={{ opacity: row.done ? 0.5 : 1, textDecoration: row.done ? "line-through" : "none" }}>{row.task.title}</div>
                            <div className="text-[11px] truncate" style={{ color: "#8A9483" }}>
                              {row.speciesName}{trees ? ` · ${trees}` : ""} · {seasonLabel(row.start.getMonth() + 1)}
                            </div>
                          </div>
                          <div className="text-right shrink-0 text-[12px]" style={{ fontFamily: "IBM Plex Mono, monospace", color: urgent ? "#D9A441" : "#A9B29C" }}>
                            {row.open ? `until ${fmtDate(row.end)}` : daysUntilText(row.start)}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {benchTotal > benchCollapsedCount && (
              <button onClick={() => setShowAllBench(!showAllBench)}
                className="text-[11px]" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>
                {showAllBench ? "Show fewer" : `Show all ${benchTotal}`}
              </button>
            )}
          </>
        )}
      </div>

      {/* species picker (single-select) */}
      {species.length > 0 && (
        <div className="px-5 pt-7">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[12px] tracking-wide uppercase" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>Species</h2>
            <button onClick={() => actions.navigate("/collection")}
              className="flex items-center gap-1 text-[11px]" style={{ color: "#A9B29C" }}>
              <Sprout size={12} /> Manage collection
            </button>
          </div>
          <SpeciesPicker species={species} mode="single"
            selectedIds={active ? [active.id] : []}
            onPick={onSelectSpecies}
            hint="Pick a species to see its full care plan for the year." />
        </div>
      )}

      {species.length === 0 && (
        <EmptyBench ctaLabel="Open the Collection" ctaIcon={Sprout} onCta={() => actions.navigate("/collection")} />
      )}

      {/* active species care plan */}
      {active && (
        <div className="px-5 pt-6">
          <div>
            <h3 className="font-display text-[20px]">{active.name}</h3>
            <p className="text-[12px] italic" style={{ color: "#A9B29C", fontFamily: "Fraunces, serif" }}>{active.botanicalName}</p>
            {activeTrees && (
              <p className="text-[11px] mt-1" style={{ color: "#8A9483" }}>Your trees: {activeTrees}</p>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {activeTasks.map((t) => {
              const done = !!completions[`${active.id}:${t.id}:${year}`];
              const st = windowStatus(t);
              const catColor = (CATS[t.category] || CATS.other).color;
              return (
                <div key={t.id} className="rounded-lg px-3 py-2.5"
                  style={{ background: "#26331F", boxShadow: st.open ? "inset 2px 0 0 0 #8FA876" : "none" }}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => actions.toggleDone(active.id, t.id)}
                      aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${t.title}`}
                      className="w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition"
                      style={{ border: `1.5px solid ${catColor}`, background: done ? catColor : "transparent" }}>
                      {done && <Check size={12} color="#1F2A1C" aria-hidden="true" />}
                    </button>
                    <button onClick={() => setTaskDetail({ speciesId: active.id, task: t })}
                      className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px]" style={{ opacity: done ? 0.5 : 1, textDecoration: done ? "line-through" : "none" }}>{t.title}</span>
                        <Badge category={t.category} />
                      </div>
                      {/* clamped — the detail modal has the full text */}
                      <p className="text-[12px] mt-1 leading-snug"
                        style={{ color: "#A9B29C", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.description}</p>
                      <p className="text-[11px] mt-1" style={{ color: "#6E7A64", fontFamily: "IBM Plex Mono, monospace" }}>
                        {seasonLabel(t.startMonth)} · {fmtWindow(st)}
                        {st.open && <span style={{ color: "#8FA876" }}> · open now</span>}
                      </p>
                    </button>
                  </div>
                </div>
              );
            })}
            {activeTasks.length === 0 && (
              <p className="text-sm" style={{ color: "#A9B29C" }}>No care tasks yet — add some in the Collection.</p>
            )}
          </div>
        </div>
      )}

      {taskDetail && detailSpecies && (
        <TaskDetailModal task={taskDetail.task}
          speciesName={detailSpecies.name}
          trees={treeNames(taskDetail.speciesId)}
          year={year}
          done={!!completions[`${taskDetail.speciesId}:${taskDetail.task.id}:${year}`]}
          onToggleDone={() => actions.toggleDone(taskDetail.speciesId, taskDetail.task.id)}
          onClose={() => setTaskDetail(null)} />
      )}
    </>
  );
}
