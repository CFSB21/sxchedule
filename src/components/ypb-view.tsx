import { useEffect, useState } from "react";
import {
  MONTH_LABELS,
  formatPct,
  formatRemain,
  yearProgress,
  type YearProgress,
} from "@/lib/alba/year-progress";
import { cn } from "@/lib/utils";

function emptyProgress(year: number): YearProgress {
  return {
    year,
    elapsedRatio: 0,
    remainingRatio: 1,
    months: MONTH_LABELS.map((label, index) => ({
      index,
      label,
      fill: 0,
    })),
    weeks: Array.from({ length: 53 }, (_, i) => ({ index: i, fill: 0 })),
    remaining: { weeks: 0, days: 0, hours: 0, minutes: 0 },
  };
}

function useNow(intervalMs = 200) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function polar(cx: number, cy: number, r: number, turn: number) {
  const a = (turn - 0.25) * Math.PI * 2;
  return {
    x: Math.round((cx + r * Math.cos(a)) * 1000) / 1000,
    y: Math.round((cy + r * Math.sin(a)) * 1000) / 1000,
  };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startTurn: number,
  endTurn: number,
) {
  const span = endTurn - startTurn;
  if (span <= 0.00008) return "";
  const s = polar(cx, cy, r, startTurn);
  const e = polar(cx, cy, r, endTurn);
  const large = span > 0.5 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function WeekRing({
  weeks,
  remainingLabel,
}: {
  weeks: { fill: number }[];
  remainingLabel: string;
}) {
  const size = 248;
  const stroke = 22;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const n = weeks.length;
  const gap = n > 0 ? Math.min(0.0045, 0.14 / n) : 0;
  const usable = 1 - n * gap;
  const slice = n > 0 ? usable / n : 0;

  return (
    <div className="relative mx-auto w-full max-w-56 sm:max-w-xs">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" aria-hidden>
        {weeks.map((week, i) => {
          const start = i * (slice + gap);
          const end = start + slice;
          const filled = start + slice * week.fill;
          return (
            <g key={i}>
              <path
                d={arcPath(cx, cy, r, start, end)}
                fill="none"
                className="stroke-secondary"
                strokeWidth={stroke}
                strokeLinecap="butt"
              />
              {week.fill > 0.002 ? (
                <path
                  d={arcPath(cx, cy, r, start, filled)}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-3xl tabular-nums tracking-tight">
            {remainingLabel}
          </p>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground">
            restante
          </p>
        </div>
      </div>
    </div>
  );
}

export function YpbView() {
  const now = useNow(200);
  const data = now
    ? yearProgress(now)
    : emptyProgress(new Date().getFullYear());
  const remainingBits = [
    { value: data.remaining.weeks, label: "Semanas" },
    { value: data.remaining.days, label: "Días" },
    { value: data.remaining.hours, label: "Horas" },
    { value: data.remaining.minutes, label: "Minutos" },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <div className="alba-enter">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Año en curso
        </p>
        <p className="mt-3 font-display text-2xl tracking-tight md:text-3xl">
          Year Progress Bar
        </p>
        <h1 className="mt-1 font-display text-4xl tracking-tight tabular-nums md:text-6xl">
          {data.year}
        </h1>
      </div>

      <section className="alba-enter alba-enter-1 mt-6 md:mt-8">
        <div className="flex h-10 gap-0.5 sm:h-12">
          {data.months.map((month) => (
            <div
              key={month.index}
              className={cn(
                "relative min-w-0 flex-1 overflow-hidden rounded-xs bg-secondary",
                month.fill > 0 && month.fill < 1 && "bg-accent",
              )}
              title={`${month.label} · ${formatPct(month.fill, 1)}`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{ width: `${month.fill * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-0.5">
          {data.months.map((month) => (
            <span
              key={month.label + month.index}
              className="flex min-w-0 flex-1 flex-col items-center text-[10px] font-medium leading-[1.15] text-muted-foreground sm:text-xs"
              aria-label={month.label}
            >
              {month.label.split("").map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
            </span>
          ))}
        </div>
        <p className="mt-5 font-display text-3xl tabular-nums tracking-tight">
          {formatPct(data.elapsedRatio, 6)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          del año transcurrido
        </p>
      </section>

      <section className="alba-enter alba-enter-2 mt-6 md:mt-10">
        <WeekRing
          weeks={data.weeks}
          remainingLabel={formatPct(data.remainingRatio, 6)}
        />
      </section>

      <section className="alba-enter alba-enter-3 mt-6 md:mt-8">
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Tiempo restante
        </p>
        <div className="grid grid-cols-4 gap-2">
          {remainingBits.map((bit) => (
            <div
              key={bit.label}
              className="rounded-lg bg-card px-1 py-4 text-center shadow-(--shadow-border) sm:px-2"
            >
              <p className="font-display text-lg tabular-nums leading-none tracking-tight sm:text-2xl md:text-3xl">
                {formatRemain(bit.value)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{bit.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
