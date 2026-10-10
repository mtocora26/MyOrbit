import { authHeaders } from "./authApi";
import { API_BASE_URL } from "./apiConfig";

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: "diaria" | "personalizada";
  daysOfWeek: number[];
  color: string;
  icon: string;
  completedDates: string[];
}

export interface CreateHabitInput {
  title: string;
  frequency: "diaria" | "personalizada";
  daysOfWeek: number[];
  color: string;
  icon: string;
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