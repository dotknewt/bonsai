import React, { useState, useMemo, useRef } from "react";
import { FileUp, BookOpen } from "lucide-react";
import ModalShell, { inputStyle, SubmitButton } from "./ModalShell.jsx";
import { partitionDuplicateSpecies } from "../lib/storage.js";
import { parseCollectionText } from "../lib/importParsing.js";
import { plural } from "../lib/format.js";
import FormatGuide from "../FormatGuide.jsx";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function TogglePill({ active, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className="px-2.5 py-1 rounded-full text-[11px]"
      style={{
        fontFamily: "IBM Plex Mono, monospace",
        color: active ? "#D9A441" : "#6E7A64",
        border: `1px solid ${active ? "#D9A441" : "#3A4830"}`,
        background: active ? "#D9A44122" : "transparent",
      }}>
      {children}
    </button>
  );
}

export default function ImportModal({ existingNames, onClose, onImport }) {
  const [text, setText] = useState("");
  const [dupMode, setDupMode] = useState("merge"); // "merge" | "skip" | "add"
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState(null); // { added, updated, tasksAdded, skipped } after importing
  const [showFormat, setShowFormat] = useState(false);
  const fileInputRef = useRef(null);

  const parsed = useMemo(() => (text.trim() ? parseCollectionText(text) : null), [text]);
  const dup = useMemo(
    () => (parsed?.list ? partitionDuplicateSpecies(parsed.list, existingNames) : null),
    [parsed, existingNames]
  );
  const taskCount = parsed?.list ? parsed.list.reduce((n, s) => n + s.tasks.length, 0) : 0;
  const willAdd = parsed?.list ? (dupMode === "skip" ? dup.fresh.length : parsed.list.length) : 0;
  const allDuplicates = !!parsed?.list && dupMode === "skip" && willAdd === 0;

  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // re-selecting the same file must re-fire
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) { setFileError("That file is over 5 MB — too large to import."); return; }
    try { setText(await f.text()); setFileError(""); setResult(null); }
    catch { setFileError("Couldn't read that file — try again or paste the JSON instead."); }
  };

  const submit = () => {
    if (!parsed?.list || willAdd === 0) return;
    const res = onImport(parsed.list, { duplicates: dupMode });
    setResult(res);
  };

  const resultText = () => {
    const parts = [];
    if (result.added > 0) parts.push(`Added ${result.added} species.`);
    if (result.updated > 0)
      parts.push(`Updated ${result.updated} existing species${result.tasksAdded > 0 ? ` with ${plural(result.tasksAdded, "new task")}` : ""}.`);
    if (result.skipped > 0) parts.push(`Skipped ${plural(result.skipped, "duplicate")}.`);
    return parts.length ? parts.join(" ") : "Nothing new to add — your collection already had all of it.";
  };

  return (
    <ModalShell title="Import a collection" onClose={onClose}>
      {result ? (
        <div className="space-y-3">
          <p className="text-[13px]" style={{ color: "#EDE6D6" }}>{resultText()}</p>
          <SubmitButton onClick={onClose}>Done</SubmitButton>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] flex items-center gap-1" style={{ color: "#A9B29C" }}>
                <FileUp size={11} /> Paste an exported collection
              </label>
              <button onClick={() => setShowFormat(true)} className="text-[11px] flex items-center gap-1" style={{ color: "#D9A441" }}>
                <BookOpen size={11} /> Format guide
              </button>
            </div>
            <textarea placeholder={'A whole exported collection — or a single exported species'} value={text}
              onChange={(e) => { setText(e.target.value); setFileError(""); setResult(null); }} rows={6}
              className="w-full px-3 py-2 rounded-lg text-[12px] font-mono resize-none" style={inputStyle} />
            <button onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: "#A9B29C" }}>
              <FileUp size={12} /> …or choose a .json file
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={pickFile} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-wide" style={{ color: "#8A9483", fontFamily: "IBM Plex Mono, monospace" }}>Duplicates</span>
              <TogglePill active={dupMode === "merge"} onClick={() => setDupMode("merge")}>Merge</TogglePill>
              <TogglePill active={dupMode === "skip"} onClick={() => setDupMode("skip")}>Skip</TogglePill>
              <TogglePill active={dupMode === "add"} onClick={() => setDupMode("add")}>Add anyway</TogglePill>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "#6E7A64" }}>
              A duplicate is a species whose name matches one already in your collection (ignoring case).
              Merge adds what's missing — botanical name, new tasks — without changing anything already there.
            </p>
          </div>

          {(parsed?.error || fileError) && (
            <p className="text-[11px]" style={{ color: "#D97757" }}>{fileError || parsed.error}</p>
          )}
          {parsed?.list && (
            <p className="text-[11px]" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>
              {parsed.list.length} species · {plural(taskCount, "task")}
              {dup.duplicates.length > 0 && ` · ${dup.duplicates.length} already in your collection`}
            </p>
          )}
          {allDuplicates && (
            <p className="text-[11px]" style={{ color: "#6E7A64" }}>
              All species in this file are already in your collection — switch to "Add anyway" to import them again.
            </p>
          )}

          <SubmitButton disabled={!parsed?.list || willAdd === 0} onClick={submit}>
            {parsed?.list && willAdd > 0 ? `Import ${willAdd} species` : "Import"}
          </SubmitButton>
        </div>
      )}
      {showFormat && <FormatGuide onClose={() => setShowFormat(false)} />}
    </ModalShell>
  );
}
