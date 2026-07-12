import React from "react";
import { X } from "lucide-react";
import { MONTH_LETTERS } from "../lib/dates.js";

export default function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: "#26331F", color: "#EDE6D6" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[18px]">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" title="Close" style={{ color: "#A9B29C" }}><X size={18} aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputStyle = { background: "#1F2A1C", border: "1px solid #3A4830", color: "#EDE6D6" };

/* the gold primary action every modal ends with */
export function SubmitButton({ disabled = false, onClick, className = "", children }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 ${className}`}
      style={{ background: "#D9A441", color: "#1F2A1C" }}>
      {children}
    </button>
  );
}

export function MonthDayRow({ label, month, day, onMonth, onDay }) {
  return (
    <div>
      <label className="text-[11px] block mb-1" style={{ color: "#A9B29C" }}>{label}</label>
      <div className="flex gap-2">
        <select value={month} onChange={(e) => onMonth(+e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={inputStyle}>
          {MONTH_LETTERS.map((_, i) => <option key={i} value={i + 1}>{new Date(2000, i, 1).toLocaleString(undefined, { month: "long" })}</option>)}
        </select>
        <input type="number" min={1} max={31} value={day} onChange={(e) => onDay(+e.target.value)} className="w-20 px-3 py-2 rounded-lg text-sm" style={inputStyle} />
      </div>
    </div>
  );
}
