import { useMemo, useState } from "react";
import { dataStart } from "@/lib/alba/day-score";
import { useRoutineStore } from "@/lib/alba/store";
import { todayKey } from "@/lib/alba/time";
import {
  resolveStatsScope,
  resolveStatsYear,
  statsWindow,
  yearsFromState,
} from "@/lib/alba/year";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function useStatsYear() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const todos = useRoutineStore((s) => s.todos);
  const dayOverrides = useRoutineStore((s) => s.dayOverrides);
  const goals = useRoutineStore((s) => s.goals);
  const storedYear = useRoutineStore((s) => s.settings.statsYear);
  const storedScope = useRoutineStore((s) => s.settings.statsScope);
  const updateSettings = useRoutineStore((s) => s.updateSettings);
  const today = todayKey();

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

  const years = useMemo(
    () => yearsFromState(input, goals, today),
    [input, goals, today],
  );
  const year = resolveStatsYear(storedYear, years, today);
  const scope = resolveStatsScope(storedScope);
  const first = useMemo(() => dataStart(input, today), [input, today]);
  const range = statsWindow(scope, year, today, first);

  function setYear(next: number) {
    if (!years.includes(next)) return;
    updateSettings({ statsYear: next, statsScope: "year" });
  }

  function setAll() {
    updateSettings({ statsScope: "all" });
  }

  return { year, years, setYear, scope, setAll, today, range };
}

export function YearSelect({ className }: { className?: string }) {
  const { year, years, setYear, scope, setAll } = useStatsYear();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-pressed={scope === "year"}
        className={cn(
          "flex min-h-11 flex-col items-center justify-center rounded-md px-2 py-1.5 text-center text-sm font-medium leading-snug",
          scope === "year"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground",
        )}
      >
        <span>Seleccionar año</span>
        {scope === "year" ? (
          <span className="tabular-nums">{year}</span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={setAll}
        aria-pressed={scope === "all"}
        className={cn(
          "flex min-h-11 items-center justify-center rounded-md px-2 py-1.5 text-center text-sm font-medium leading-snug",
          scope === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground",
        )}
      >
        Datos de todos los años
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar año</DialogTitle>
            <DialogDescription>
              El calendario, las metas y los rankings se muestran para ese año.
            </DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2">
            {years.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => {
                    setYear(item);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-11 w-full items-center justify-center rounded-md text-sm font-medium tabular-nums",
                    scope === "year" && item === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
