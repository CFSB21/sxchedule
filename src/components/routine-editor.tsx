import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HabitFormDialog, type HabitDraft } from "@/components/habit-form";
import { HABIT_ICONS } from "@/lib/alba/icons";
import { useRoutineStore } from "@/lib/alba/store";
import { DAY_LABELS, DAY_PART_LABEL, DAY_PART_ORDER } from "@/lib/alba/time";
import type { Habit } from "@/lib/alba/types";

export function RoutineEditor() {
  const habits = useRoutineStore((s) => s.habits);
  const addHabit = useRoutineStore((s) => s.addHabit);
  const updateHabit = useRoutineStore((s) => s.updateHabit);
  const deleteHabit = useRoutineStore((s) => s.deleteHabit);
  const moveHabit = useRoutineStore((s) => s.moveHabit);
  const restoreDemo = useRoutineStore((s) => s.restoreDemo);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const grouped = DAY_PART_ORDER.map((part) => ({
    part,
    items: habits
      .filter((h) => h.dayPart === part)
      .sort((a, b) => a.order - b.order),
  }));

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditing(habit);
    setOpen(true);
  }

  function save(draft: HabitDraft) {
    if (editing) {
      updateHabit(editing.id, draft);
      toast.success("Hábito actualizado");
    } else {
      addHabit(draft);
      toast.success("Hábito añadido");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="alba-enter flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Rutina</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El esqueleto de tu día. Edítalo cuando cambie tu ritmo.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Añadir
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="alba-enter alba-enter-1 mt-8 rounded-xl bg-card px-6 py-12 text-center shadow-(--shadow-border)">
          <p className="font-display text-2xl">Empieza por un hábito</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Crea tu primera pieza o restaura una rutina de ejemplo para ver cómo
            se siente el día.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Button onClick={openNew}>Nuevo hábito</Button>
            <Button
              variant="outline"
              onClick={() => {
                restoreDemo();
                toast.success("Rutina de ejemplo restaurada");
              }}
            >
              Restaurar ejemplo
            </Button>
          </div>
        </div>
      ) : (
        <div className="alba-enter alba-enter-1 mt-8 space-y-8">
          {grouped.map((group) =>
            group.items.length === 0 ? null : (
              <section key={group.part}>
                <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {DAY_PART_LABEL[group.part]}
                </h2>
                <ul className="space-y-2">
                  {group.items.map((habit, index) => {
                    const Icon = HABIT_ICONS[habit.icon];
                    return (
                      <li
                        key={habit.id}
                        className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-(--shadow-border)"
                      >
                        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                          <Icon className="size-4" />
                        </div>
                        <button
                          type="button"
                          onClick={() => openEdit(habit)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate font-medium">{habit.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {habit.scheduledTime
                              ? `${habit.scheduledTime} · `
                              : ""}
                            {habit.durationMin} min ·{" "}
                            {habit.days.length === 7
                              ? "Todos los días"
                              : habit.days.map((d) => DAY_LABELS[d]).join(" ")}
                          </p>
                        </button>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            aria-label="Subir"
                            disabled={index === 0}
                            onClick={() => moveHabit(habit.id, -1)}
                            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Bajar"
                            disabled={index === group.items.length - 1}
                            onClick={() => moveHabit(habit.id, 1)}
                            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
          )}
        </div>
      )}

      <HabitFormDialog
        open={open}
        onOpenChange={setOpen}
        habit={editing}
        onSave={save}
        onDelete={
          editing
            ? () => {
                deleteHabit(editing.id);
                toast.success("Hábito eliminado");
              }
            : undefined
        }
      />
    </div>
  );
}
