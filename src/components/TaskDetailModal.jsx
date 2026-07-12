import React from "react";
import { Check, Pencil } from "lucide-react";
import ModalShell from "./ModalShell.jsx";
import { CATS } from "../lib/categories.js";
import { windowStatus, fmtWindow, fmtDate, seasonLabel, daysUntilText } from "../lib/dates.js";
import { Badge } from "./ui.jsx";

/* Read-only close-up of a single care task — everything the list rows elide:
   category, which trees it applies to, the full window with its status, and
   the notes. Mutation stays with the caller via onToggleDone/onEdit. */
export default function TaskDetailModal({ task, speciesName, trees = "", year, done, onToggleDone, onEdit = null, onClose }) {
  const st = windowStatus(task);
  const meta = CATS[task.category] || CATS.other;
  const soon = (st.start - new Date()) / 86400000 <= 14;

  return (
    <ModalShell title={task.title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Badge category={task.category} />
          <p className="text-[12px] mt-2" style={{ color: "#A9B29C" }}>
            {speciesName}{trees ? ` · ${trees}` : ""}
          </p>
        </div>

        <div className="rounded-lg px-3 py-2.5" style={{ background: "#1F2A1C" }}>
          <h4 className="text-[11px] tracking-wide uppercase mb-1" style={{ color: "#8A9483", fontFamily: "IBM Plex Mono, monospace" }}>Care window</h4>
          <p className="text-[13px]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
            {fmtWindow(st)} · {seasonLabel(task.startMonth)}
          </p>
          <p className="text-[12px] mt-1" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
            {st.open ? (
              <span style={{ color: "#8FA876" }}>Open now · until {fmtDate(st.end)}</span>
            ) : (
              <span style={{ color: soon ? "#D9A441" : "#A9B29C" }}>Opens {daysUntilText(st.start)}</span>
            )}
          </p>
        </div>

        {task.description && (
          <div>
            <h4 className="text-[11px] tracking-wide uppercase mb-1" style={{ color: "#8A9483", fontFamily: "IBM Plex Mono, monospace" }}>Notes</h4>
            <p className="text-[12px] leading-snug" style={{ color: "#A9B29C" }}>{task.description}</p>
          </div>
        )}

        <button onClick={onToggleDone}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition"
          style={{ background: "#1F2A1C" }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ border: `1.5px solid ${done ? meta.color : "#4A5540"}`, background: done ? meta.color : "transparent" }}>
            {done && <Check size={12} color="#1F2A1C" aria-hidden="true" />}
          </span>
          <span className="text-[13px]">{done ? `Done for ${year}` : `Mark done for ${year}`}</span>
        </button>

        {onEdit && (
          <button onClick={onEdit}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px]"
            style={{ border: "1px solid #4A5540", color: "#A9B29C" }}>
            <Pencil size={13} aria-hidden="true" /> Edit task
          </button>
        )}
      </div>
    </ModalShell>
  );
}
