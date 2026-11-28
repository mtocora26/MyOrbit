import type { UiTask } from "./tasksApi";

export interface WeekProgress {
  done: number;
  total: number;
}

/** Lunes a las 00:00 y lunes siguiente a las 00:00, en la hora del dispositivo. */
function weekBounds(now: Date): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { start, end };
}

/**
 * Cómo va la semana (lunes a domingo): hechas son las completadas en ella; el total suma las pendientes que vencen
 * hasta el domingo, incluidas las vencidas. Las pendientes sin fecha y las completadas sin fecha registrada no cuentan.
 */
export function weekProgress(tasks: UiTask[], now: Date = new Date()): WeekProgress {
  const { start, end } = weekBounds(now);
  let done = 0;
  let pending = 0;
  for (const task of tasks) {
    if (task.done) {
      const at = task.completedAt ? new Date(task.completedAt) : null;
      if (at && at >= start && at < end) done += 1;
    } else if (task.rawDue && new Date(task.rawDue) < end) {
      pending += 1;
    }
  }
  return { done, total: done + pending };
}
