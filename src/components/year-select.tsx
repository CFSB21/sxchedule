import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRoutineStore } from "@/lib/alba/store";
import { todayKey } from "@/lib/alba/time";
import { resolveStatsYear, yearsFromState } from "@/lib/alba/year";
import { cn } from "@/lib/utils";

export function useStatsYear() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const todos = useRoutineStore((s) => s.todos);
  const dayOverrides = useRoutineStore((s) => s.dayOverrides);
  const goals = useRoutineStore((s) => s.goals);
  const stored = useRoutineStore((s) => s.settings.statsYear);
  const updateSettings = useRoutineStore((s) => s.updateSettings);
  const today = todayKey();

  const years = useMemo(
    () =>
      yearsFromState(
        {
          habits,
          completions,
          passiveHabits,
          passiveChecks,
          todos,
          dayOverrides,
        },
        goals,
        today,
      ),
    [
      habits,
      completions,
      passiveHabits,
      passiveChecks,
      todos,
      dayOverrides,
      goals,
      today,
    ],
  );

  const year = resolveStatsYear(stored, years, today);

  function setYear(next: number) {
    if (!years.includes(next)) return;
    updateSettings({ statsYear: next });
  }

  return { year, years, setYear, today };
}

export function YearSelect({ className }: { className?: string }) {
  const { year, years, setYear } = useStatsYear();
  const [open, setOpen] = useState(false);
  const idx = years.indexOf(year);
  const older = idx >= 0 ? years[idx + 1] : undefined;
  const newer = idx > 0 ? years[idx - 1] : undefined;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Año anterior"
        disabled={older == null}
        onClick={() => older != null && setYear(older)}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Seleccionar año"
        className="h-11 min-w-24 flex-1 rounded-md bg-secondary px-3 font-display text-xl tabular-nums tracking-tight"
      >
        {year}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Año siguiente"
        disabled={newer == null}
        onClick={() => newer != null && setYear(newer)}
      >
        <ChevronRight className="size-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar año</DialogTitle>
            <DialogDescription>
              Las estadísticas y las metas se muestran para el año que elijas.
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
                    item === year
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
