import { dataStart } from "./day-score";
import { isActiveOn } from "./schedule";
import { isDoneCompletion } from "./stats";
import { fromDateKey, shiftDateKey } from "./time";
import type {
  Completion,
  Habit,
  PassiveCheck,
  PassiveHabit,
  StatsScope,
  YearGoal,
} from "./types";

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

export function goalWindow(
  scope: StatsScope,
  today: string,
  first: string,
) {
  const year = fromDateKey(today).getFullYear();
  if (scope === "year") {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      years: 1,
    };
  }
  const startYear = fromDateKey(first < today ? first : today).getFullYear();
  return {
    start: first < `${startYear}-01-01` ? first : `${startYear}-01-01`,
    end: `${year}-12-31`,
    years: Math.max(1, year - startYear + 1),
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
  scope: StatsScope,
  today: string,
): GoalProgress {
  const first = dataStart(
    {
      habits: input.habits,
      completions: input.completions,
      passiveHabits: input.passiveHabits,
      passiveChecks: input.passiveChecks,
      todos: [],
      dayOverrides: [],
    },
    today,
  );
  const window = goalWindow(scope, today, first);
  const key = nameKey(goal.name);
  if (goal.kind === "hours") {
    const ids = new Set(
      input.habits.filter((h) => nameKey(h.name) === key).map((h) => h.id),
    );
    let minutes = 0;
    for (const c of input.completions) {
      if (!ids.has(c.habitId)) continue;
      if (!isDoneCompletion(c)) continue;
      if (c.date < window.start || c.date > today) continue;
      if (c.date > window.end) continue;
      minutes += c.durationMin;
    }
    const target = Math.max(0, goal.targetHours ?? 0) * window.years;
    return {
      goal,
      done: minutes / 60,
      total: target,
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
      if (date <= today && checkDates.has(date)) done += 1;
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
