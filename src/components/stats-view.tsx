import { MonthCalendar } from "@/components/month-calendar";
import { GoalsTracker } from "@/components/goals-tracker";
import { TimeRanking } from "@/components/time-ranking";
import { HabitDays } from "@/components/habit-days";
import { ExcuseList } from "@/components/excuse-list";
import { useStatsYear } from "@/components/year-select";

export function StatsView() {
  const { scope, year } = useStatsYear();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="alba-enter text-center">
        <h1 className="font-display text-3xl tracking-tight">Estadísticas</h1>
      </div>

      <MonthCalendar key={`${scope}-${year}`} />

      <GoalsTracker />

      <TimeRanking />

      <HabitDays />

      <ExcuseList />
    </div>
  );
}
