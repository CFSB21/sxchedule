import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HABIT_ICON_IDS, HABIT_ICONS } from "@/lib/alba/icons";
import { DAY_LABELS, DAY_NAMES, DAY_PART_LABEL } from "@/lib/alba/time";
import type { DayPart, Habit, HabitIconId } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

const DURATIONS = [5, 10, 15, 20, 25, 30, 40, 45, 60, 90, 120];
const PARTS: DayPart[] = ["morning", "afternoon", "evening"];

export type HabitDraft = {
  name: string;
  icon: HabitIconId;
  durationMin: number;
  dayPart: DayPart;
  scheduledTime: string | null;
  days: number[];
  remind: boolean;
};

const EMPTY: HabitDraft = {
  name: "",
  icon: "sun",
  durationMin: 20,
  dayPart: "morning",
  scheduledTime: null,
  days: [0, 1, 2, 3, 4, 5, 6],
  remind: true,
};

export function HabitFormDialog({
  open,
  onOpenChange,
  habit,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
  onSave: (draft: HabitDraft) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<HabitDraft>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setDraft(
      habit
        ? {
            name: habit.name,
            icon: habit.icon,
            durationMin: habit.durationMin,
            dayPart: habit.dayPart,
            scheduledTime: habit.scheduledTime,
            days: [...habit.days],
            remind: habit.remind !== false,
          }
        : EMPTY,
    );
  }, [open, habit]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function toggleDay(day: number) {
    setDraft((d) => {
      const has = d.days.includes(day);
      const days = has ? d.days.filter((x) => x !== day) : [...d.days, day].sort();
      return { ...d, days: days.length === 0 ? d.days : days };
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSave({ ...draft, name: draft.name.trim() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? "Editar hábito" : "Nuevo hábito"}</DialogTitle>
          <DialogDescription>
            Define cuándo y cuánto tiempo le dedicas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="habit-name">Nombre</Label>
            <Input
              id="habit-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Meditación, lectura…"
              maxLength={48}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Icono</Label>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
              {HABIT_ICON_IDS.map((id) => {
                const Icon = HABIT_ICONS[id];
                const selected = draft.icon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, icon: id }))}
                    className={cn(
                      "grid size-11 place-items-center rounded-md transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                    aria-label={id}
                    aria-pressed={selected}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Momento</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {PARTS.map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, dayPart: part }))}
                  className={cn(
                    "h-11 rounded-md text-sm font-medium transition-colors",
                    draft.dayPart === part
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {DAY_PART_LABEL[part]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="habit-duration">Minutos</Label>
              <Input
                id="habit-duration"
                type="number"
                min={1}
                max={240}
                value={draft.durationMin}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    durationMin: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
              />
              <div className="flex flex-wrap gap-1">
                {DURATIONS.slice(0, 6).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, durationMin: n }))}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      draft.durationMin === n
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="habit-time">Hora (opcional)</Label>
              <Input
                id="habit-time"
                type="time"
                value={draft.scheduledTime ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    scheduledTime: e.target.value || null,
                  }))
                }
              />
            </div>
          </div>

          {draft.scheduledTime ? (
            <label className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-3">
              <span className="text-sm">
                Avisar a la hora programada
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.remind}
                onClick={() =>
                  setDraft((d) => ({ ...d, remind: !d.remind }))
                }
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  draft.remind ? "bg-primary" : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-6 rounded-full bg-card transition-transform",
                    draft.remind && "translate-x-5",
                  )}
                />
              </button>
            </label>
          ) : null}

          <div className="grid gap-2">
            <Label>Días</Label>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS.map((label, i) => {
                const on = draft.days.includes(i);
                return (
                  <button
                    key={label}
                    type="button"
                    title={DAY_NAMES[i]}
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "grid h-11 place-items-center rounded-md text-sm font-medium transition-colors",
                      on
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                    aria-pressed={on}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full">
              {habit ? "Guardar cambios" : "Añadir a la rutina"}
            </Button>
            {habit && onDelete && (
              confirmDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete();
                    onOpenChange(false);
                  }}
                >
                  Confirmar eliminación
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                >
                  Eliminar hábito
                </Button>
              )
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
