import { useEffect, useMemo, useState } from "react";
import { BottomSheet, CATEGORY_PALETTE, EmptyState, ScreenHeader } from "../components/shared";
import { IconPencil } from "../components/icons";
import { createCategory, deleteCategory, fetchCategories, updateCategory, type Category } from "../services/categoriesApi";
import { fetchTasks } from "../services/tasksApi";

interface Props { onBack: () => void; }

type Sheet = { kind: "form"; category: Category | null } | { kind: "delete"; category: Category };

const MAX_NAME = 50;

export default function CategoriesScreen({ onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskCounts, setTaskCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // La hoja conserva su contenido mientras anima la salida: se cierra con `open`, no vaciando `sheet`.
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setLoadError(null);
      setCategories(await fetchCategories());
      // Los conteos son informativos: si las tareas no cargan, la lista sigue funcionando.
      fetchTasks().then((tasks) => {
        const counts = new Map<string, number>();
        tasks.forEach((task) => { if (task.categoryId) counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1); });
        setTaskCounts(counts);
      }).catch(() => setTaskCounts(new Map()));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No fue posible cargar las categorías");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name, "es")), [categories]);

  function openForm(category: Category | null) {
    setSheet({ kind: "form", category });
    setName(category?.name ?? "");
    setColor(category?.color ?? CATEGORY_PALETTE[0]);
    setFormError(null);
    setOpen(true);
  }

  function openDelete(category: Category) {
    setSheet({ kind: "delete", category });
    setFormError(null);
    setOpen(true);
  }

  function closeSheet() {
    if (!saving) setOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sheet?.kind !== "form" || !name.trim() || saving) return;
    try {
      setSaving(true);
      setFormError(null);
      const existing = sheet.category;
      if (existing) {
        const updated = await updateCategory(existing.id, name.trim(), color);
        setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await createCategory(name.trim(), color);
        setCategories((current) => [...current, created]);
      }
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No fue posible guardar la categoría");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (sheet?.kind !== "delete" || saving) return;
    const target = sheet.category;
    try {
      setSaving(true);
      setFormError(null);
      await deleteCategory(target.id);
      setCategories((current) => current.filter((item) => item.id !== target.id));
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No fue posible eliminar la categoría");
    } finally {
      setSaving(false);
    }
  }

  const countLabel = (category: Category) => {
    const count = taskCounts.get(category.id) ?? 0;
    return count === 0 ? "Sin tareas" : `${count} ${count === 1 ? "tarea" : "tareas"}`;
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-paper">
      <ScreenHeader
        title="Categorías"
        subtitle="Cada una es una línea de tu red"
        onBack={onBack}
        right={<button onClick={() => openForm(null)} aria-label="Crear categoría" className="flex h-11 w-11 items-center justify-center rounded-md bg-coral text-[24px] font-semibold text-night">+</button>}
      />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8 lg:max-w-[760px] lg:px-8 lg:pt-6">
        {loadError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-danger-line bg-danger-wash px-3 py-2">
            <p className="text-[14px] font-semibold text-danger">{loadError}</p>
            <button onClick={load} className="min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Reintentar</button>
          </div>
        )}

        {loading ? (
          <p className="text-[14px] text-ink-2">Cargando categorías...</p>
        ) : sorted.length === 0 && !loadError ? (
          <EmptyState title="Aún no tienes categorías" sub="Agrupa tus tareas por materia, proyecto o ámbito de tu vida." action="Crear categoría" onAction={() => openForm(null)} />
        ) : (
          <ul className="overflow-hidden rounded-md border border-line bg-card">
            {sorted.map((category, index) => (
              <li key={category.id} className={`flex items-center gap-3 pl-4 pr-1 ${index > 0 ? "border-t border-line" : ""}`}>
                <span className="h-3 w-3 flex-shrink-0 rounded-[3px]" style={{ background: category.color }} aria-hidden="true" />
                <div className="min-w-0 flex-1 py-3">
                  <p className="truncate text-[16px] font-semibold text-ink">{category.name}</p>
                  <p className="num text-[13px] text-ink-2">{countLabel(category)}</p>
                </div>
                <button onClick={() => openForm(category)} aria-label={`Editar categoría ${category.name}`} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors active:bg-wash">
                  <IconPencil size={18} />
                </button>
                <button onClick={() => openDelete(category)} aria-label={`Eliminar categoría ${category.name}`} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors active:bg-wash">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12M9 7V5h6v2M9 10v7M12 10v7M15 10v7M7 7l1 12h8l1-12" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomSheet open={open} onClose={closeSheet} title={sheet?.kind === "delete" ? "Eliminar categoría" : sheet?.category ? "Editar categoría" : "Nueva categoría"}>
        {sheet?.kind === "form" && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-semibold text-ink">Nombre</span>
              <span className="flex items-center rounded-md border border-line bg-card px-3 py-3 transition-colors focus-within:border-coral">
                <input autoFocus value={name} maxLength={MAX_NAME} onChange={(event) => setName(event.target.value)} placeholder="Ej. Universidad" className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none" />
              </span>
            </label>
            <div>
              <p className="mb-1 text-[14px] font-semibold text-ink">Color de la línea</p>
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Color de la línea">
                {CATEGORY_PALETTE.map((option) => (
                  <button key={option} type="button" role="radio" aria-checked={color === option} aria-label={option} onClick={() => setColor(option)} className="flex h-11 w-11 items-center justify-center">
                    <span className="h-7 w-7 rounded-[4px] border-2" style={{ background: option, borderColor: color === option ? "var(--color-ink)" : "transparent" }} />
                  </button>
                ))}
              </div>
            </div>
            {formError && <p role="alert" className="text-[14px] font-semibold text-danger">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={closeSheet} disabled={saving} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={!name.trim() || saving} className="min-h-[48px] flex-1 rounded-md bg-coral text-[15px] font-semibold text-night disabled:opacity-50">{saving ? "Guardando..." : sheet.category ? "Guardar cambios" : "Crear categoría"}</button>
            </div>
          </form>
        )}

        {sheet?.kind === "delete" && (
          <div className="flex flex-col gap-4">
            <p className="text-[15px] leading-snug text-ink">
              ¿Eliminar <strong className="font-semibold">{sheet.category.name}</strong>?
              {(taskCounts.get(sheet.category.id) ?? 0) > 0
                ? ` Sus ${taskCounts.get(sheet.category.id)} tareas no se borran: quedarán sin categoría.`
                : " No tiene tareas asociadas."}
            </p>
            {formError && <p role="alert" className="text-[14px] font-semibold text-danger">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={closeSheet} disabled={saving} className="min-h-[48px] flex-1 rounded-md bg-wash text-[15px] font-semibold text-ink-2 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={confirmDelete} disabled={saving} className="min-h-[48px] flex-1 rounded-md bg-danger text-[15px] font-semibold text-white disabled:opacity-50">{saving ? "Eliminando..." : "Eliminar"}</button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
