import { habitsForDate } from "./stats";
import type { DayOverride, Habit } from "./types";

export function overrideFor(
  overrides: DayOverride[],
  habitId: string,
  date: string,
) {
  return overrides.find((o) => o.habitId === habitId && o.date === date);
}

export function resolveHabitForDate(
  habit: Habit,
  override: DayOverride | undefined,
): Habit | null {
  if (override?.skipped) return null;
  if (!override) return habit;
  return {
    ...habit,
    name: override.name ?? habit.name,
    scheduledTime:
      override.scheduledTime === undefined
        ? habit.scheduledTime
        : override.scheduledTime,
    durationMin: override.durationMin ?? habit.durationMin,
  };
}

export function dueWithOverrides(
  habits: Habit[],
  date: Date,
  dateKey: string,
  overrides: DayOverride[],
) {
  return habitsForDate(habits, date)
    .map((h) => resolveHabitForDate(h, overrideFor(overrides, h.id, dateKey)))
    .filter((h): h is Habit => h !== null);
}

export function hasDayOverride(override: DayOverride | undefined) {
  if (!override || override.skipped) return false;
  return (
    override.name !== undefined ||
    override.scheduledTime !== undefined ||
    override.durationMin !== undefined
  );
}
