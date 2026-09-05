import { fromDateKey, parseTimeToMinutes } from "./time";
import type { Completion, Habit } from "./types";

export type HabitPhase =
  | "idle"
  | "upcoming"
  | "running"
  | "awaiting"
  | "done"
  | "failed";

export function habitWindow(habit: Habit, dateKey: string) {
  if (!habit.scheduledTime) return null;
  const startMin = parseTimeToMinutes(habit.scheduledTime);
  const start = fromDateKey(dateKey);
  start.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  const end = new Date(start.getTime() + habit.durationMin * 60_000);
  return { start, end };
}

export function habitPhase(
  habit: Habit,
  dateKey: string,
  completion: Completion | undefined,
  now: Date | null,
  isToday: boolean,
): HabitPhase {
  if (completion?.status === "failed") return "failed";
  if (completion) return "done";
  const win = habitWindow(habit, dateKey);
  if (!win || !isToday || !now) return "idle";
  const t = now.getTime();
  if (t < win.start.getTime()) return "upcoming";
  if (t < win.end.getTime()) return "running";
  return "awaiting";
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
