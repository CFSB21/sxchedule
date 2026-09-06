import { dueWithOverrides } from "./overrides";
import { duePassives } from "./schedule";
import { isCompleteLineage, isPassiveComplete } from "./stats";
import { fromDateKey, toDateKey } from "./time";
import { todoProgress } from "./todos";
import type {
  Completion,
  DayOverride,
  Habit,
  PassiveCheck,
  PassiveHabit,
  TodoItem,
} from "./types";

export type DayTone = "ok" | "warn" | "fail";

export type DayScore = {
  date: string;
  total: number;
  done: number;
  missed: number;
  tone: DayTone | null;
  future: boolean;
};

export type ScoreInput = {
  habits: Habit[];
  completions: Completion[];
  passiveHabits: PassiveHabit[];
  passiveChecks: PassiveCheck[];
  todos: TodoItem[];
  dayOverrides: DayOverride[];
};

export function dataStart(input: ScoreInput, today: string) {
  let min: string | null = null;
  const consider = (date?: string) => {
    if (!date) return;
    if (min == null || date < min) min = date;
  };
  for (const c of input.completions) consider(c.date);
  for (const c of input.passiveChecks) consider(c.date);
  for (const t of input.todos) consider(t.date);
  return min ?? today;
}

export function dayScore(
  input: ScoreInput,
  dateKey: string,
  today: string,
  start?: string,
): DayScore {
  const future = dateKey > today;
  const from = start ?? dataStart(input, today);
  if (future || dateKey < from) {
    return { date: dateKey, total: 0, done: 0, missed: 0, tone: null, future };
  }
  const date = fromDateKey(dateKey);
  const routine = dueWithOverrides(
    input.habits,
    date,
    dateKey,
    input.dayOverrides,
  );
  const routineDone = routine.filter((h) =>
    isCompleteLineage(input.completions, input.habits, h, dateKey),
  ).length;
  const passives = duePassives(input.passiveHabits, dateKey);
  const passivesDone = passives.filter((h) =>
    isPassiveComplete(input.passiveChecks, h.id, dateKey),
  ).length;
  const todos = todoProgress(input.todos, dateKey);
  const total = routine.length + passives.length + todos.total;
  const done = routineDone + passivesDone + todos.done;
  const missed = Math.max(0, total - done);
  const tone: DayTone | null =
    total === 0 ? null : missed === 0 ? "ok" : missed === 1 ? "warn" : "fail";
  return { date: dateKey, total, done, missed, tone, future };
}

export function monthScores(
  input: ScoreInput,
  year: number,
  monthIndex: number,
  today: string,
) {
  const map = new Map<string, DayScore>();
  const start = dataStart(input, today);
  for (const key of monthCells(year, monthIndex)) {
    if (!key) continue;
    map.set(key, dayScore(input, key, today, start));
  }
  return map;
}

export function monthCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const firstDow = first.getDay();
  const lead = firstDow === 0 ? 6 : firstDow - 1;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) {
    cells.push(toDateKey(new Date(year, monthIndex, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function toneLabel(score: DayScore | undefined) {
  if (!score || score.future) return "Aún no";
  if (score.tone === "ok") return "Completo";
  if (score.tone === "warn") return "Casi";
  if (score.tone === "fail") return "Incompleto";
  return "Sin datos";
}
