import { readErrorMessage } from "./apiError";
import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

export type HabitType = "BUILD" | "QUIT";

/** Texto de la acción de marcar el día según el tipo del hábito. */
export function completeLabel(type: HabitType, done: boolean): string {
  if (type === "QUIT") return done ? "Desmarcar: hoy no lo evité" : "Hoy lo evité";
  return done ? "Desmarcar hoy" : "Completar hoy";
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: "diaria" | "personalizada";
  daysOfWeek: number[];
  color: string;
  icon: string;
  completedDates: string[];
  /** Meta de cumplimiento mensual en % (1-100); null = sin meta. */
  monthlyGoal: number | null;
  /** BUILD: por construir («lo hice»). QUIT: para dejar («hoy lo evité»). */
  type: HabitType;
}

export interface CreateHabitInput {
  title: string;
  frequency: "diaria" | "personalizada";
  daysOfWeek: number[];
  color: string;
  icon: string;
  /** 1-100 la fija; null en la creación = sin meta. */
  monthlyGoal?: number | null;
  type?: HabitType;
}

export function todayKey(): string {
  return toLocalKey(new Date());
}

export function toLocalKey(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export async function fetchHabits(): Promise<Habit[]> {
  const response = await fetch(`${API_BASE_URL}/api/habits`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`No fue posible cargar habitos (${response.status})`);
  return response.json();
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const response = await fetch(`${API_BASE_URL}/api/habits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("No fue posible crear el habito");
  return response.json();
}

export async function updateHabitCompletion(habitId: string, completed: boolean): Promise<Habit> {
  const response = await fetch(`${API_BASE_URL}/api/habits/${encodeURIComponent(habitId)}/completion`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ completed, date: todayKey() }),
  });
  if (!response.ok) throw new Error("No fue posible actualizar el habito");
  return response.json();
}

export async function deleteHabit(habitId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/habits/${encodeURIComponent(habitId)}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) throw new Error("No fue posible eliminar el habito");
}

export function currentStreak(completedDates: string[]): number {
  const completed = new Set(completedDates);
  let date = new Date();
  let streak = 0;
  while (completed.has(toLocalKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}
export type UpdateHabitInput = Partial<CreateHabitInput> & { title: string };

export async function updateHabit(id: string, input: UpdateHabitInput): Promise<Habit> {
  const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible editar el habito"));
  return response.json();
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  /** Porcentaje 0-100 con un decimal. */
  completionRate: number;
  scheduledDays: number;
  completedDays: number;
  windowDays: number;
}

export async function fetchHabitStats(id: string, days = 30): Promise<HabitStats> {
  const response = await fetch(`${API_BASE_URL}/api/habits/${id}/stats?days=${days}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar las estadísticas"));
  return response.json();
}

export interface MonthlyProgress {
  /** AAAA-MM */
  month: string;
  scheduledDays: number;
  completedDays: number;
  /** Mínimo de días cumplidos para aprobar el mes. */
  requiredDays: number;
  remainingToGoal: number;
  remainingDays: number;
  rate: number;
  approved: boolean;
  reachable: boolean;
}

export interface MonthlyGoal {
  goal: number;
  current: MonthlyProgress;
  /** Meses ya terminados, el más reciente primero. */
  history: MonthlyProgress[];
}

export async function fetchMonthlyGoal(id: string, months = 6): Promise<MonthlyGoal> {
  const response = await fetch(`${API_BASE_URL}/api/habits/${id}/monthly-goal?months=${months}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "No fue posible cargar la meta mensual"));
  return response.json();
}
