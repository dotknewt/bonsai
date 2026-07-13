import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import ModalShell, { SubmitButton } from "./ModalShell.jsx";

/* compact species picker: a one-line trigger that opens a bottom sheet.
   single mode picks one and closes; multi mode toggles freely and adds a
   select-all/clear-all shortcut */
export default function SpeciesPicker({
  species,
  mode = "single",
  selectedIds,
  onPick,
  onToggle,
  onSelectAll,
  onClearAll,
  hint = null,
}) {
  const [open, setOpen] = useState(false);
  // deleted species may linger in the selection, so count via intersection
  const selected = species.filter((s) => selectedIds.includes(s.id));
  const allSelected = species.length > 0 && selected.length === species.length;
  // user-added species may have no botanical name
  const bot = (s) => s.botanicalName || s.name;

  const botanicalStyle = { fontFamily: "Fraunces, serif", fontStyle: "italic" };
  const label = selected.length === 1
    ? { text: bot(selected[0]), style: botanicalStyle }
    : selected.length === 0
      ? { text: mode === "multi" ? "Select species…" : "Choose a species", style: { color: "#A9B29C" } }
      : allSelected
        ? { text: `All species (${species.length})`, style: {} }
        : { text: `${selected.length} species selected`, style: {} };

  return (
    <>
      <button onClick={() => setOpen(true)}
        aria-haspopup="dialog" aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-[13px] transition"
        style={{ background: "#26331F", border: "1px solid #3A4830", color: "#EDE6D6" }}>
        <span className="truncate min-w-0" style={label.style}>{label.text}</span>
        <ChevronDown size={16} color="#A9B29C" className="shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <ModalShell title="Species" onClose={() => setOpen(false)}>
          {hint && <p className="text-[11px] -mt-3 mb-3" style={{ color: "#6E7A64" }}>{hint}</p>}

          {mode === "multi" && (
            <div className="flex justify-end mb-2">
              <button onClick={allSelected ? onClearAll : onSelectAll}
                className="text-[11px] px-2.5 py-1 rounded-full font-medium transition"
                style={{ color: "#D9A441", border: "1px solid #D9A441", fontFamily: "IBM Plex Mono, monospace" }}>
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
          )}

          <div className="space-y-1">
            {species.map((s) => {
              const isSel = selectedIds.includes(s.id);
              return (
                <button key={s.id}
                  onClick={() => {
                    if (mode === "multi") onToggle(s.id);
                    else { onPick(s.id); setOpen(false); }
                  }}
                  aria-pressed={isSel}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition"
                  style={{ background: isSel ? "#EDE6D6" : "#1F2A1C", color: isSel ? "#1F2A1C" : "#EDE6D6" }}>
                  <span className="text-[13px] truncate min-w-0" style={botanicalStyle}>{bot(s)}</span>
                  {isSel && <Check size={14} className="shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {mode === "multi" && (
            <SubmitButton className="mt-4" onClick={() => setOpen(false)}>Done</SubmitButton>
          )}
        </ModalShell>
      )}
    </>
  );
}
