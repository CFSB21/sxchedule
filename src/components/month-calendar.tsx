import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  monthCells,
  monthScores,
  type DayScore,
} from "@/lib/alba/day-score";
import { useRoutineStore } from "@/lib/alba/store";
import {
  WEEK_LABELS_MON,
  formatMonthYear,
  fromDateKey,
  todayKey,
} from "@/lib/alba/time";
import { cn } from "@/lib/utils";

const MONTHS_BACK = 24;
const MONTHS_FWD = 12;

type MonthRef = { year: number; month: number };

function monthsAround(center: MonthRef): MonthRef[] {
  const origin = center.year * 12 + center.month;
  return Array.from({ length: MONTHS_BACK + MONTHS_FWD + 1 }, (_, i) => {
    const value = origin - MONTHS_BACK + i;
    return { year: Math.floor(value / 12), month: value % 12 };
  });
}

function sameMonth(a: MonthRef, b: MonthRef) {
  return a.year === b.year && a.month === b.month;
}

export function MonthCalendar() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const todos = useRoutineStore((s) => s.todos);
  const dayOverrides = useRoutineStore((s) => s.dayOverrides);
  const today = todayKey();
  const todayDate = fromDateKey(today);
  const current: MonthRef = {
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  };
  const months = useMemo(() => monthsAround(current), [current.year, current.month]);
  const [active, setActive] = useState<MonthRef>(current);
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
    for (const item of months) {
      for (const [key, score] of monthScores(input, item.year, item.month, today)) {
        map.set(key, score);
      }
    }
    return map;
  }, [input, months, today]);

  function scrollToMonth(target: MonthRef, smooth: boolean) {
    const el = scroller.current;
    if (!el) return;
    const idx = months.findIndex((m) => sameMonth(m, target));
    if (idx < 0) return;
    el.scrollTo({
      left: idx * el.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
    setActive(target);
  }

  function shiftMonth(delta: number) {
    const value = active.year * 12 + active.month + delta;
    scrollToMonth(
      { year: Math.floor(value / 12), month: value % 12 },
      true,
    );
  }

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const idx = months.findIndex((m) => sameMonth(m, current));
    if (idx < 0) return;
    el.scrollLeft = idx * el.clientWidth;
    ready.current = true;
  }, [current.year, current.month, months]);

  useEffect(() => {
    function align() {
      const node = scroller.current;
      if (!node || !node.clientWidth) return;
      const idx = months.findIndex((m) => sameMonth(m, active));
      if (idx < 0) return;
      node.scrollLeft = idx * node.clientWidth;
    }
    window.addEventListener("resize", align);
    return () => window.removeEventListener("resize", align);
  }, [active, months]);

  function onScroll() {
    const el = scroller.current;
    if (!el || !ready.current || !el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    const next = months[idx];
    if (next && !sameMonth(next, active)) setActive(next);
  }

  const canPrev = !sameMonth(active, months[0]!);
  const canNext = !sameMonth(active, months[months.length - 1]!);
  const heading = formatMonthYear(new Date(active.year, active.month, 1));

  return (
    <section className="alba-enter alba-enter-1 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mes anterior"
          disabled={!canPrev}
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 text-center font-display text-2xl tracking-tight">
          {heading}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mes siguiente"
          disabled={!canNext}
          onClick={() => shiftMonth(1)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div ref={scroller} className="alba-snap-x mt-4" onScroll={onScroll}>
        {months.map((item) => (
          <div
            key={`${item.year}-${item.month}`}
            className="alba-snap-page"
          >
            <MonthGrid
              year={item.year}
              month={item.month}
              today={today}
              selected={selected}
              scores={scores}
              onSelect={setSelected}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function MonthGrid({
  year,
  month,
  today,
  selected,
  scores,
  onSelect,
}: {
  year: number;
  month: number;
  today: string;
  selected: string;
  scores: Map<string, DayScore>;
  onSelect: (date: string) => void;
}) {
  const cells = monthCells(year, month);
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEK_LABELS_MON.map((d) => (
        <span
          key={d}
          className="pb-1 text-center text-xs text-muted-foreground"
        >
          {d}
        </span>
      ))}
      {cells.map((key, i) => {
        if (!key) {
          return <span key={`e-${i}`} className="min-h-11" />;
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
            aria-label={`${fromDateKey(key).getDate()} de ${formatMonthYear(fromDateKey(key))}`}
            className={cn(
              "grid min-h-11 place-items-center rounded-sm text-sm tabular-nums leading-none",
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
  );
}
