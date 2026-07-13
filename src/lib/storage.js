import { SEED_SPECIES } from "../data/seedSpecies.js";
import { normalizeTask } from "./dates.js";

export const KEYS = {
  species: "bonsai-species",
  completions: "bonsai-completions",
  seeded: "bonsai-seeded-species-ids",
  specimens: "bonsai-specimens",
};

/* Key into the completions blob stored under KEYS.completions. */
export const completionKey = (speciesId, taskId, year) => `${speciesId}:${taskId}:${year}`;

/* ---------- storage helpers (localStorage) ---------- */
export async function loadJSON(key, fallback) {
  try {
    const r = window.localStorage.getItem(key);
    return r !== null ? JSON.parse(r) : fallback;
  } catch { return fallback; }
}

export async function saveJSON(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

/* ---------- export helper ---------- */
export function toExportObject(s) {
  return { name: s.name, botanicalName: s.botanicalName, tasks: s.tasks.map(({ id, ...rest }) => rest) };
}

/* ---------- import helpers ---------- */
// duplicates are matched on the common name only, ignoring case and whitespace
export const speciesNameKey = (name) => (name || "Untitled").trim().toLowerCase();

/* Split an import list into species that are new vs. ones whose name already
   exists — either in the collection or earlier in the same list. */
export function partitionDuplicateSpecies(list, existingNames) {
  const seen = new Set(existingNames.map(speciesNameKey));
  const fresh = [], duplicates = [];
  for (const sp of list) {
    const key = speciesNameKey(sp.name);
    if (seen.has(key)) duplicates.push(sp);
    else { seen.add(key); fresh.push(sp); }
  }
  return { fresh, duplicates };
}

export const taskTitleKey = (t) => (t.title || "").trim().toLowerCase();

/* Fill what `existing` is missing from `imported` without touching anything
   it already has: an empty botanical name, descriptions on title-matched
   tasks, and whole tasks whose title isn't there yet. Existing task ids are
   never regenerated — completions key on them. `makeTask` turns a raw
   imported task into a normalized, id-stamped store task. */
export function mergeSpeciesData(existing, imported, makeTask) {
  const titles = new Set(existing.tasks.map(taskTitleKey));
  let filled = 0;
  const tasks = existing.tasks.map((t) => {
    if (t.description) return t;
    const src = imported.tasks.find((i) => taskTitleKey(i) === taskTitleKey(t));
    if (src?.description) { filled++; return { ...t, description: src.description }; }
    return t;
  });
  const newTasks = [];
  for (const t of imported.tasks) {
    const key = taskTitleKey(t);
    if (!key || titles.has(key)) continue;
    titles.add(key);
    newTasks.push(makeTask(t));
  }
  const botanicalName = existing.botanicalName || imported.botanicalName || "";
  const changed = newTasks.length > 0 || filled > 0 || botanicalName !== (existing.botanicalName || "");
  return { merged: { ...existing, botanicalName, tasks: [...tasks, ...newTasks] }, tasksAdded: newTasks.length, changed };
}

/* First-load bootstrap shared by every tool: seed defaults, merge newly
   shipped defaults into existing almanacs, migrate legacy task shapes. */
export async function bootstrapData() {
  let sp = await loadJSON(KEYS.species, null);
  // seenIds tracks every default species id ever merged in, so species the
  // user has removed on purpose don't come back when new defaults are added
  const seenIds = await loadJSON(KEYS.seeded, null);
  if (!sp) {
    sp = SEED_SPECIES;
  } else {
    const known = new Set(seenIds || sp.map((s) => s.id));
    const newDefaults = SEED_SPECIES.filter((s) => !known.has(s.id) && !sp.some((existing) => existing.id === s.id));
    if (newDefaults.length) sp = [...sp, ...newDefaults];
  }
  await saveJSON(KEYS.seeded, SEED_SPECIES.map((s) => s.id));
  // migrate any legacy single-date tasks to windows
  sp = sp.map((s) => ({ ...s, tasks: (s.tasks || []).map(normalizeTask) }));
  await saveJSON(KEYS.species, sp);
  const completions = await loadJSON(KEYS.completions, {});
  const specimens = await loadJSON(KEYS.specimens, []);
  return { species: sp, completions, specimens };
}
