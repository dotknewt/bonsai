import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../data/seedSpecies.js", () => ({
  SEED_SPECIES: [
    { id: "seed-1", name: "Seed One", botanicalName: "", tasks: [] },
    { id: "seed-2", name: "Seed Two", botanicalName: "", tasks: [{ month: 4, day: 1, title: "Legacy task", category: "other" }] },
  ],
}));

import {
  loadJSON, saveJSON, speciesNameKey, partitionDuplicateSpecies,
  mergeSpeciesData, bootstrapData, pruneCompletionsToYear, KEYS,
} from "./storage.js";

function makeLocalStorageStub() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    _store: store,
  };
}

let localStorage;
beforeEach(() => {
  localStorage = makeLocalStorageStub();
  vi.stubGlobal("window", { localStorage });
});

describe("loadJSON / saveJSON", () => {
  it("round-trips a value through save then load", async () => {
    await saveJSON("k", { a: 1 });
    expect(await loadJSON("k", null)).toEqual({ a: 1 });
  });

  it("returns the fallback when the key is missing", async () => {
    expect(await loadJSON("missing", "fallback-value")).toBe("fallback-value");
  });

  it("falls back when the stored value is malformed JSON", async () => {
    localStorage.setItem("bad", "{not json");
    expect(await loadJSON("bad", "fallback")).toBe("fallback");
  });

  it("returns false instead of throwing when setItem fails (e.g. quota exceeded)", async () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(await saveJSON("k", { a: 1 })).toBe(false);
  });
});

describe("speciesNameKey", () => {
  it("is case- and whitespace-insensitive", () => {
    expect(speciesNameKey(" Japanese Maple ")).toBe(speciesNameKey("japanese maple"));
  });

  it("falls back to 'untitled' for an empty or missing name", () => {
    expect(speciesNameKey("")).toBe("untitled");
    expect(speciesNameKey(undefined)).toBe("untitled");
  });
});

describe("partitionDuplicateSpecies", () => {
  it("puts a name-matching entry into duplicates", () => {
    const { fresh, duplicates } = partitionDuplicateSpecies([{ name: "Maple" }], ["Maple"]);
    expect(fresh).toEqual([]);
    expect(duplicates).toHaveLength(1);
  });

  it("puts a non-matching entry into fresh", () => {
    const { fresh, duplicates } = partitionDuplicateSpecies([{ name: "Juniper" }], ["Maple"]);
    expect(fresh).toHaveLength(1);
    expect(duplicates).toEqual([]);
  });

  it("catches a duplicate within the imported list itself, not just against existing names", () => {
    const list = [{ name: "Maple" }, { name: "maple " }];
    const { fresh, duplicates } = partitionDuplicateSpecies(list, []);
    expect(fresh).toEqual([list[0]]);
    expect(duplicates).toEqual([list[1]]);
  });
});

describe("mergeSpeciesData", () => {
  const makeTask = (t) => ({ id: `new-${t.title}`, ...t });

  it("fills a missing description on a title-matched existing task", () => {
    const existing = { id: "sp1", name: "Foo", botanicalName: "", tasks: [{ id: "t1", title: "Repot", description: "" }] };
    const imported = { botanicalName: "", tasks: [{ title: "Repot", description: "Imported notes" }] };
    const { merged, tasksAdded, changed } = mergeSpeciesData(existing, imported, makeTask);
    expect(merged.tasks[0].description).toBe("Imported notes");
    expect(tasksAdded).toBe(0);
    expect(changed).toBe(true);
  });

  it("never overwrites an existing description, even with a title-matched import that has a different one", () => {
    const existing = { id: "sp1", name: "Foo", botanicalName: "", tasks: [{ id: "t2", title: "Prune", description: "Existing notes" }] };
    const imported = { botanicalName: "", tasks: [{ title: "Prune", description: "Different notes" }] };
    const { merged, changed } = mergeSpeciesData(existing, imported, makeTask);
    expect(merged.tasks[0].description).toBe("Existing notes");
    expect(changed).toBe(false);
  });

  it("adds an imported task whose title doesn't match anything existing", () => {
    const existing = { id: "sp1", name: "Foo", botanicalName: "", tasks: [] };
    const imported = { botanicalName: "", tasks: [{ title: "New task", description: "brand new" }] };
    const { merged, tasksAdded, changed } = mergeSpeciesData(existing, imported, makeTask);
    expect(tasksAdded).toBe(1);
    expect(merged.tasks).toHaveLength(1);
    expect(merged.tasks[0].id).toBe("new-New task");
    expect(changed).toBe(true);
  });

  it("does not add a duplicate when the imported title (case/whitespace-insensitive) already exists", () => {
    const existing = { id: "sp1", name: "Foo", botanicalName: "", tasks: [{ id: "t1", title: "Repot", description: "notes" }] };
    const imported = { botanicalName: "", tasks: [{ title: " repot ", description: "notes" }] };
    const { merged, tasksAdded } = mergeSpeciesData(existing, imported, makeTask);
    expect(tasksAdded).toBe(0);
    expect(merged.tasks).toHaveLength(1);
  });

  it("skips a blank-titled imported task entirely", () => {
    const existing = { id: "sp1", name: "Foo", botanicalName: "", tasks: [] };
    const imported = { botanicalName: "", tasks: [{ title: "", description: "should be ignored" }] };
    const { merged, tasksAdded } = mergeSpeciesData(existing, imported, makeTask);
    expect(tasksAdded).toBe(0);
    expect(merged.tasks).toHaveLength(0);
  });

  it("fills botanicalName only when existing's is empty, and never overwrites a present one", () => {
    const filled = mergeSpeciesData(
      { id: "sp1", name: "Foo", botanicalName: "", tasks: [] },
      { botanicalName: "Ficus foo", tasks: [] },
      makeTask,
    );
    expect(filled.merged.botanicalName).toBe("Ficus foo");
    expect(filled.changed).toBe(true);

    const untouched = mergeSpeciesData(
      { id: "sp1", name: "Foo", botanicalName: "Original genus", tasks: [] },
      { botanicalName: "Different genus", tasks: [] },
      makeTask,
    );
    expect(untouched.merged.botanicalName).toBe("Original genus");
    expect(untouched.changed).toBe(false);
  });

  it("never regenerates an existing task's id", () => {
    const existing = { id: "sp1", name: "Foo", botanicalName: "", tasks: [{ id: "t1", title: "Repot", description: "" }] };
    const imported = { botanicalName: "", tasks: [{ title: "Repot", description: "filled in" }] };
    const { merged } = mergeSpeciesData(existing, imported, makeTask);
    expect(merged.tasks[0].id).toBe("t1");
  });
});

describe("pruneCompletionsToYear", () => {
  it("keeps only entries whose key ends with the given year", () => {
    const completions = { "sp1:t1:2024": true, "sp1:t2:2026": true, "sp2:t1:2026": false };
    expect(pruneCompletionsToYear(completions, 2026)).toEqual({ "sp1:t2:2026": true, "sp2:t1:2026": false });
  });

  it("returns an empty object when nothing matches", () => {
    expect(pruneCompletionsToYear({ "sp1:t1:2024": true }, 2026)).toEqual({});
  });

  it("leaves an already-current blob untouched", () => {
    const completions = { "sp1:t1:2026": true };
    expect(pruneCompletionsToYear(completions, 2026)).toEqual(completions);
  });
});

describe("bootstrapData", () => {
  it("seeds from SEED_SPECIES on first load, migrating any legacy tasks", async () => {
    const { species } = await bootstrapData();
    expect(species.map((s) => s.id)).toEqual(["seed-1", "seed-2"]);
    const legacyTask = species.find((s) => s.id === "seed-2").tasks[0];
    expect(legacyTask.startMonth).toBe(4);
    expect(legacyTask.startDay).toBe(1);
    expect(legacyTask).not.toHaveProperty("month");
  });

  it("does not re-add a default species the user deliberately removed", async () => {
    await saveJSON(KEYS.species, [{ id: "seed-2", name: "Seed Two", botanicalName: "", tasks: [] }]);
    await saveJSON(KEYS.seeded, ["seed-1", "seed-2"]); // seed-1 was seeded before, then removed by the user
    const { species } = await bootstrapData();
    expect(species.map((s) => s.id)).toEqual(["seed-2"]);
  });

  it("appends a genuinely new default species not seen before", async () => {
    await saveJSON(KEYS.species, [{ id: "seed-1", name: "Seed One", botanicalName: "", tasks: [] }]);
    await saveJSON(KEYS.seeded, ["seed-1"]); // seed-2 didn't exist yet when this user last seeded
    const { species } = await bootstrapData();
    expect(species.map((s) => s.id).sort()).toEqual(["seed-1", "seed-2"]);
  });

  it("prunes completions from prior years and persists the pruned blob", async () => {
    const year = new Date().getFullYear();
    await saveJSON(KEYS.completions, { [`sp1:t1:${year - 1}`]: true, [`sp1:t2:${year}`]: true });
    const { completions } = await bootstrapData();
    expect(completions).toEqual({ [`sp1:t2:${year}`]: true });
    expect(await loadJSON(KEYS.completions, null)).toEqual({ [`sp1:t2:${year}`]: true });
  });

  it("does not rewrite storage when completions already only contain the current year", async () => {
    const year = new Date().getFullYear();
    await saveJSON(KEYS.completions, { [`sp1:t1:${year}`]: true });
    const setItemSpy = vi.spyOn(localStorage, "setItem");
    await bootstrapData();
    expect(setItemSpy).not.toHaveBeenCalledWith(KEYS.completions, expect.anything());
  });
});
