import { MonthCalendar } from "@/components/month-calendar";
import { GoalsTracker } from "@/components/goals-tracker";
import { TimeRanking } from "@/components/time-ranking";
import { HabitDays } from "@/components/habit-days";
import { ExcuseList } from "@/components/excuse-list";
import { useStatsYear } from "@/components/year-select";
import {
  bestStreak,
  consistency,
  currentStreak,
  minutesInRange,
} from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";
import { formatMinutes, fromDateKey, shiftDateKey } from "@/lib/alba/time";

export function StatsView() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const { scope, year, today, range } = useStatsYear();
  const { start, asOf } = range;
  const asOfDate = fromDateKey(asOf);
  const weekStart = shiftDateKey(asOf, -6);
  const monthStart = shiftDateKey(asOf, -29);
  const weekFrom = weekStart < start ? start : weekStart;
  const monthFrom = monthStart < start ? start : monthStart;

  const streak = currentStreak(habits, completions, asOfDate);
  const best = bestStreak(habits, completions, asOfDate);
  const rate30 = consistency(habits, completions, 30, asOfDate);
  const weekMin = minutesInRange(completions, weekFrom, asOf);
  const monthMin = minutesInRange(completions, monthFrom, asOf);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="alba-enter text-center">
        <h1 className="font-display text-3xl tracking-tight">Estadísticas</h1>
      </div>

      <MonthCalendar key={`${scope}-${year}`} />

      <GoalsTracker />

      <section className="alba-enter alba-enter-3 mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Racha" value={`${streak}`} hint={`Mejor ${best}`} />
        <Kpi
          label="Consistencia"
          value={`${Math.round(rate30 * 100)}%`}
          hint="Últimos 30 días"
        />
        <Kpi
          label="Esta semana"
          value={formatMinutes(weekMin)}
          hint="Tiempo dedicado"
        />
        <Kpi
          label="Este mes"
          value={formatMinutes(monthMin)}
          hint="Últimos 30 días"
        />
      </section>

      <TimeRanking />

      <HabitDays />

      <ExcuseList />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-(--shadow-border)">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl tabular-nums tracking-tight whitespace-nowrap md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
