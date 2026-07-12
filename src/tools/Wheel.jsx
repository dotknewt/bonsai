import React, { useState, useMemo } from "react";
import { CATS, catOf } from "../lib/categories.js";
import { YEAR_DAYS, doyOf, angleForDoy, fmtDoy, doyInRange, overlapRanges } from "../lib/overlap.js";
import SeasonRing from "../components/SeasonRing.jsx";
import { Badge, CategoryChips } from "../components/ui.jsx";

/* The calendar wheel: one species' year at a glance, or several species
   compared to find the stretches where their care windows coincide. */
export default function Wheel({ data }) {
  const { species } = data;
  const [selectedIds, setSelectedIds] = useState(species[0] ? [species[0].id] : []);
  // task-type filter — lives here (not in the views) so the choice survives
  // selecting/unselecting species
  const [enabledCats, setEnabledCats] = useState([]);

  const toggleSpecies = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleCat = (c) => {
    setEnabledCats((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const selected = species.filter((s) => selectedIds.includes(s.id));
  const active = selected.length === 1 ? selected[0] : null;

  // single-species view: chips filter the calendar; with nothing (relevant)
  // turned on, every task shows
  const activePresentCats = active ? Object.keys(CATS).filter((c) => active.tasks.some((t) => catOf(t) === c)) : [];
  const activeFilterCats = enabledCats.filter((c) => activePresentCats.includes(c));
  const activeVisibleTasks = active
    ? (activeFilterCats.length ? active.tasks.filter((t) => activeFilterCats.includes(catOf(t))) : active.tasks)
    : [];

  return (
    <>
      {/* species tabs (multi-select) */}
      <div className="px-5 pt-5">
        <h2 className="text-[12px] tracking-wide uppercase mb-2" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>Species</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {species.map((s) => {
            const isSel = selectedIds.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggleSpecies(s.id)}
                aria-pressed={isSel}
                className="shrink-0 px-3 py-2 rounded-xl text-left transition"
                style={{ background: isSel ? "#EDE6D6" : "#26331F", color: isSel ? "#1F2A1C" : "#EDE6D6", minWidth: 130 }}>
                <div className="text-[13px] font-medium leading-tight">{s.name}</div>
                <div className="text-[11px] italic" style={{ opacity: 0.65, fontFamily: "Fraunces, serif" }}>{s.botanicalName}</div>
              </button>
            );
          })}
        </div>
        {species.length > 1 && (
          <p className="text-[11px] mt-1" style={{ color: "#6E7A64" }}>
            Tap to select — select several species to see where their care windows overlap.
          </p>
        )}
      </div>

      {species.length === 0 && (
        <p className="px-5 pt-6 text-sm" style={{ color: "#A9B29C" }}>
          Your bench is empty — add a species in the Collection to see its calendar here.
        </p>
      )}

      {selected.length === 0 && species.length > 0 && (
        <p className="px-5 pt-6 text-sm" style={{ color: "#A9B29C" }}>Select a species above to see its calendar.</p>
      )}

      {selected.length > 1 && <OverlapView speciesList={selected} enabledCats={enabledCats} onToggleCat={toggleCat} />}

      {/* single-species wheel */}
      {active && (
        <div className="px-5 pt-6">
          <div>
            <h3 className="font-display text-[20px]">{active.name}</h3>
            <p className="text-[12px] italic" style={{ color: "#A9B29C", fontFamily: "Fraunces, serif" }}>{active.botanicalName}</p>
          </div>

          {activePresentCats.length > 1 && (
            <>
              <CategoryChips cats={activePresentCats} enabled={enabledCats} onToggle={toggleCat} />
              <p className="text-[11px] mt-1" style={{ color: "#6E7A64" }}>
                Tap a task type to filter — with none on, everything shows.
              </p>
            </>
          )}

          <div className="mt-4"><SeasonRing tasks={activeVisibleTasks} /></div>
        </div>
      )}
    </>
  );
}

/* ---------- overlap / comparison view (2+ species selected) ---------- */
function OverlapView({ speciesList, enabledCats, onToggleCat }) {
  const allTasks = useMemo(() => speciesList.flatMap((s) =>
    s.tasks.map((t) => ({ ...t, speciesId: s.id, speciesName: s.name }))
  ), [speciesList]);

  const presentCats = useMemo(
    () => Object.keys(CATS).filter((c) => allTasks.some((t) => catOf(t) === c)),
    [allTasks]
  );

  const visibleTasks = allTasks.filter((t) => enabledCats.includes(catOf(t)));

  const overlapsByCat = useMemo(() => enabledCats
    .map((cat) => ({
      cat,
      ranges: overlapRanges(visibleTasks.filter((t) => catOf(t) === cat)),
    }))
    .filter((x) => x.ranges.length)
    .sort((a, b) => a.ranges[0].start - b.ranges[0].start),
  [enabledCats.join(","), allTasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameOf = (id) => speciesList.find((s) => s.id === id)?.name || id;
  const today = new Date();
  const todayDoy = doyOf(today.getMonth() + 1, today.getDate());

  const overlays = overlapsByCat.flatMap(({ cat, ranges }) => ranges.map((r) => {
    const spanDays = r.end >= r.start ? r.end - r.start + 1 : YEAR_DAYS - r.start + r.end + 1;
    return {
      a1: angleForDoy(r.start),
      sweep: Math.max((spanDays / YEAR_DAYS) * 360, 2),
      label: `${(CATS[cat] || CATS.other).label} overlap: ${fmtDoy(r.start)} – ${fmtDoy(r.end)} — ${r.speciesIds.map(nameOf).join(" + ")}`,
    };
  }));

  return (
    <div className="px-5 pt-6">
      <h3 className="font-display text-[20px]">Where windows overlap</h3>
      <p className="text-[12px] mt-0.5" style={{ color: "#A9B29C" }}>
        {speciesList.map((s) => s.name).join(" · ")}
      </p>

      {/* task-type filter chips */}
      <CategoryChips cats={presentCats} enabled={enabledCats} onToggle={onToggleCat} />

      <div className="mt-4"><SeasonRing tasks={visibleTasks} overlays={overlays} speciesOrder={speciesList} /></div>
      <p className="text-[11px] mt-1 text-center" style={{ color: "#6E7A64" }}>
        Each species keeps its own band of rings, outermost first. Bright outer arcs mark stretches when two or more species share an open window.
      </p>

      <div className="mt-5 space-y-4">
        {enabledCats.length === 0 ? (
          <p className="text-sm" style={{ color: "#A9B29C" }}>Turn on a task type above to compare its timing.</p>
        ) : overlapsByCat.length === 0 ? (
          <p className="text-sm" style={{ color: "#A9B29C" }}>
            No overlapping windows for the selected task types — these species' timings don't coincide.
          </p>
        ) : overlapsByCat.map(({ cat, ranges }) => (
          <div key={cat}>
            <div className="mb-1.5"><Badge category={cat} /></div>
            <div className="space-y-1.5">
              {ranges.map((r, i) => {
                const openNow = doyInRange(todayDoy, r);
                return (
                  <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "#26331F" }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                        {fmtDoy(r.start)} – {fmtDoy(r.end)}
                      </span>
                      {openNow && <span className="text-[11px]" style={{ color: "#8FA876", fontFamily: "IBM Plex Mono, monospace" }}>open now</span>}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "#A9B29C" }}>
                      {r.speciesIds.map(nameOf).join(" + ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
