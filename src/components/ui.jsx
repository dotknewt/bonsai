import React, { useState, useEffect } from "react";
import { Trash2, Sprout } from "lucide-react";
import { CATS } from "../lib/categories.js";

export function EmptyBench({ ctaLabel, ctaIcon: CtaIcon, onCta }) {
  return (
    <div className="mx-5 mt-8 rounded-2xl px-5 py-7 text-center" style={{ background: "#26331F", border: "1px solid #3A4830" }}>
      <Sprout className="mx-auto mb-3" size={28} color="#8FA876" aria-hidden="true" />
      <h3 className="font-display text-[20px]">Your bench is empty</h3>
      <p className="text-[13px] mt-1.5" style={{ color: "#A9B29C" }}>
        Add your first bonsai to start planning seasonal care.
      </p>
      <button onClick={onCta}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium"
        style={{ background: "#D9A441", color: "#1F2A1C" }}>
        <CtaIcon size={14} aria-hidden="true" /> {ctaLabel}
      </button>
    </div>
  );
}

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
            {/* icon keeps its category color even when off, so the chips double as the wheel's legend */}
            <Icon size={11} color={meta.color} /> {meta.label}
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
