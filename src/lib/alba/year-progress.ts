const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export type MonthProgress = {
  index: number;
  label: string;
  fill: number;
};

export type WeekProgress = {
  index: number;
  fill: number;
};

export type RemainingTime = {
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
};

export type YearProgress = {
  year: number;
  elapsedRatio: number;
  remainingRatio: number;
  months: MonthProgress[];
  weeks: WeekProgress[];
  remaining: RemainingTime;
};

function clamp01(n: number) {
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export function yearProgress(now = new Date()): YearProgress {
  const year = now.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const t = now.getTime();
  const span = end - start;
  const elapsedRatio = clamp01((t - start) / span);
  const remainingRatio = 1 - elapsedRatio;

  const months: MonthProgress[] = MONTH_LABELS.map((label, index) => {
    const monthStart = new Date(year, index, 1).getTime();
    const monthEnd = new Date(year, index + 1, 1).getTime();
    return {
      index,
      label,
      fill: clamp01((t - monthStart) / (monthEnd - monthStart)),
    };
  });

  const weekCount = Math.ceil(span / WEEK_MS);
  const weeks: WeekProgress[] = [];
  for (let i = 0; i < weekCount; i++) {
    const weekStart = start + i * WEEK_MS;
    const weekEnd = Math.min(weekStart + WEEK_MS, end);
    weeks.push({
      index: i,
      fill: clamp01((t - weekStart) / (weekEnd - weekStart)),
    });
  }

  const left = Math.max(0, end - t);

  return {
    year,
    elapsedRatio,
    remainingRatio,
    months,
    weeks,
    remaining: {
      weeks: Math.floor(left / WEEK_MS),
      days: Math.floor(left / DAY_MS),
      hours: Math.floor(left / HOUR_MS),
      minutes: Math.floor(left / MINUTE_MS),
    },
  };
}

export function formatPct(ratio: number, decimals = 4) {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

export function formatRemain(n: number) {
  return n.toLocaleString("es-DO");
}
