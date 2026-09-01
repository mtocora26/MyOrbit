import { useEffect, useMemo, useState } from "react";
import { ScreenHeader, Badge, CategoryBadge, CategoryPicker, Checkbox, ProgressBar } from "../components/shared";
import { IconCalendar } from "../components/icons";
import { createSubtask, deleteSubtask, fetchTaskById, getSubtaskProgress, toUiTask, updateSubtaskDue, updateSubtaskStatus, updateTask, updateTaskStatus, type Subtask, type TaskPriority, type TaskTag, type UiTask } from "../services/tasksApi";
import { formatTaskDue, fromTaskDue, isOverdue, toTaskDue } from "../services/taskDue";
import { createCategory, fetchCategories, type Category } from "../services/categoriesApi";

interface Props { onBack: () => void; taskId: string | null; }

const PRIORITY_BADGE: Record<UiTask["priority"], { label: string; color: "coral" | "yellow" | "green" }> = {
  alta: { label: "Alta prioridad", color: "coral" },
  media: { label: "Media prioridad", color: "yellow" },
  baja: { label: "Baja prioridad", color: "green" },
};

export default function TaskDetailScreen({ onBack, taskId }: Props) {
  const [task, setTask] = useState<UiTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [draftPriority, setDraftPriority] = useState<TaskPriority>("media");
  const [draftTag, setDraftTag] = useState<TaskTag>("Personal");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDate, setNewSubtaskDate] = useState("");
  const [newSubtaskTime, setNewSubtaskTime] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  async function handleCreateCategory(name: string, color: string) {
    const category = await createCategory(name, color);
    setCategories((current) => [...current, category]);
    setDraftTag(category.name);
  }

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      if (!taskId) {
        setTask(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const apiTask = await fetchTaskById(taskId);
        if (!ignore) {
          const mapped = toUiTask(apiTask);
          setTask(mapped);
          setDraftTitle(mapped.label);
          const dueInput = fromTaskDue(mapped.rawDue);
          setDraftDate(dueInput.date);
          setDraftTime(dueInput.time);
          setDraftPriority(mapped.priority);
          setDraftTag(mapped.tag);
          setEditing(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "No fue posible cargar el detalle de la tarea");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [taskId]);

  const progress = useMemo(() => {
    if (!task) return 0;
    if (task.subtasks.length) return getSubtaskProgress(task.subtasks).percentage;
    return task.done ? 100 : 0;
  }, [task]);

  const overdue = task ? !task.done && isOverdue(task.rawDue) : false;

  async function handleAddSubtask(title = newSubtaskTitle, parentSubtaskId?: string, due?: string) {
    if (!task || !title.trim() || saving) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await createSubtask(task.id, title.trim(), due, parentSubtaskId);
      setTask(toUiTask(updated));
      if (!parentSubtaskId) {
        setNewSubtaskTitle("");
        setNewSubtaskDate("");
        setNewSubtaskTime("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear la subtarea");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSubtask(subtaskId: string, done: boolean) {
    if (!task || saving) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateSubtaskStatus(task.id, subtaskId, !done);
      setTask(toUiTask(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar la subtarea");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubtask(subtaskId: string) {
    if (!task || saving) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await deleteSubtask(task.id, subtaskId);
      setTask(toUiTask(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible eliminar la subtarea");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSubtaskDue(subtaskId: string, due: string | undefined) {
    if (!task || saving) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateSubtaskDue(task.id, subtaskId, "", due);
      setTask(toUiTask(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar la fecha de la subtarea");
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameSubtask(subtaskId: string, title: string, due: string | undefined) {
    const trimmed = title.trim();
    if (!task || saving || !trimmed) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateSubtaskDue(task.id, subtaskId, trimmed, due);
      setTask(toUiTask(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible renombrar el paso");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCompleted() {
    if (!task || saving) return;
    if (task.subtasks.length > 0) {
      setError("Completa o modifica las subtareas para actualizar el estado de esta tarea");
      return;
    }

    const previous = task;
    const nextDone = !task.done;
    setTask({ ...task, done: nextDone });

    try {
      setSaving(true);
      setError(null);
      await updateTaskStatus(task.id, nextDone);
    } catch (err) {
      setTask(previous);
      setError(err instanceof Error ? err.message : "No fue posible actualizar la tarea");
    } finally {
      setSaving(false);
    }
  }

  function openEditMode() {
    if (!task) return;
    setDraftTitle(task.label);
    const dueInput = fromTaskDue(task.rawDue);
    setDraftDate(dueInput.date);
    setDraftTime(dueInput.time);
    setDraftPriority(task.priority);
    setDraftTag(task.tag);
    setEditing(true);
  }

  function cancelEditMode() {
    setEditing(false);
    setError(null);
  }

  async function commitQuickRename() {
    setRenamingTitle(false);
    const title = quickTitle.trim();
    if (!task || saving || !title || title === task.label) return;

    const previous = task;
    setTask({ ...task, label: title });

    try {
      setSaving(true);
      setError(null);
      const updated = await updateTask(task.id, { title, due: task.rawDue, priority: task.priority, tag: task.tag });
      setTask(toUiTask(updated));
    } catch (err) {
      setTask(previous);
      setError(err instanceof Error ? err.message : "No fue posible renombrar la tarea");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTask() {
    if (!task || saving) return;
    const title = draftTitle.trim();
    const due = draftDate ? toTaskDue(draftDate, draftTime) : task.rawDue || "Sin fecha";

    if (!title) {
      setError("El titulo de la tarea no puede estar vacio");
      return;
    }

    const previous = task;
    const optimistic: UiTask = {
      ...task,
      label: title,
      due: formatTaskDue(due),
      rawDue: due,
      priority: draftPriority,
      tag: draftTag,
    };
    setTask(optimistic);

    try {
      setSaving(true);
      setError(null);
      const updated = await updateTask(task.id, {
        title,
        due,
        priority: draftPriority,
        tag: draftTag,
      });
      setTask(toUiTask(updated));
      setEditing(false);
    } catch (err) {
      setTask(previous);
      setError(err instanceof Error ? err.message : "No fue posible guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <ScreenHeader
        title="Detalle de tarea"
        onBack={onBack}
        right={
          <button
            onClick={editing ? cancelEditMode : openEditMode}
            className="w-9 h-9 rounded-full bg-[#F2F4F7] flex items-center justify-center"
            title={editing ? "Cancelar edicion" : "Editar tarea"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-28 flex flex-col gap-3">
        {loading && <p className="text-[13px] text-[#667085]">Cargando detalle...</p>}
        {error && <p className="text-[12px] font-semibold text-[#B42318]">{error}</p>}

        {!loading && !task && !error && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
            <p className="text-[14px] text-[#667085]">Selecciona una tarea desde la lista para ver su detalle.</p>
          </div>
        )}

        {task && (
          <>
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: task.priority === "alta" ? "#FF6B4A" : task.priority === "media" ? "#F79009" : "#12B76A" }} />
                <Badge label={PRIORITY_BADGE[task.priority].label} color={PRIORITY_BADGE[task.priority].color} />
                <CategoryBadge name={task.tag} color={categories.find((category) => category.name === task.tag)?.color} />
              </div>

              {editing ? (
                <div className="flex flex-col gap-3">
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Titulo de la tarea"
                    className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[14px] font-semibold text-[#172033] outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={draftDate}
                      onChange={(e) => setDraftDate(e.target.value)}
                      aria-label="Fecha límite"
                      className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] text-[#172033] outline-none"
                    />
                    <input
                      type="time"
                      value={draftTime}
                      onChange={(e) => setDraftTime(e.target.value)}
                      aria-label="Hora límite"
                      className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] text-[#172033] outline-none"
                    />
                    <select
                      value={draftPriority}
                      onChange={(e) => setDraftPriority(e.target.value as TaskPriority)}
                      className="col-span-2 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] text-[#172033] outline-none"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                    <CategoryPicker categories={categories} value={draftTag} onChange={setDraftTag} onCreate={handleCreateCategory} className="col-span-2" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTask}
                      disabled={saving}
                      className="rounded-xl px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50"
                      style={{ background: "#FF6B4A" }}
                    >
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                    <button
                      onClick={cancelEditMode}
                      disabled={saving}
                      className="rounded-xl px-3 py-2 text-[12px] font-bold text-[#667085] bg-[#F2F4F7] disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : renamingTitle ? (
                <input
                  autoFocus
                  value={quickTitle}
                  onChange={(event) => setQuickTitle(event.target.value)}
                  onBlur={commitQuickRename}
                  onKeyDown={(event) => { if (event.key === "Enter") commitQuickRename(); if (event.key === "Escape") setRenamingTitle(false); }}
                  className="w-full rounded-lg border border-[#FF6B4A] bg-white px-2 py-1 text-[18px] font-extrabold text-[#172033] outline-none"
                />
              ) : (
                <h2
                  onDoubleClick={() => { setQuickTitle(task.label); setRenamingTitle(true); }}
                  title="Doble clic para renombrar"
                  className="text-[18px] font-extrabold text-[#172033] leading-snug cursor-text"
                >
                  {task.label}
                </h2>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
              <div className="grid grid-cols-2 gap-4">
                <MetaField icon={<IconCalendar size={13} color={overdue ? "#B42318" : "#94A3B8"} />} label="Fecha limite" value={task.due} valueClassName={overdue ? "text-[#B42318]" : undefined} />
                <MetaField icon={<StatusIcon />} label="Estado" value={task.done ? "Completada" : overdue ? "Vencida" : "En progreso"} valueClassName={overdue && !task.done ? "text-[#B42318]" : undefined} />
                <MetaField icon={<FolderIcon />} label="Categoria" value={task.tag} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[14px] font-bold text-[#172033]">Progreso</p>
                <span className="text-[14px] font-extrabold text-[#FF6B4A] tabular-nums">{progress}%</span>
              </div>
              <ProgressBar value={progress} color="#FF6B4A" height={8} bg="#FFF0EC" />
              <p className="text-[12px] text-[#94A3B8] mt-2">
                {task.subtasks.length ? `${getSubtaskProgress(task.subtasks).completed} de ${getSubtaskProgress(task.subtasks).total} pasos completados` : task.done ? "La tarea esta completa" : "La tarea aun esta pendiente"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}>
              <div className="flex items-center justify-between gap-3"><div><p className="text-[14px] font-bold text-[#172033]">Subtareas</p><p className="mt-0.5 text-[12px] text-[#94A3B8]">Cada paso puede contener otros pasos.</p></div><span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-[11px] font-bold text-[#667085]">{getSubtaskProgress(task.subtasks).completed}/{getSubtaskProgress(task.subtasks).total}</span></div>
              <div className="mt-4 flex flex-col gap-2">
                {task.subtasks.map((subtask) => <SubtaskItem key={subtask.id} subtask={subtask} depth={0} saving={saving} onToggle={handleToggleSubtask} onDelete={handleDeleteSubtask} onAddChild={handleAddSubtask} onUpdateDue={handleUpdateSubtaskDue} onRename={handleRenameSubtask} />)}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input value={newSubtaskTitle} onChange={(event) => setNewSubtaskTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleAddSubtask(newSubtaskTitle, undefined, newSubtaskDate ? toTaskDue(newSubtaskDate, newSubtaskTime) : undefined); }} placeholder="Añadir un paso" className="min-w-0 flex-1 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[13px] outline-none focus:border-[#FF6B4A]" />
                  <button onClick={() => handleAddSubtask(newSubtaskTitle, undefined, newSubtaskDate ? toTaskDue(newSubtaskDate, newSubtaskTime) : undefined)} disabled={saving || !newSubtaskTitle.trim()} className="rounded-xl bg-[#172033] px-3 text-[13px] font-bold text-white disabled:opacity-50">Añadir</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={newSubtaskDate} onChange={(event) => setNewSubtaskDate(event.target.value)} aria-label="Fecha del paso" className="min-w-0 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[12px] text-[#172033] outline-none" />
                  <input type="time" value={newSubtaskTime} onChange={(event) => setNewSubtaskTime(event.target.value)} aria-label="Hora del paso" className="min-w-0 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2 text-[12px] text-[#172033] outline-none" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-[#F2F4F7]" style={{ boxShadow: "0 -4px 20px rgba(16,24,40,0.08)" }}>
        <button
          onClick={handleToggleCompleted}
          disabled={!task || saving || editing || (task?.subtasks.length ?? 0) > 0}
          className="w-full py-3.5 rounded-2xl text-[15px] font-extrabold text-white transition-transform active:scale-[0.98]"
          style={{
            background: !task
              ? "#D0D5DD"
              : editing
                ? "#D0D5DD"
                : task.subtasks.length > 0
                  ? "#D0D5DD"
              : task.done
                ? "linear-gradient(135deg, #12B76A 0%, #17C47D 100%)"
                : "linear-gradient(135deg, #FF6B4A 0%, #FF8B6E 100%)",
            boxShadow: !task ? "none" : "0 6px 20px rgba(255,107,74,0.35)",
          }}
        >
          {!task
            ? "Sin tarea seleccionada"
            : editing
              ? "Termina la edicion para cambiar estado"
              : task.subtasks.length > 0
                ? `${task.subtasks.filter((subtask) => subtask.done).length}/${task.subtasks.length} subtareas completadas`
              : saving
                ? "Guardando..."
                : task.done
                  ? "Marcar como pendiente"
                  : "Marcar como completada"}
        </button>
      </div>
    </div>
  );
}

function MetaField({ icon, label, value, valueClassName }: { icon: React.ReactNode; label: string; value: string; valueClassName?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">{icon}<p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wider">{label}</p></div>
      <p className={`text-[12px] font-bold ${valueClassName ?? "text-[#172033]"}`}>{value}</p>
    </div>
  );
}

function SubtaskItem({ subtask, depth, saving, onToggle, onDelete, onAddChild, onUpdateDue, onRename }: { subtask: Subtask; depth: number; saving: boolean; onToggle: (id: string, done: boolean) => void; onDelete: (id: string) => void; onAddChild: (title: string, parentId: string, due?: string) => Promise<void>; onUpdateDue: (id: string, due: string | undefined) => Promise<void>; onRename: (id: string, title: string, due: string | undefined) => Promise<void> }) {
  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [editingDue, setEditingDue] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(subtask.title);
  const dueInput = fromTaskDue(subtask.due ?? "");
  const [dueDate, setDueDate] = useState(dueInput.date);
  const [dueTime, setDueTime] = useState(dueInput.time);
  const children = subtask.subtasks ?? [];
  const overdue = !subtask.done && subtask.due ? isOverdue(subtask.due) : false;

  async function addChild() {
    if (!childTitle.trim()) return;
    await onAddChild(childTitle, subtask.id);
    setChildTitle("");
    setAddingChild(false);
  }

  async function commitRename() {
    setRenaming(false);
    if (draftTitle.trim() && draftTitle.trim() !== subtask.title) {
      await onRename(subtask.id, draftTitle, subtask.due);
    }
  }

  function openDueEditor() {
    const current = fromTaskDue(subtask.due ?? "");
    setDueDate(current.date);
    setDueTime(current.time);
    setEditingDue(true);
  }

  async function saveDue() {
    await onUpdateDue(subtask.id, dueDate ? toTaskDue(dueDate, dueTime) : undefined);
    setEditingDue(false);
  }

  return (
    <div className="flex flex-col gap-2" style={{ marginLeft: depth ? Math.min(depth * 14, 42) : 0 }}>
      <div className="flex flex-col gap-1.5 rounded-xl bg-[#F7F8FA] px-3 py-2.5">
        <div className="flex items-center gap-3">
          <Checkbox checked={subtask.done} onChange={() => onToggle(subtask.id, subtask.done)} />
          {renaming ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => { if (event.key === "Enter") commitRename(); if (event.key === "Escape") { setDraftTitle(subtask.title); setRenaming(false); } }}
              className="min-w-0 flex-1 rounded-lg border border-[#2E90FA] bg-white px-2 py-1 text-[13px] font-semibold text-[#344054] outline-none"
            />
          ) : (
            <p
              onDoubleClick={() => { setDraftTitle(subtask.title); setRenaming(true); }}
              title="Doble clic para renombrar"
              className={`min-w-0 flex-1 text-[13px] font-semibold ${subtask.done ? "text-[#98A2B3] line-through" : "text-[#344054]"}`}
            >
              {subtask.title}
            </p>
          )}
          <button onClick={() => setAddingChild(!addingChild)} disabled={saving} title="Añadir subpaso" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[18px] font-semibold text-[#2E90FA] hover:bg-[#EFF8FF]">+</button>
          <button onClick={() => onDelete(subtask.id)} disabled={saving} title="Eliminar subtarea" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#B42318] hover:bg-[#FEF3F2]">×</button>
        </div>
        <button onClick={openDueEditor} disabled={saving} className={`ml-8 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${overdue ? "bg-[#FEF3F2] text-[#B42318]" : subtask.due ? "bg-[#EFF8FF] text-[#2E90FA]" : "bg-[#F2F4F7] text-[#98A2B3]"}`}>
          <IconCalendar size={10} color={overdue ? "#B42318" : subtask.due ? "#2E90FA" : "#98A2B3"} />
          {subtask.due ? formatTaskDue(subtask.due) : "Sin fecha"}
        </button>
      </div>
      {editingDue && (
        <div className="ml-8 flex gap-2">
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#E4E7EC] bg-white px-3 py-2 text-[12px] outline-none" />
          <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#E4E7EC] bg-white px-3 py-2 text-[12px] outline-none" />
          <button onClick={saveDue} disabled={saving} className="rounded-xl bg-[#2E90FA] px-3 text-[12px] font-bold text-white disabled:opacity-50">Guardar</button>
          <button onClick={() => setEditingDue(false)} disabled={saving} className="rounded-xl bg-[#F2F4F7] px-3 text-[12px] font-bold text-[#667085]">Cancelar</button>
        </div>
      )}
      {addingChild && <div className="ml-8 flex gap-2"><input value={childTitle} onChange={(event) => setChildTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addChild(); }} autoFocus placeholder="Añadir subpaso" className="min-w-0 flex-1 rounded-xl border border-[#E4E7EC] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#2E90FA]" /><button onClick={addChild} disabled={saving || !childTitle.trim()} className="rounded-xl bg-[#2E90FA] px-3 text-[12px] font-bold text-white disabled:opacity-50">Añadir</button></div>}
      {children.map((child) => <SubtaskItem key={child.id} subtask={child} depth={depth + 1} saving={saving} onToggle={onToggle} onDelete={onDelete} onAddChild={onAddChild} onUpdateDue={onUpdateDue} onRename={onRename} />)}
    </div>
  );
}

function FolderIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
}
function StatusIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>;
}
