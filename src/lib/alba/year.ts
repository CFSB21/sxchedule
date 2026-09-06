import { dataStart, type ScoreInput } from "./day-score";
import { fromDateKey } from "./time";
import type { StatsScope, YearGoal } from "./types";

export function yearRange(year: number, today: string) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const asOf = today < start ? start : today > end ? end : today;
  return { start, end, asOf };
}

export function statsWindow(
  scope: StatsScope,
  year: number,
  today: string,
  first: string,
) {
  if (scope === "all") {
    const startYear = fromDateKey(first < today ? first : today).getFullYear();
    const start = `${startYear}-01-01`;
    const nowYear = fromDateKey(today).getFullYear();
    return {
      start: first < start ? first : start,
      end: `${nowYear}-12-31`,
      asOf: today,
    };
  }
  return yearRange(year, today);
}

export function availableYears(
  today: string,
  first: string,
  goalYears: number[] = [],
) {
  const nowY = fromDateKey(today).getFullYear();
  let minY = fromDateKey(first).getFullYear();
  for (const y of goalYears) {
    if (Number.isInteger(y) && y >= 2000 && y < minY) minY = y;
  }
  if (minY > nowY) minY = nowY;
  const years: number[] = [];
  for (let y = nowY; y >= minY; y -= 1) years.push(y);
  return years;
}

export function yearsFromState(
  input: ScoreInput,
  goals: YearGoal[],
  today: string,
) {
  return availableYears(
    today,
    dataStart(input, today),
    goals.map((g) => g.year),
  );
}

export function resolveStatsYear(
  stored: number | undefined,
  years: number[],
  today: string,
) {
  if (stored && years.includes(stored)) return stored;
  const nowY = fromDateKey(today).getFullYear();
  if (years.includes(nowY)) return nowY;
  return years[0] ?? nowY;
}

export function resolveStatsScope(stored: StatsScope | undefined): StatsScope {
  return stored === "all" ? "all" : "year";
}
