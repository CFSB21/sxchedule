import type { Completion, Habit } from "./types";
import { fromDateKey, shiftDateKey, toDateKey, todayKey } from "./time";

export function habitsForDate(habits: Habit[], date: Date) {
  const dow = date.getDay();
  return habits
    .filter((h) => h.days.includes(dow))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? "");
    });
}

export function isComplete(
  completions: Completion[],
  habitId: string,
  date: string,
) {
  return completions.some((c) => c.habitId === habitId && c.date === date);
}

export function completionFor(
  completions: Completion[],
  habitId: string,
  date: string,
) {
  return completions.find((c) => c.habitId === habitId && c.date === date);
}

export function dayRate(
  habits: Habit[],
  completions: Completion[],
  dateKey: string,
) {
  const due = habitsForDate(habits, fromDateKey(dateKey));
  if (due.length === 0) return null;
  const done = due.filter((h) => isComplete(completions, h.id, dateKey)).length;
  return done / due.length;
}

export function dayMinutes(
  completions: Completion[],
  dateKey: string,
  habitIds?: Set<string>,
) {
  return completions
    .filter(
      (c) => c.date === dateKey && (!habitIds || habitIds.has(c.habitId)),
    )
    .reduce((sum, c) => sum + c.durationMin, 0);
}

export function isDayComplete(
  habits: Habit[],
  completions: Completion[],
  dateKey: string,
) {
  const rate = dayRate(habits, completions, dateKey);
  return rate !== null && rate >= 1;
}

export function currentStreak(
  habits: Habit[],
  completions: Completion[],
  now = new Date(),
) {
  const today = todayKey(now);
  let key = isDayComplete(habits, completions, today)
    ? today
    : shiftDateKey(today, -1);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const rate = dayRate(habits, completions, key);
    if (rate === null) {
      key = shiftDateKey(key, -1);
      continue;
    }
    if (rate < 1) break;
    streak += 1;
    key = shiftDateKey(key, -1);
  }
  return streak;
}

export function bestStreak(habits: Habit[], completions: Completion[]) {
  if (habits.length === 0) return 0;
  const dates = new Set(completions.map((c) => c.date));
  if (dates.size === 0) return 0;
  const sorted = [...dates].sort();
  const start = sorted[0]!;
  const end = todayKey();
  let best = 0;
  let cur = 0;
  let key = start;
  while (key <= end) {
    const rate = dayRate(habits, completions, key);
    if (rate === null) {
      key = shiftDateKey(key, 1);
      continue;
    }
    if (rate >= 1) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
    key = shiftDateKey(key, 1);
  }
  return best;
}

export function consistency(
  habits: Habit[],
  completions: Completion[],
  days: number,
  now = new Date(),
) {
  let scheduled = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = toDateKey(date);
    const due = habitsForDate(habits, date);
    scheduled += due.length;
    done += due.filter((h) => isComplete(completions, h.id, key)).length;
  }
  if (scheduled === 0) return 0;
  return done / scheduled;
}

export function minutesInRange(
  completions: Completion[],
  startKey: string,
  endKey: string,
) {
  return completions
    .filter((c) => c.date >= startKey && c.date <= endKey)
    .reduce((sum, c) => sum + c.durationMin, 0);
}

export function lastNDays(n: number, now = new Date()) {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

export function habitConsistency(
  habit: Habit,
  completions: Completion[],
  days: number,
  now = new Date(),
) {
  let scheduled = 0;
  let done = 0;
  let minutes = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    if (!habit.days.includes(date.getDay())) continue;
    scheduled += 1;
    const key = toDateKey(date);
    const c = completionFor(completions, habit.id, key);
    if (c) {
      done += 1;
      minutes += c.durationMin;
    }
  }
  return {
    scheduled,
    done,
    minutes,
    rate: scheduled === 0 ? 0 : done / scheduled,
  };
}

export function heatmapCells(
  habits: Habit[],
  completions: Completion[],
  weeks = 16,
  now = new Date(),
) {
  const today = toDateKey(now);
  const end = fromDateKey(today);
  const weekday = end.getDay();
  const total = weeks * 7;
  const startOffset = total - 1 - (6 - weekday);
  const cells: { date: string; rate: number | null; future: boolean }[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(end);
    d.setDate(end.getDate() - startOffset + i);
    const key = toDateKey(d);
    cells.push({
      date: key,
      rate: dayRate(habits, completions, key),
      future: key > today,
    });
  }
  return cells;
}
