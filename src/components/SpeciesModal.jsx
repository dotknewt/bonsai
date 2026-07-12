import React, { useState } from "react";
import { Upload, BookOpen } from "lucide-react";
import ModalShell, { inputStyle, SubmitButton } from "./ModalShell.jsx";
import FormatGuide from "../FormatGuide.jsx";

export default function AddSpeciesModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [botanicalName, setBotanicalName] = useState("");
  const [importText, setImportText] = useState("");
  const [error, setError] = useState("");
  const [showFormat, setShowFormat] = useState(false);

  const submit = () => {
    setError("");
    if (!importText.trim()) {
      if (!name.trim()) return;
      onAdd([{ name: name.trim(), botanicalName: botanicalName.trim(), tasks: [] }]);
      return;
    }
    let parsed;
    try { parsed = JSON.parse(importText); }
    catch { setError("That doesn't look like valid JSON — check the format and try again."); return; }

    if (Array.isArray(parsed) && parsed.length && parsed[0] && typeof parsed[0] === "object" && "tasks" in parsed[0]) {
      // a whole exported collection: [{name, botanicalName, tasks}, ...]
      onAdd(parsed.map((sp) => ({ name: sp.name || "Untitled", botanicalName: sp.botanicalName || "", tasks: sp.tasks || [] })));
    } else if (Array.isArray(parsed)) {
      // a bare task list — needs the typed name
      if (!name.trim()) { setError("Add a common name above first, then paste a bare task list."); return; }
      onAdd([{ name: name.trim(), botanicalName: botanicalName.trim(), tasks: parsed }]);
    } else if (parsed && typeof parsed === "object" && "tasks" in parsed) {
      // a single exported species
      onAdd([{ name: parsed.name || name.trim() || "Untitled", botanicalName: parsed.botanicalName || botanicalName.trim(), tasks: parsed.tasks || [] }]);
    } else {
      setError("Unrecognized format — paste a task list, or an exported species/collection.");
    }
  };

  return (
    <ModalShell title="Add a species" onClose={onClose}>
      <div className="space-y-3">
        <input placeholder="Common name (e.g. Japanese Maple)" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <input placeholder="Botanical name (e.g. Acer palmatum)" value={botanicalName} onChange={(e) => setBotanicalName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] flex items-center gap-1" style={{ color: "#A9B29C" }}><Upload size={11} /> Paste to import (optional)</label>
            <button onClick={() => setShowFormat(true)} className="text-[11px] flex items-center gap-1" style={{ color: "#D9A441" }}>
              <BookOpen size={11} /> Format guide
            </button>
          </div>
          <textarea placeholder={'A task list, a single exported species, or a whole exported collection'} value={importText}
            onChange={(e) => { setImportText(e.target.value); setError(""); }} rows={4}
            className="w-full px-3 py-2 rounded-lg text-[12px] font-mono resize-none" style={inputStyle} />
          <p className="text-[11px] mt-1" style={{ color: "#6E7A64" }}>Paste something someone shared via "Export" — or ask Claude to research a species (e.g. from bonsai4me) and hand you ready-to-paste task data.</p>
          {error && <p className="text-[11px] mt-1" style={{ color: "#D97757" }}>{error}</p>}
        </div>
        <SubmitButton disabled={!name.trim() && !importText.trim()} onClick={submit}>
          Add species
        </SubmitButton>
      </div>
      {showFormat && <FormatGuide onClose={() => setShowFormat(false)} />}
    </ModalShell>
  );
}

/* Rename a species — the import box has no place here, so this is a separate,
   much smaller dialog than AddSpeciesModal. */
export function EditSpeciesModal({ species, onSave, onClose }) {
  const [name, setName] = useState(species.name);
  const [botanicalName, setBotanicalName] = useState(species.botanicalName || "");
  return (
    <ModalShell title="Edit species" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] block mb-1" style={{ color: "#A9B29C" }}>Common name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        </div>
        <div>
          <label className="text-[11px] block mb-1" style={{ color: "#A9B29C" }}>Botanical name</label>
          <input value={botanicalName} onChange={(e) => setBotanicalName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        </div>
        <SubmitButton disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), botanicalName: botanicalName.trim() })}>
          Save changes
        </SubmitButton>
      </div>
    </ModalShell>
  );
}
