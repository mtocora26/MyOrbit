export interface TaskDueInput {
  date: string;
  time: string;
}

export function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function fromTaskDue(value: string): TaskDueInput {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? { date: match[1], time: match[2] } : { date: "", time: "" };
}

export function toTaskDue(date: string, time: string): string {
  if (!date) return "Sin fecha";
  return `${date}T${time || "23:59"}`;
}

export function formatTaskDue(value: string): string {
  const input = fromTaskDue(value);
  if (!input.date) return value || "Sin fecha";

  const due = new Date(`${input.date}T${input.time || "00:00"}`);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (first: Date, second: Date) => first.toDateString() === second.toDateString();
  const timeLabel = due.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

  if (sameDay(due, today)) return `Hoy · ${timeLabel}`;
  if (sameDay(due, tomorrow)) return `Mañana · ${timeLabel}`;
  return due.toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function isOverdue(value: string): boolean {
  const input = fromTaskDue(value);
  if (!input.date) return false;
  const due = new Date(`${input.date}T${input.time || "23:59"}`);
  return due.getTime() < Date.now();
}