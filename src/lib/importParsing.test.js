import { describe, it, expect } from "vitest";
import { parseJSON, looksLikeSpecies, normalizeSpeciesShape, parseCollectionText } from "./importParsing.js";

describe("parseJSON", () => {
  it("parses valid JSON", () => {
    expect(parseJSON('{"a":1}')).toEqual({ value: { a: 1 } });
  });

  it("returns the standard error message on malformed JSON", () => {
    const { error } = parseJSON("{not json");
    expect(error).toBe("That doesn't look like valid JSON — check the format and try again.");
  });

  it("strips a leading BOM before parsing", () => {
    const withBom = "﻿" + '{"a":1}';
    expect(parseJSON(withBom)).toEqual({ value: { a: 1 } });
  });
});

describe("looksLikeSpecies", () => {
  it("matches an object with a name or tasks key", () => {
    expect(looksLikeSpecies({ name: "Maple" })).toBe(true);
    expect(looksLikeSpecies({ tasks: [] })).toBe(true);
  });

  it("rejects arrays, primitives, and objects with neither key", () => {
    expect(looksLikeSpecies([])).toBe(false);
    expect(looksLikeSpecies("Maple")).toBe(false);
    expect(looksLikeSpecies({ title: "Repot" })).toBe(false);
  });
});

describe("normalizeSpeciesShape", () => {
  it("falls back to 'Untitled' when there's no fallback and no name", () => {
    expect(normalizeSpeciesShape({ tasks: [] }).name).toBe("Untitled");
  });

  it("uses the fallback name when raw has none", () => {
    expect(normalizeSpeciesShape({ tasks: [] }, { name: "Typed Name" }).name).toBe("Typed Name");
  });

  it("prefers raw's own name over the fallback when both are present", () => {
    expect(normalizeSpeciesShape({ name: "From JSON", tasks: [] }, { name: "Typed Name" }).name).toBe("From JSON");
  });

  it("filters out non-object task entries", () => {
    const out = normalizeSpeciesShape({ tasks: [{ title: "Real" }, "junk", 42, ["nested"], null] });
    expect(out.tasks).toEqual([{ title: "Real" }]);
  });

  it("defaults tasks to an empty array when missing", () => {
    expect(normalizeSpeciesShape({ name: "X" }).tasks).toEqual([]);
  });
});

describe("parseCollectionText", () => {
  it("reports malformed JSON", () => {
    const { error } = parseCollectionText("{not json");
    expect(error).toBe("That doesn't look like valid JSON — check the format and try again.");
  });

  it("wraps a bare species object into a one-element list", () => {
    const { list } = parseCollectionText('{"name":"Maple","tasks":[]}');
    expect(list).toEqual([{ name: "Maple", botanicalName: "", tasks: [] }]);
  });

  it("rejects something that's neither array nor object", () => {
    const { error } = parseCollectionText("42");
    expect(error).toBe("Unrecognized format — paste an exported collection or species.");
  });

  it("rejects an empty list", () => {
    const { error } = parseCollectionText("[]");
    expect(error).toBe("That JSON is an empty list — nothing to import.");
  });

  it("reports a 1-indexed position for a non-object element", () => {
    const { error } = parseCollectionText('[{"name":"A","tasks":[]}, "junk", {"name":"C","tasks":[]}]');
    expect(error).toBe("Item 2 isn't a species object — check the format guide.");
  });

  it("redirects a bare task list to Add species", () => {
    const { error } = parseCollectionText('[{"title":"Repot","startMonth":4,"startDay":1}]');
    expect(error).toBe('That looks like a bare task list — paste it into "Add species" under a name instead.');
  });

  it("reports when an item has neither a name, tasks, nor title", () => {
    const { error } = parseCollectionText('[{"foo":"bar"}]');
    expect(error).toBe("Item 1 has neither a name nor tasks — check the format guide.");
  });

  it("normalizes a well-formed multi-species array, filtering junk tasks", () => {
    const { list } = parseCollectionText(JSON.stringify([
      { name: "Maple", tasks: [{ title: "Repot" }, "junk"] },
      { name: "Juniper", tasks: [] },
    ]));
    expect(list).toEqual([
      { name: "Maple", botanicalName: "", tasks: [{ title: "Repot" }] },
      { name: "Juniper", botanicalName: "", tasks: [] },
    ]);
  });
});
