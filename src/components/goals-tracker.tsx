import { useMemo, useState, type FormEvent } from "react";
import { Clock, ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStatsYear } from "@/components/year-select";
import { useLongPress } from "@/lib/alba/long-press";
import {
  formatGoalDone,
  formatGoalTotal,
  progressForGoal,
  uniqueNames,
} from "@/lib/alba/goals";
import { useRoutineStore } from "@/lib/alba/store";
import { todayKey } from "@/lib/alba/time";
import type { YearGoal, YearGoalKind } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

type Draft = {
  kind: YearGoalKind;
  name: string;
  targetHours: string;
};

const emptyDraft: Draft = { kind: "hours", name: "", targetHours: "40" };

export function GoalsTracker() {
  const goals = useRoutineStore((s) => s.goals);
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const addGoal = useRoutineStore((s) => s.addGoal);
  const updateGoal = useRoutineStore((s) => s.updateGoal);
  const deleteGoal = useRoutineStore((s) => s.deleteGoal);
  const { year } = useStatsYear();
  const today = todayKey();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<YearGoal | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const names = useMemo(
    () =>
      uniqueNames(draft.kind === "hours" ? habits : passiveHabits),
    [draft.kind, habits, passiveHabits],
  );

  const rows = useMemo(
    () =>
      goals
        .filter((goal) => goal.year === year)
        .map((goal) =>
          progressForGoal(
            goal,
            { habits, completions, passiveHabits, passiveChecks },
            today,
          ),
        ),
    [goals, habits, completions, passiveHabits, passiveChecks, year, today],
  );

  function openAdd() {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function openEdit(goal: YearGoal) {
    setEditing(goal);
    setDraft({
      kind: goal.kind,
      name: goal.name,
      targetHours: String(goal.targetHours ?? 40),
    });
    setOpen(true);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    if (editing) {
      updateGoal(editing.id, {
        kind: draft.kind,
        name: draft.name,
        targetHours: Number(draft.targetHours),
      });
      toast.success("Meta actualizada");
    } else {
      addGoal({
        kind: draft.kind,
        name: draft.name,
        year,
        targetHours: Number(draft.targetHours),
      });
      toast.success("Meta añadida");
    }
    setOpen(false);
  }

  return (
    <section className="alba-enter alba-enter-2 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">Metas del año</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{year}</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          aria-label="Añadir meta"
          className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aún no hay metas para {year}. Añade una de horas o de días.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <GoalRow key={row.goal.id} row={row} onEdit={() => openEdit(row.goal)} />
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar meta" : "Nueva meta"}</DialogTitle>
            <DialogDescription>
              Horas suma el tiempo de la rutina. Días cuenta el hábito en los
              días de la semana en que está marcado.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, kind: "hours" }))}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-md text-sm font-medium",
                  draft.kind === "hours"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <Clock className="size-4" />
                Horas
              </button>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, kind: "days" }))}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-md text-sm font-medium",
                  draft.kind === "days"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <ListChecks className="size-4" />
                Días
              </button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-name">
                {draft.kind === "hours" ? "Actividad de rutina" : "Hábito"}
              </Label>
              <Input
                id="goal-name"
                list="goal-names"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                maxLength={80}
                required
                placeholder={
                  draft.kind === "hours" ? "Entrenamiento" : "Hacer la cama"
                }
              />
              <datalist id="goal-names">
                {names.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            {draft.kind === "hours" ? (
              <div className="grid gap-2">
                <Label htmlFor="goal-hours">Horas al año</Label>
                <Input
                  id="goal-hours"
                  type="number"
                  min={0.5}
                  step={0.5}
                  max={10000}
                  value={draft.targetHours}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, targetHours: e.target.value }))
                  }
                  required
                />
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={!draft.name.trim()}>
              {editing ? "Guardar" : "Añadir"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  deleteGoal(editing.id);
                  setOpen(false);
                  toast.success("Meta eliminada");
                }}
              >
                Eliminar
              </Button>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function GoalRow({
  row,
  onEdit,
}: {
  row: ReturnType<typeof progressForGoal>;
  onEdit: () => void;
}) {
  const lp = useLongPress(onEdit);
  const pct =
    row.total <= 0 ? 0 : Math.min(100, Math.round((row.done / row.total) * 100));
  const Icon = row.goal.kind === "hours" ? Clock : ListChecks;
  return (
    <li
      {...lp}
      className="select-none rounded-lg bg-secondary/70 px-3 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-card text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium">{row.goal.name}</p>
            <p className="text-sm tabular-nums">
              {formatGoalDone(row.goal.kind, row.done)}
              <span className="text-muted-foreground">
                {" / "}
                {formatGoalTotal(row.goal.kind, row.total)}
              </span>
            </p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {pct}%
            {row.matched ? "" : " · sin coincidencia"}
          </p>
        </div>
      </div>
    </li>
  );
}
