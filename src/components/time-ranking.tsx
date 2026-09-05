import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HABIT_ICONS } from "@/lib/alba/icons";
import { activityTimeRanking } from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";
import { formatMinutes } from "@/lib/alba/time";
import { yearRange } from "@/lib/alba/year";
import { useStatsYear } from "@/components/year-select";

export function TimeRanking() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const { year, today } = useStatsYear();
  const [open, setOpen] = useState(false);
  const { start, asOf } = yearRange(year, today);

  const rows = useMemo(
    () => activityTimeRanking(habits, completions, start, asOf),
    [habits, completions, start, asOf],
  );
  const top = rows.slice(0, 5);
  const max = top[0]?.minutes ?? 0;

  return (
    <section className="alba-enter alba-enter-2 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
      <h2 className="font-medium">Tiempo dedicado</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {rows.length > 5
          ? "Las 5 actividades con más tiempo"
          : "Actividades de la rutina"}
      </p>
      {top.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aún no hay tiempo registrado este año.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {top.map((row, i) => (
            <TimeRow key={row.key} row={row} rank={i + 1} max={max} />
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
            <DialogTitle>Tiempo dedicado</DialogTitle>
            <DialogDescription>
              Todas las actividades de {year}, de más a menos tiempo.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {rows.map((row, i) => (
              <TimeRow
                key={row.key}
                row={row}
                rank={i + 1}
                max={rows[0]?.minutes ?? 0}
              />
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function TimeRow({
  row,
  rank,
  max,
}: {
  row: ReturnType<typeof activityTimeRanking>[number];
  rank: number;
  max: number;
}) {
  const Icon = HABIT_ICONS[row.icon];
  const pct = max <= 0 ? 0 : Math.round((row.minutes / max) * 100);
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
        {rank}
      </span>
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{row.name}</p>
          <p className="text-sm tabular-nums">{formatMinutes(row.minutes)}</p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </li>
  );
}
