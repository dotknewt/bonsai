/* Shared helpers for turning pasted/loaded JSON into species data. Import and
   Add-species have different UX rules around bare task lists and error
   wording, so only the shape-sniffing/normalizing pieces live here — each
   caller keeps its own branching on top. */

export function parseJSON(raw) {
  try { return { value: JSON.parse(raw.replace(/^\uFEFF/, "")) }; }
  catch { return { error: "That doesn't look like valid JSON — check the format and try again." }; }
}

export function looksLikeSpecies(x) {
  return !!x && typeof x === "object" && !Array.isArray(x) && ("name" in x || "tasks" in x);
}

/* raw → { name, botanicalName, tasks }, filtering junk task entries. `fallback`
   supplies name/botanicalName when raw doesn't have its own (e.g. typed form
   fields), and is itself only used when raw is missing that field. */
export function normalizeSpeciesShape(raw, fallback = {}) {
  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : (fallback.name || "Untitled"),
    botanicalName: typeof raw.botanicalName === "string" ? raw.botanicalName : (fallback.botanicalName || ""),
    tasks: (Array.isArray(raw.tasks) ? raw.tasks : [])
      .filter((t) => t && typeof t === "object" && !Array.isArray(t)),
  };
}

/* Turn pasted/loaded JSON into a clean species list, or explain what's wrong.
   Lenient where safe (missing tasks, single object), strict where silence
   would surprise (junk elements reject with their position). */
export function parseCollectionText(raw) {
  const { value, error } = parseJSON(raw);
  if (error) return { error };
  let parsed = value;

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) parsed = [parsed];
  if (!Array.isArray(parsed)) return { error: "Unrecognized format — paste an exported collection or species." };
  if (parsed.length === 0) return { error: "That JSON is an empty list — nothing to import." };

  const list = [];
  for (let i = 0; i < parsed.length; i++) {
    const sp = parsed[i];
    if (!sp || typeof sp !== "object" || Array.isArray(sp))
      return { error: `Item ${i + 1} isn't a species object — check the format guide.` };
    if (!("name" in sp) && !("tasks" in sp)) {
      if ("title" in sp)
        return { error: 'That looks like a bare task list — paste it into "Add species" under a name instead.' };
      return { error: `Item ${i + 1} has neither a name nor tasks — check the format guide.` };
    }
    list.push(normalizeSpeciesShape(sp));
  }
  return { list };
}
