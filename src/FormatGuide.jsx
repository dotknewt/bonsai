import React, { useState } from "react";
import { X, Copy } from "lucide-react";

const MONO = { fontFamily: "IBM Plex Mono, monospace" };

const SPECIES_FIELDS = [
  { key: "name", value: "string — required. Common name, e.g. \"Japanese Maple\"." },
  { key: "botanicalName", value: "string — optional. E.g. \"Acer palmatum\"." },
  { key: "tasks", value: "array of task objects — may be empty." },
];

const TASK_FIELDS = [
  { key: "title", value: "string — required. What to do, e.g. \"Repot\"." },
  { key: "month", value: "number 1–12 — required. 1 = January." },
  { key: "day", value: "number 1–31 — required. Day of the month." },
  { key: "category", value: "one of: repot, feed, prune, wire, propagate, seed, pest, other. Anything else becomes \"other\"." },
  { key: "description", value: "string — optional. Longer notes shown under the task." },
];

const EXAMPLE_TASKS = `[
  { "title": "Repot", "month": 4, "day": 15, "category": "repot",
    "description": "Repot as buds swell." },
  { "title": "Start feeding", "month": 5, "day": 10, "category": "feed" }
]`;

const EXAMPLE_SPECIES = `{
  "name": "Japanese Maple",
  "botanicalName": "Acer palmatum",
  "tasks": [
    { "title": "Prune to shape", "month": 6, "day": 1, "category": "prune" }
  ]
}`;

const EXAMPLE_COLLECTION = `[
  { "name": "Japanese Maple", "botanicalName": "Acer palmatum", "tasks": [] },
  { "name": "Scots Pine", "botanicalName": "Pinus sylvestris", "tasks": [] }
]`;

function FieldTable({ title, rows }) {
  return (
    <div className="mb-4">
      <h4 className="text-[12px] uppercase tracking-wide mb-1.5" style={{ color: "#A9B29C", ...MONO }}>{title}</h4>
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #3A4830" }}>
        {rows.map((r, i) => (
          <div key={r.key} className="flex gap-3 px-3 py-2 text-[12px]" style={{ background: i % 2 ? "#1F2A1C" : "#232E1D" }}>
            <span className="shrink-0 w-[110px]" style={{ color: "#D9A441", ...MONO }}>{r.key}</span>
            <span style={{ color: "#C9CDBE" }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Example({ title, note, code }) {
  const [status, setStatus] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setStatus("Copied ✓"); }
    catch { setStatus("Select and copy manually"); }
    setTimeout(() => setStatus(""), 2000);
  };
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[12px] uppercase tracking-wide" style={{ color: "#A9B29C", ...MONO }}>{title}</h4>
        <button onClick={copy} className="flex items-center gap-1 text-[11px]" style={{ color: "#D9A441" }}>
          <Copy size={11} /> {status || "Copy"}
        </button>
      </div>
      <p className="text-[11px] mb-1.5" style={{ color: "#6E7A64" }}>{note}</p>
      <pre className="px-3 py-2 rounded-lg text-[11px] leading-relaxed overflow-x-auto"
        style={{ background: "#1F2A1C", border: "1px solid #3A4830", color: "#C9CDBE", ...MONO }}>{code}</pre>
    </div>
  );
}

export default function FormatGuide({ onClose }) {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-[60]" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: "#26331F", color: "#EDE6D6" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[18px]">Import format</h3>
          <button onClick={onClose} style={{ color: "#A9B29C" }}><X size={18} /></button>
        </div>

        <p className="text-[12px] mb-4" style={{ color: "#A9B29C" }}>
          The import box accepts JSON in three shapes: a bare task list (uses the name you typed above),
          a single species object, or a whole collection — the same formats "Export" produces.
        </p>

        <FieldTable title="Species object" rows={SPECIES_FIELDS} />
        <FieldTable title="Task object" rows={TASK_FIELDS} />

        <Example title="Bare task list" note="Type a common name first, then paste just the tasks." code={EXAMPLE_TASKS} />
        <Example title="Single species" note="A complete species — name comes from the JSON." code={EXAMPLE_SPECIES} />
        <Example title="Whole collection" note="Several species at once, e.g. someone's exported almanac." code={EXAMPLE_COLLECTION} />
      </div>
    </div>
  );
}
