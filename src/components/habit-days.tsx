import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { StatRow } from "@/components/stat-row";
import { useStatsYear } from "@/components/year-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HABIT_ICONS } from "@/lib/alba/icons";
import { habitDayRanking } from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";

export function HabitDays() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const { scope, year, range } = useStatsYear();
  const [open, setOpen] = useState(false);
  const { start, end, asOf } = range;

  const rows = useMemo(
    () =>
      habitDayRanking(
        habits,
        completions,
        passiveHabits,
        passiveChecks,
        start,
        end,
        asOf,
      ),
    [habits, completions, passiveHabits, passiveChecks, start, end, asOf],
  );
  const top = rows.slice(0, 5);
  const label = scope === "all" ? "todos los años" : String(year);

  return (
    <section className="alba-enter alba-enter-3 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
      <h2 className="font-medium">Días cumplidos</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {rows.length > 5
          ? "Los 5 hábitos con más días"
          : "Hábitos de la rutina"}
      </p>
      {top.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aún no hay hábitos que medir.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {top.map((row, i) => (
            <HabitDayRowView key={row.key} row={row} rank={i + 1} />
          ))}
        </ul>
      )}
      {rows.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={() => setOpen(true)}
        >
          Ver todas
          <ChevronRight className="size-4" />
        </Button>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Días cumplidos</DialogTitle>
            <DialogDescription>
              Todos los hábitos de {label}, de más a menos días.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {rows.map((row, i) => (
              <HabitDayRowView key={row.key} row={row} rank={i + 1} />
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function HabitDayRowView({
  row,
  rank,
}: {
  row: ReturnType<typeof habitDayRanking>[number];
  rank: number;
}) {
  const pct = Math.round(row.rate * 100);
  return (
    <StatRow
      rank={rank}
      icon={HABIT_ICONS[row.icon]}
      name={row.name}
      value={`${row.done}/${row.total}`}
      bar={pct}
      footer={
        <>
          <p>{pct}% consistencia</p>
          <p>
            Mayor racha {row.bestStreak} · actual {row.currentStreak}
          </p>
        </>
      }
    />
  );
}
