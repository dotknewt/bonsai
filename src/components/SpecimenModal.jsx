import React, { useState } from "react";
import ModalShell, { inputStyle } from "./ModalShell.jsx";

/* Add or edit one of the user's actual trees. The species is fixed by where
   the dialog was opened from, so only the tree's own details are asked for. */
export default function SpecimenModal({ initial = null, speciesName, onSave, onClose }) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [acquiredDate, setAcquiredDate] = useState(initial?.acquiredDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  return (
    <ModalShell title={initial ? "Edit tree" : `Add a ${speciesName}`} onClose={onClose}>
      <div className="space-y-3">
        <input placeholder="Nickname (e.g. The windswept one)" value={nickname} onChange={(e) => setNickname(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <div>
          <label className="text-[11px] block mb-1" style={{ color: "#A9B29C" }}>Acquired (optional)</label>
          <input type="date" value={acquiredDate} onChange={(e) => setAcquiredDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>
        <textarea placeholder="Notes — pot, styling plans, history… (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />
        <button disabled={!nickname.trim()} onClick={() => onSave({ nickname: nickname.trim(), acquiredDate, notes: notes.trim() })}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: "#D9A441", color: "#1F2A1C" }}>
          {initial ? "Save changes" : "Add tree"}
        </button>
      </div>
    </ModalShell>
  );
}
