import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  monthCells,
  toneLabel,
  yearScores,
  type DayScore,
  type DayTone,
} from "@/lib/alba/day-score";
import { useRoutineStore } from "@/lib/alba/store";
import {
  WEEK_LABELS_MON,
  formatLongDate,
  fromDateKey,
  todayKey,
} from "@/lib/alba/time";
import { MONTH_LABELS } from "@/lib/alba/year-progress";
import { cn } from "@/lib/utils";

const YEARS_BACK = 10;
const YEARS_FWD = 5;

function yearsAround(center: number) {
  return Array.from(
    { length: YEARS_BACK + YEARS_FWD + 1 },
    (_, i) => center - YEARS_BACK + i,
  );
}

export function YearCalendar() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const todos = useRoutineStore((s) => s.todos);
  const dayOverrides = useRoutineStore((s) => s.dayOverrides);
  const today = todayKey();
  const currentYear = fromDateKey(today).getFullYear();
  const years = useMemo(() => yearsAround(currentYear), [currentYear]);
  const [activeYear, setActiveYear] = useState(currentYear);
  const [selected, setSelected] = useState(today);
  const scroller = useRef<HTMLDivElement>(null);
  const ready = useRef(false);

  const input = useMemo(
    () => ({
      habits,
      completions,
      passiveHabits,
      passiveChecks,
      todos,
      dayOverrides,
    }),
    [
      habits,
      completions,
      passiveHabits,
      passiveChecks,
      todos,
      dayOverrides,
    ],
  );

  const scores = useMemo(() => {
    const map = new Map<string, DayScore>();
    for (const year of years) {
      for (const [key, score] of yearScores(input, year, today)) {
        map.set(key, score);
      }
    }
    return map;
  }, [input, years, today]);

  const selectedScore = scores.get(selected);

  function scrollToYear(year: number, smooth: boolean) {
    const el = scroller.current;
    if (!el) return;
    const idx = years.indexOf(year);
    if (idx < 0) return;
    el.scrollTo({
      left: idx * el.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
    setActiveYear(year);
  }

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const idx = years.indexOf(currentYear);
    if (idx < 0) return;
    el.scrollLeft = idx * el.clientWidth;
    ready.current = true;
  }, [currentYear, years]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    function align() {
      const node = scroller.current;
      if (!node || !node.clientWidth) return;
      const idx = years.indexOf(activeYear);
      if (idx < 0) return;
      node.scrollLeft = idx * node.clientWidth;
    }
    window.addEventListener("resize", align);
    return () => window.removeEventListener("resize", align);
  }, [activeYear, years]);

  function onScroll() {
    const el = scroller.current;
    if (!el || !ready.current || !el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    const year = years[idx];
    if (year != null && year !== activeYear) setActiveYear(year);
  }

  const canPrev = activeYear > years[0]!;
  const canNext = activeYear < years[years.length - 1]!;

  return (
    <section className="alba-enter alba-enter-1 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Año anterior"
          disabled={!canPrev}
          onClick={() => scrollToYear(activeYear - 1, true)}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <h2 className="font-display text-2xl tabular-nums tracking-tight">
            {activeYear}
          </h2>
          <p className="text-xs text-muted-foreground">Calendario del año</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Año siguiente"
          disabled={!canNext}
          onClick={() => scrollToYear(activeYear + 1, true)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <Legend tone="ok" label="Todo hecho" />
        <Legend tone="warn" label="Falta una" />
        <Legend tone="fail" label="Faltan más" />
      </ul>

      <div
        ref={scroller}
        className="alba-snap-x mt-5"
        onScroll={onScroll}
      >
        {years.map((year) => (
          <div key={year} className="alba-snap-page">
            <div className="grid grid-cols-3 gap-x-3 gap-y-5">
              {MONTH_LABELS.map((label, month) => (
                <MonthGrid
                  key={label}
                  year={year}
                  month={month}
                  label={label}
                  today={today}
                  selected={selected}
                  scores={scores}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-sm">
        <span className="font-medium">
          {formatLongDate(fromDateKey(selected))}
        </span>
        <span className="text-muted-foreground">
          {" · "}
          {selectedScore && selectedScore.total > 0
            ? `${selectedScore.done}/${selectedScore.total}`
            : "—"}
          {" · "}
          {toneLabel(selectedScore)}
        </span>
      </p>
    </section>
  );
}

function Legend({ tone, label }: { tone: DayTone; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className={cn(
          "size-2.5 rounded-xs",
          tone === "ok" && "bg-day-ok",
          tone === "warn" && "bg-day-warn",
          tone === "fail" && "bg-day-fail",
        )}
      />
      {label}
    </li>
  );
}

function MonthGrid({
  year,
  month,
  label,
  today,
  selected,
  scores,
  onSelect,
}: {
  year: number;
  month: number;
  label: string;
  today: string;
  selected: string;
  scores: Map<string, DayScore>;
  onSelect: (date: string) => void;
}) {
  const cells = monthCells(year, month);
  return (
    <div>
      <p className="mb-1.5 text-center text-xs font-medium">{label}</p>
      <div className="grid grid-cols-7">
        {WEEK_LABELS_MON.map((d) => (
          <span
            key={d}
            className="pb-0.5 text-center text-2xs text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {cells.map((key, i) => {
          if (!key) {
            return <span key={`e-${i}`} />;
          }
          const score = scores.get(key);
          const tone = score?.tone ?? null;
          const isToday = key === today;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              aria-label={`${fromDateKey(key).getDate()} ${label} ${toneLabel(score)}`}
              className={cn(
                "grid aspect-square place-items-center rounded-xs text-2xs tabular-nums leading-none",
                tone === "ok" && "bg-day-ok text-day-ok-fg",
                tone === "warn" && "bg-day-warn text-day-warn-fg",
                tone === "fail" && "bg-day-fail text-day-fail-fg",
                !tone && "text-muted-foreground",
                isToday && "ring-1 ring-primary ring-offset-1 ring-offset-card",
                isSelected && !isToday && "ring-1 ring-foreground/40",
              )}
            >
              {fromDateKey(key).getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
