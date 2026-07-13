import React, { useState, useEffect, useMemo } from "react";
import { Loader2, ListChecks, Orbit, Sprout } from "lucide-react";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { KEYS, saveJSON, bootstrapData, partitionDuplicateSpecies, speciesNameKey, mergeSpeciesData, completionKey } from "./lib/storage.js";
import { normalizeTask } from "./lib/dates.js";
import { CATS } from "./lib/categories.js";
import Almanac from "./tools/Almanac.jsx";
import Wheel from "./tools/Wheel.jsx";
import Collection from "./tools/Collection.jsx";

const TABS = [
  { path: "/almanac", label: "Almanac", icon: ListChecks },
  { path: "/wheel", label: "Wheel", icon: Orbit },
  { path: "/collection", label: "Collection", icon: Sprout },
];

/* ---------- app shell ---------- */
/* Owns the shared data (species, completions, specimens) and every mutation;
   the three tools receive it read-only plus the actions they're allowed to
   call. Navigation is hash-based so each tool has its own address. */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState([]);
  const [completions, setCompletions] = useState({});
  const [specimens, setSpecimens] = useState([]);
  const { path, navigate } = useHashRoute();

  // per-tool UI state lives up here (the tools unmount on every tab switch)
  // so a species selection or filter survives hopping between tools
  const [almanacSpeciesId, setAlmanacSpeciesId] = useState(null);
  const [wheelSelection, setWheelSelection] = useState([]);
  const [wheelCats, setWheelCats] = useState([]);

  useEffect(() => {
    (async () => {
      const loaded = await bootstrapData();
      setSpecies(loaded.species);
      setCompletions(loaded.completions);
      setSpecimens(loaded.specimens);
      setAlmanacSpeciesId(loaded.species[0]?.id ?? null);
      setWheelSelection(loaded.species[0] ? [loaded.species[0].id] : []);
      setLoading(false);
    })();
  }, []);

  const toggleWheelSpecies = (id) => {
    setWheelSelection((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const selectAllWheelSpecies = () => setWheelSelection(species.map((s) => s.id));
  const clearWheelSelection = () => setWheelSelection([]);
  const toggleWheelCat = (c) => {
    setWheelCats((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const persistSpecies = async (next) => { setSpecies(next); await saveJSON(KEYS.species, next); };
  const persistCompletions = async (next) => { setCompletions(next); await saveJSON(KEYS.completions, next); };
  const persistSpecimens = async (next) => { setSpecimens(next); await saveJSON(KEYS.specimens, next); };

  const year = new Date().getFullYear();
  const toggleDone = (speciesId, taskId) => {
    const key = completionKey(speciesId, taskId, year);
    const next = { ...completions, [key]: !completions[key] };
    persistCompletions(next);
  };

  const removeSpecies = (id) => {
    persistSpecies(species.filter((s) => s.id !== id));
    // a species' trees go with it
    const keptSpecimens = specimens.filter((x) => x.speciesId !== id);
    if (keptSpecimens.length !== specimens.length) persistSpecimens(keptSpecimens);
  };
  const removeTask = (speciesId, taskId) => {
    const next = species.map((s) => s.id === speciesId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s);
    persistSpecies(next);
  };
  const addTask = (speciesId, task) => {
    const next = species.map((s) => s.id === speciesId ? { ...s, tasks: [...s.tasks, { ...normalizeTask(task), id: `t${Date.now()}` }] } : s);
    persistSpecies(next);
  };
  const updateTask = (speciesId, taskId, fields) => {
    // completions key on the task id, so edits must never regenerate it
    const next = species.map((s) => s.id === speciesId
      ? { ...s, tasks: s.tasks.map((t) => t.id === taskId ? normalizeTask({ ...t, ...fields }) : t) }
      : s);
    persistSpecies(next);
  };
  const updateSpecies = (id, fields) => {
    persistSpecies(species.map((s) => s.id === id ? { ...s, ...fields } : s));
  };
  const makeStoreTask = (t, si, ti) => {
    const nt = normalizeTask(t);
    return {
      id: `t${Date.now()}${si}${ti}`,
      title: nt.title,
      startMonth: nt.startMonth, startDay: nt.startDay,
      endMonth: nt.endMonth, endDay: nt.endDay,
      category: CATS[nt.category] ? nt.category : "other",
      description: nt.description || "",
    };
  };
  const buildSpeciesAdditions = (list) => {
    let firstId = null;
    const additions = list.map((sp, si) => {
      const id = `${(sp.name || "species").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${si}`;
      if (!firstId) firstId = id;
      return {
        id, name: sp.name || "Untitled", botanicalName: sp.botanicalName || "",
        tasks: (sp.tasks || []).map((t, ti) => makeStoreTask(t, si, ti)),
      };
    });
    return { additions, firstId };
  };
  const addSpeciesBatch = (list) => {
    const { additions, firstId } = buildSpeciesAdditions(list);
    persistSpecies([...species, ...additions]);
    return firstId;
  };
  const importSpecies = (list, { duplicates = "merge" } = {}) => {
    const { fresh, duplicates: dups } = duplicates === "add"
      ? { fresh: list, duplicates: [] }
      : partitionDuplicateSpecies(list, species.map((s) => s.name));
    let current = species;
    let updated = 0, tasksAdded = 0, firstMergedId = null;
    if (duplicates === "merge") {
      dups.forEach((imp, di) => {
        // fill the first name match only — copies from "Add anyway" stay untouched
        const idx = current.findIndex((s) => speciesNameKey(s.name) === speciesNameKey(imp.name));
        if (idx === -1) return;
        let ti = 0;
        const { merged, tasksAdded: added, changed } =
          mergeSpeciesData(current[idx], { ...imp, tasks: imp.tasks || [] }, (t) => makeStoreTask(t, `m${di}`, ti++));
        if (!changed) return;
        updated++; tasksAdded += added;
        if (!firstMergedId) firstMergedId = merged.id;
        current = current.map((s, i) => (i === idx ? merged : s));
      });
    }
    const { additions, firstId } = buildSpeciesAdditions(fresh);
    if (additions.length || updated) persistSpecies([...current, ...additions]);
    return {
      added: additions.length, updated, tasksAdded,
      skipped: duplicates === "skip" ? dups.length : 0,
      firstId: firstId || firstMergedId,
    };
  };
  const addSpecimen = (speciesId, fields) => {
    persistSpecimens([...specimens, { id: `tree${Date.now()}`, speciesId, ...fields }]);
  };
  const updateSpecimen = (id, fields) => {
    persistSpecimens(specimens.map((x) => x.id === id ? { ...x, ...fields } : x));
  };
  const removeSpecimen = (id) => {
    persistSpecimens(specimens.filter((x) => x.id !== id));
  };

  const specimensBySpecies = useMemo(() => {
    const m = {};
    specimens.forEach((x) => { (m[x.speciesId] ||= []).push(x); });
    return m;
  }, [specimens]);

  if (loading) {
    return (
      <div style={{ background: "#1F2A1C" }} className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" color="#A9B29C" size={28} />
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.path === path) || TABS[0];
  const data = { species, completions, specimens, specimensBySpecies, year };
  const actions = {
    toggleDone, removeSpecies, removeTask, addTask, updateTask, updateSpecies,
    addSpeciesBatch, importSpecies, addSpecimen, updateSpecimen, removeSpecimen, navigate,
  };

  return (
    <div style={{ background: "#1F2A1C", fontFamily: "IBM Plex Sans, sans-serif", color: "#EDE6D6", minHeight: "100vh" }} className="pb-24">
      {/* header */}
      <div className="px-5 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(237,230,214,0.1)" }}>
        <h1 className="font-display text-[26px] leading-tight" style={{ color: "#EDE6D6" }}>Bench Almanac</h1>
        <p className="text-[13px] mt-1" style={{ color: "#A9B29C" }}>Care windows for your bonsai, tuned to Norway's seasons.</p>
      </div>

      {activeTab.path === "/wheel" ? (
        <Wheel data={data}
          selectedIds={wheelSelection} onToggleSpecies={toggleWheelSpecies}
          onSelectAllSpecies={selectAllWheelSpecies} onClearSpecies={clearWheelSelection}
          enabledCats={wheelCats} onToggleCat={toggleWheelCat} />
      ) : activeTab.path === "/collection" ? (
        <Collection data={data} actions={actions} />
      ) : (
        <Almanac data={data} actions={actions}
          activeId={almanacSpeciesId} onSelectSpecies={setAlmanacSpeciesId} />
      )}

      {/* tool switcher */}
      <nav aria-label="Tools" className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: "#26331F", borderTop: "1px solid #3A4830", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {TABS.map(({ path: p, label, icon: Icon }) => {
            const active = p === activeTab.path;
            return (
              <button key={p} onClick={() => navigate(p)} aria-current={active ? "page" : undefined}
                className="flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 transition"
                style={{ color: active ? "#D9A441" : "#A9B29C" }}>
                <Icon size={18} aria-hidden="true" />
                <span className="text-[10px]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
