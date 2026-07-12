import React, { useState } from "react";
import { Plus, Share2, Pencil, ChevronDown, Sprout } from "lucide-react";
import { seasonLabel, windowStatus, fmtWindow, fmtDate } from "../lib/dates.js";
import { toExportObject } from "../lib/storage.js";
import { Badge, ConfirmButton } from "../components/ui.jsx";
import AddSpeciesModal, { EditSpeciesModal } from "../components/SpeciesModal.jsx";
import TaskModal from "../components/TaskModal.jsx";
import ExportModal from "../components/ExportModal.jsx";
import SpecimenModal from "../components/SpecimenModal.jsx";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/* The data hub: everything in the species store is created, edited and shared
   from here — the Almanac and Wheel only read it. Also home to "my trees",
   the actual specimens on the bench, linked to their species. */
export default function Collection({ data, actions }) {
  const { species, specimens } = data;
  const [openId, setOpenId] = useState(null);
  const [showAddSpecies, setShowAddSpecies] = useState(false);
  const [editSpecies, setEditSpecies] = useState(null);   // species being renamed
  const [taskModal, setTaskModal] = useState(null);       // { speciesId, task|null }
  const [specimenModal, setSpecimenModal] = useState(null); // { species, specimen|null }
  const [exportPayload, setExportPayload] = useState(null); // { title, text }

  const treesOf = (speciesId) => specimens.filter((x) => x.speciesId === speciesId);

  return (
    <>
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] tracking-wide uppercase" style={{ color: "#A9B29C", fontFamily: "IBM Plex Mono, monospace" }}>Species</h2>
          <div className="flex items-center gap-4">
            {species.length > 0 && (
              <button onClick={() => setExportPayload({ title: "Export whole collection", text: JSON.stringify(species.map(toExportObject), null, 2) })}
                className="flex items-center gap-1 text-[11px]" style={{ color: "#A9B29C" }}>
                <Share2 size={12} /> Export all
              </button>
            )}
            <button onClick={() => setShowAddSpecies(true)}
              className="flex items-center gap-1 text-[11px]" style={{ color: "#D9A441" }}>
              <Plus size={12} /> Add species
            </button>
          </div>
        </div>

        {species.length === 0 ? (
          <div className="mt-4 rounded-2xl px-5 py-7 text-center" style={{ background: "#26331F", border: "1px solid #3A4830" }}>
            <Sprout className="mx-auto mb-3" size={28} color="#8FA876" aria-hidden="true" />
            <h3 className="font-display text-[20px]">Your bench is empty</h3>
            <p className="text-[13px] mt-1.5" style={{ color: "#A9B29C" }}>
              Add your first bonsai to start planning seasonal care.
            </p>
            <button onClick={() => setShowAddSpecies(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "#D9A441", color: "#1F2A1C" }}>
              <Plus size={14} aria-hidden="true" /> Add your first species
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {species.map((s) => {
              const open = openId === s.id;
              const trees = treesOf(s.id);
              const tasks = [...s.tasks].sort((a, b) => (a.startMonth - b.startMonth) || (a.startDay - b.startDay));
              return (
                <div key={s.id} className="rounded-xl" style={{ background: "#26331F" }}>
                  <button onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium leading-tight truncate">{s.name}</div>
                      <div className="text-[11px] italic truncate" style={{ color: "#A9B29C", fontFamily: "Fraunces, serif" }}>{s.botanicalName}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px]" style={{ color: "#8A9483", fontFamily: "IBM Plex Mono, monospace" }}>
                        {plural(s.tasks.length, "task")}{trees.length > 0 && ` · ${plural(trees.length, "tree")}`}
                      </span>
                      <ChevronDown size={16} color="#A9B29C" aria-hidden="true"
                        style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4">
                      {/* species actions */}
                      <div className="flex items-center gap-4 pb-3" style={{ borderBottom: "1px solid #3A4830" }}>
                        <button onClick={() => setEditSpecies(s)}
                          className="flex items-center gap-1 text-[11px]" style={{ color: "#A9B29C" }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => setExportPayload({ title: `Export ${s.name}`, text: JSON.stringify(toExportObject(s), null, 2) })}
                          className="flex items-center gap-1 text-[11px]" style={{ color: "#A9B29C" }}>
                          <Share2 size={12} /> Export
                        </button>
                        <div className="ml-auto">
                          <ConfirmButton onConfirm={() => { setOpenId(null); actions.removeSpecies(s.id); }}
                            label={`Delete ${s.name}${trees.length ? " and its trees" : ""}`} />
                        </div>
                      </div>

                      {/* care tasks */}
                      <h4 className="text-[11px] tracking-wide uppercase mt-3 mb-2" style={{ color: "#8A9483", fontFamily: "IBM Plex Mono, monospace" }}>Care tasks</h4>
                      <div className="space-y-1.5">
                        {tasks.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#1F2A1C" }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px]">{t.title}</span>
                                <Badge category={t.category} />
                              </div>
                              <p className="text-[11px] mt-0.5" style={{ color: "#6E7A64", fontFamily: "IBM Plex Mono, monospace" }}>
                                {seasonLabel(t.startMonth)} · {fmtWindow(windowStatus(t))}
                              </p>
                            </div>
                            <button onClick={() => setTaskModal({ speciesId: s.id, task: t })}
                              aria-label={`Edit task: ${t.title}`} title="Edit"
                              className="p-1 rounded hover:bg-white/10 transition" style={{ color: "#A9B29C" }}>
                              <Pencil size={14} />
                            </button>
                            <ConfirmButton onConfirm={() => actions.removeTask(s.id, t.id)} label={`Delete task: ${t.title}`} />
                          </div>
                        ))}
                        {tasks.length === 0 && (
                          <p className="text-[12px]" style={{ color: "#6E7A64" }}>No care tasks yet.</p>
                        )}
                      </div>
                      <button onClick={() => setTaskModal({ speciesId: s.id, task: null })}
                        aria-label={`Add a care task for ${s.name}`}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px]"
                        style={{ border: "1px dashed #4A5540", color: "#A9B29C" }}>
                        <Plus size={13} aria-hidden="true" /> Add a care task
                      </button>

                      {/* the user's actual trees of this species */}
                      <h4 className="text-[11px] tracking-wide uppercase mt-4 mb-2" style={{ color: "#8A9483", fontFamily: "IBM Plex Mono, monospace" }}>My trees</h4>
                      <div className="space-y-1.5">
                        {trees.map((x) => (
                          <div key={x.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#1F2A1C" }}>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] truncate">{x.nickname}</div>
                              {(x.acquiredDate || x.notes) && (
                                <p className="text-[11px] mt-0.5" style={{ color: "#8A9483" }}>
                                  {x.acquiredDate && <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>since {fmtDate(new Date(x.acquiredDate))}</span>}
                                  {x.acquiredDate && x.notes && " · "}
                                  {x.notes}
                                </p>
                              )}
                            </div>
                            <button onClick={() => setSpecimenModal({ species: s, specimen: x })}
                              aria-label={`Edit tree: ${x.nickname}`} title="Edit"
                              className="p-1 rounded hover:bg-white/10 transition" style={{ color: "#A9B29C" }}>
                              <Pencil size={14} />
                            </button>
                            <ConfirmButton onConfirm={() => actions.removeSpecimen(x.id)} label={`Delete tree: ${x.nickname}`} />
                          </div>
                        ))}
                        {trees.length === 0 && (
                          <p className="text-[12px]" style={{ color: "#6E7A64" }}>None yet — track the actual trees on your bench.</p>
                        )}
                      </div>
                      <button onClick={() => setSpecimenModal({ species: s, specimen: null })}
                        aria-label={`Add one of your ${s.name} trees`}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px]"
                        style={{ border: "1px dashed #4A5540", color: "#A9B29C" }}>
                        <Plus size={13} aria-hidden="true" /> Add a tree
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddSpecies && (
        <AddSpeciesModal onClose={() => setShowAddSpecies(false)}
          onAdd={(list) => {
            const firstId = actions.addSpeciesBatch(list);
            setShowAddSpecies(false);
            if (firstId) setOpenId(firstId);
          }} />
      )}
      {editSpecies && (
        <EditSpeciesModal species={editSpecies} onClose={() => setEditSpecies(null)}
          onSave={(fields) => { actions.updateSpecies(editSpecies.id, fields); setEditSpecies(null); }} />
      )}
      {taskModal && (
        <TaskModal initial={taskModal.task} onClose={() => setTaskModal(null)}
          onSave={(task) => {
            if (taskModal.task) actions.updateTask(taskModal.speciesId, taskModal.task.id, task);
            else actions.addTask(taskModal.speciesId, task);
            setTaskModal(null);
          }} />
      )}
      {specimenModal && (
        <SpecimenModal initial={specimenModal.specimen} speciesName={specimenModal.species.name}
          onClose={() => setSpecimenModal(null)}
          onSave={(fields) => {
            if (specimenModal.specimen) actions.updateSpecimen(specimenModal.specimen.id, fields);
            else actions.addSpecimen(specimenModal.species.id, fields);
            setSpecimenModal(null);
          }} />
      )}
      {exportPayload && (
        <ExportModal title={exportPayload.title} text={exportPayload.text} onClose={() => setExportPayload(null)} />
      )}
    </>
  );
}
