import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { CATS } from "../lib/categories.js";

/* ---------- small UI atoms ---------- */
export function Badge({ category }) {
  const meta = CATS[category] || CATS.other;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: meta.color + "22", color: meta.color, fontFamily: "IBM Plex Mono, monospace" }}>
      <Icon size={11} /> {meta.label}
    </span>
  );
}

/* task-type filter chips shared by the single-species and overlap views */
export function CategoryChips({ cats, enabled, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {cats.map((c) => {
        const meta = CATS[c];
        const Icon = meta.icon;
        const on = enabled.includes(c);
        return (
          <button key={c} onClick={() => onToggle(c)}
            aria-pressed={on}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium transition"
            style={{
              background: on ? meta.color + "33" : "transparent",
              color: on ? meta.color : "#6E7A64",
              border: `1px solid ${on ? meta.color : "#3A4830"}`,
              fontFamily: "IBM Plex Mono, monospace",
            }}>
            <Icon size={11} /> {meta.label}
          </button>
        );
      })}
    </div>
  );
}

export function ConfirmButton({ onConfirm, label = "", icon: Icon = Trash2 }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (armed) { const t = setTimeout(() => setArmed(false), 2500); return () => clearTimeout(t); } }, [armed]);
  return armed ? (
    <button onClick={onConfirm} className="text-[11px] px-2 py-1 rounded" aria-label={label || "Confirm removal"} style={{ background: "#B4483A", color: "#EDE6D6" }}>
      Remove?
    </button>
  ) : (
    <button onClick={() => setArmed(true)} className="p-1 rounded hover:bg-white/10 transition" aria-label={label || "Remove"} title={label || "Remove"} style={{ color: "#A9B29C" }}>
      <Icon size={14} />
    </button>
  );
}
