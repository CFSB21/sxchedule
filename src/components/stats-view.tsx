import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthCalendar } from "@/components/month-calendar";
import {
  bestStreak,
  consistency,
  currentStreak,
  dayMinutes,
  lastNDays,
  minutesInRange,
  activeLineageRows,
} from "@/lib/alba/stats";
import { HABIT_ICONS } from "@/lib/alba/icons";
import { useRoutineStore } from "@/lib/alba/store";
import {
  formatMinutes,
  formatShortDate,
  formatWeekday,
  fromDateKey,
  shiftDateKey,
  todayKey,
} from "@/lib/alba/time";

export function StatsView() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const today = todayKey();
  const weekStart = shiftDateKey(today, -6);
  const monthStart = shiftDateKey(today, -29);

  const streak = currentStreak(habits, completions);
  const best = bestStreak(habits, completions);
  const rate30 = consistency(habits, completions, 30);
  const weekMin = minutesInRange(completions, weekStart, today);
  const monthMin = minutesInRange(completions, monthStart, today);

  const days = lastNDays(14);
  const chart = days.map((key) => {
    const d = fromDateKey(key);
    return {
      key,
      label: formatWeekday(d),
      minutes: dayMinutes(completions, key),
    };
  });

  const perHabit = activeLineageRows(habits, completions, 30).filter(
    (row) => row.habit,
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="alba-enter text-center">
        <h1 className="font-display text-3xl tracking-tight">Estadísticas</h1>
      </div>

      <MonthCalendar />

      <section className="alba-enter alba-enter-2 mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
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

      <section className="alba-enter alba-enter-3 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <h2 className="font-medium">Tiempo de los últimos 14 días</h2>
        <p className="text-xs text-muted-foreground">Minutos registrados</p>
        <div className="mt-4 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} barCategoryGap="22%">
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "var(--color-secondary)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const row = payload[0].payload as (typeof chart)[number];
                  return (
                    <div className="rounded-md bg-popover px-3 py-2 text-sm shadow-(--shadow-border)">
                      <p className="text-muted-foreground">
                        {formatShortDate(fromDateKey(row.key))}
                      </p>
                      <p className="tabular-nums font-medium">
                        {formatMinutes(row.minutes)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="minutes"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="alba-enter alba-enter-4 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <h2 className="font-medium">Por hábito</h2>
        <p className="text-xs text-muted-foreground">Consistencia a 30 días</p>
        {perHabit.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no hay hábitos que medir.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {perHabit.map(({ habit, rate, done, scheduled, minutes }) => {
              if (!habit) return null;
              const Icon = HABIT_ICONS[habit.icon];
              return (
                <li
                  key={habit.lineageId ?? habit.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{habit.name}</p>
                      <p className="text-sm tabular-nums">
                        {Math.round(rate * 100)}%
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(rate * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      {done}/{scheduled} · {formatMinutes(minutes)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
      <p className="mt-1 font-display text-2xl tabular-nums tracking-tight md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
