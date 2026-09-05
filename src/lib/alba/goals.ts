import { isActiveOn } from "./schedule";
import { isDoneCompletion } from "./stats";
import { fromDateKey, shiftDateKey } from "./time";
import type {
  Completion,
  Habit,
  PassiveCheck,
  PassiveHabit,
  YearGoal,
} from "./types";
import { yearRange } from "./year";

export function nameKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function uniqueNames(items: { name: string }[]) {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of items) {
    const trimmed = item.name.trim();
    const key = nameKey(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(trimmed);
  }
  return names;
}

export function normalizeGoal(goal: YearGoal, fallbackYear: number): YearGoal {
  const year =
    Number.isInteger(goal.year) && goal.year >= 2000 && goal.year <= 2100
      ? goal.year
      : fallbackYear;
  return {
    id: goal.id,
    kind: goal.kind === "days" ? "days" : "hours",
    name: goal.name.trim(),
    year,
    targetHours:
      goal.kind === "hours"
        ? Math.max(0.5, Number(goal.targetHours) || 1)
        : undefined,
  };
}

export type GoalProgress = {
  goal: YearGoal;
  done: number;
  total: number;
  matched: boolean;
};

export function progressForGoal(
  goal: YearGoal,
  input: {
    habits: Habit[];
    completions: Completion[];
    passiveHabits: PassiveHabit[];
    passiveChecks: PassiveCheck[];
  },
  today: string,
): GoalProgress {
  const window = yearRange(goal.year, today);
  const key = nameKey(goal.name);
  if (goal.kind === "hours") {
    const ids = new Set(
      input.habits.filter((h) => nameKey(h.name) === key).map((h) => h.id),
    );
    let minutes = 0;
    for (const c of input.completions) {
      if (!ids.has(c.habitId)) continue;
      if (!isDoneCompletion(c)) continue;
      if (c.date < window.start || c.date > window.asOf) continue;
      minutes += c.durationMin;
    }
    return {
      goal,
      done: minutes / 60,
      total: Math.max(0, goal.targetHours ?? 0),
      matched: ids.size > 0,
    };
  }

  const passives = input.passiveHabits.filter((h) => nameKey(h.name) === key);
  const checkDates = new Set(
    input.passiveChecks
      .filter((c) => passives.some((h) => h.id === c.habitId))
      .map((c) => c.date),
  );
  let scheduled = 0;
  let done = 0;
  let date = window.start;
  while (date <= window.end) {
    const due = passives.some(
      (h) =>
        h.days.includes(fromDateKey(date).getDay()) && isActiveOn(h, date),
    );
    if (due) {
      scheduled += 1;
      if (date <= window.asOf && checkDates.has(date)) done += 1;
    }
    date = shiftDateKey(date, 1);
  }
  return {
    goal,
    done,
    total: scheduled,
    matched: passives.length > 0,
  };
}

export function formatGoalDone(kind: YearGoal["kind"], value: number) {
  if (kind === "hours") {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
  }
  return `${Math.round(value)}`;
}

export function formatGoalTotal(kind: YearGoal["kind"], value: number) {
  if (kind === "hours") {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
  }
  return `${Math.round(value)}`;
}
