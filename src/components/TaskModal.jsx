import React, { useState, useEffect } from "react";
import ModalShell, { inputStyle, MonthDayRow } from "./ModalShell.jsx";
import { CATS, defaultSpanDays } from "../lib/categories.js";
import { REF_YEAR, dateFor } from "../lib/dates.js";

/* Add or edit a care task. With `initial` set the fields are prefilled and the
   auto-span behavior is off from the start, so an existing end date is never
   overwritten. */
export default function TaskModal({ initial = null, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "other");
  const [startMonth, setStartMonth] = useState(initial?.startMonth ?? 5);
  const [startDay, setStartDay] = useState(initial?.startDay ?? 1);
  const [endMonth, setEndMonth] = useState(initial?.endMonth ?? 5);
  const [endDay, setEndDay] = useState(initial?.endDay ?? 15);
  const [endTouched, setEndTouched] = useState(initial != null);
  const [description, setDescription] = useState(initial?.description ?? "");

  // until the user edits the end date, keep it at the category's typical span
  useEffect(() => {
    if (endTouched) return;
    const end = dateFor(REF_YEAR, startMonth, startDay);
    end.setDate(end.getDate() + defaultSpanDays(category));
    setEndMonth(end.getMonth() + 1);
    setEndDay(end.getDate());
  }, [startMonth, startDay, category, endTouched]);

  return (
    <ModalShell title={initial ? "Edit task" : "Add a care task"} onClose={onClose}>
      <div className="space-y-3">
        <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
          {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <MonthDayRow label="Window opens" month={startMonth} day={startDay} onMonth={setStartMonth} onDay={setStartDay} />
        <MonthDayRow label="Window closes" month={endMonth} day={endDay}
          onMonth={(v) => { setEndTouched(true); setEndMonth(v); }}
          onDay={(v) => { setEndTouched(true); setEndDay(v); }} />
        <textarea placeholder="Notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />
        <button disabled={!title.trim()} onClick={() => onSave({ title: title.trim(), startMonth, startDay, endMonth, endDay, category, description: description.trim() })}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: "#D9A441", color: "#1F2A1C" }}>
          {initial ? "Save changes" : "Add task"}
        </button>
      </div>
    </ModalShell>
  );
}
