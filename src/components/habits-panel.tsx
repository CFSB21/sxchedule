import { useEffect, useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { SidePanel } from "@/components/side-panel";
import { OutcomeDialog } from "@/components/outcome-dialog";
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
import { HABIT_ICON_IDS, HABIT_ICONS } from "@/lib/alba/icons";
import { useLongPress } from "@/lib/alba/long-press";
import { duePassives } from "@/lib/alba/schedule";
import { isPassiveComplete, isPassiveFailed, passiveCheckFor } from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";
import { DAY_LABELS, DAY_NAMES, formatLongDate, fromDateKey } from "@/lib/alba/time";
import type { HabitIconId, PassiveHabit } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

export function HabitsPanel({
  open,
  date,
  onClose,
}: {
  open: boolean;
  date: string;
  onClose: () => void;
}) {
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const togglePassiveCheck = useRoutineStore((s) => s.togglePassiveCheck);
  const recordPassiveOutcome = useRoutineStore((s) => s.recordPassiveOutcome);
  const addPassiveHabit = useRoutineStore((s) => s.addPassiveHabit);
  const updatePassiveHabit = useRoutineStore((s) => s.updatePassiveHabit);
  const deletePassiveHabit = useRoutineStore((s) => s.deletePassiveHabit);

  const due = duePassives(passiveHabits, date);

  const [editing, setEditing] = useState<PassiveHabit | null>(null);
  const [creating, setCreating] = useState(false);
  const [failing, setFailing] = useState<PassiveHabit | null>(null);

  return (
    <SidePanel
      open={open}
      side="left"
      title="Hábitos"
      subtitle={`Desde el ${formatLongDate(fromDateKey(date)).toLowerCase()}. El pasado no cambia.`}
      headerAction={
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Añadir hábito"
        >
          <Plus className="size-4" />
        </button>
      }
      onClose={onClose}
    >
      {due.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nada para este día. Añade una costumbre.
        </p>
      ) : (
        <ul className="space-y-2">
          {due.map((habit) => {
            const check = passiveCheckFor(passiveChecks, habit.id, date);
            const done = Boolean(check && isPassiveComplete(passiveChecks, habit.id, date));
            const failed = Boolean(check && isPassiveFailed(check));
            return (
              <PassiveRow
                key={habit.id}
                habit={habit}
                done={done}
                failed={failed}
                excuse={check?.excuse}
                onToggle={() => togglePassiveCheck(habit.id, date)}
                onFail={() => setFailing(habit)}
                onEdit={() => setEditing(habit)}
              />
            );
          })}
        </ul>
      )}

      <PassiveFormDialog
        open={creating || Boolean(editing)}
        habit={editing}
        onOpenChange={(next) => {
          if (!next) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSave={(draft) => {
          if (editing) {
            updatePassiveHabit(editing.id, draft, date);
            toast.success("Hábito actualizado");
          } else {
            addPassiveHabit(draft, date);
            toast.success("Hábito añadido");
          }
        }}
        onDelete={
          editing
            ? () => {
                deletePassiveHabit(editing.id, date);
                toast.success("Hábito eliminado");
              }
            : undefined
        }
      />
      <OutcomeDialog
        open={Boolean(failing)}
        habitName={failing?.name ?? ""}
        startOnExcuse
        onOpenChange={(next) => {
          if (!next) setFailing(null);
        }}
        onDone={() => {
          if (!failing) return;
          recordPassiveOutcome(failing.id, date, "done");
          toast.success("Completado");
        }}
        onFail={(excuse) => {
          if (!failing) return;
          recordPassiveOutcome(failing.id, date, "failed", excuse);
          toast("Marcado como incompleto");
        }}
      />
    </SidePanel>
  );
}

function PassiveRow({
  habit,
  done,
  failed,
  excuse,
  onToggle,
  onFail,
  onEdit,
}: {
  habit: PassiveHabit;
  done: boolean;
  failed: boolean;
  excuse?: string;
  onToggle: () => void;
  onFail: () => void;
  onEdit: () => void;
}) {
  const Icon = HABIT_ICONS[habit.icon];
  const lp = useLongPress(onEdit);
  return (
    <li
      {...lp}
      className={cn(
        "flex select-none items-start gap-3 rounded-lg bg-secondary/70 px-2 py-2",
        (done || failed) && "opacity-70",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={
          failed
            ? `Quitar fallo de ${habit.name}`
            : done
              ? `Desmarcar ${habit.name}`
              : `Completar ${habit.name}`
        }
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-md transition-colors",
          done && "bg-primary text-primary-foreground",
          failed && "bg-destructive text-destructive-foreground",
          !done && !failed && "bg-card text-muted-foreground",
        )}
      >
        {done ? (
          <Check className="size-4" />
        ) : failed ? (
          <X className="size-4" />
        ) : (
          <Icon className="size-4" />
        )}
      </button>
      <div className="min-w-0 flex-1 py-1">
        <p
          className={cn(
            "text-sm font-medium break-words",
            (done || failed) && "text-muted-foreground line-through",
          )}
        >
          {habit.name}
        </p>
        {failed ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {excuse ? `Incompleto · ${excuse}` : "Incompleto"}
          </p>
        ) : null}
      </div>
      {!done && !failed ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Marcar ${habit.name} incompleto`}
          onClick={onFail}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </li>
  );
}

function PassiveFormDialog({
  open,
  habit,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  habit: PassiveHabit | null;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: {
    name: string;
    icon: HabitIconId;
    days: number[];
  }) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<HabitIconId>("leaf");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setName(habit?.name ?? "");
    setIcon(habit?.icon ?? "leaf");
    setDays(habit ? [...habit.days] : [0, 1, 2, 3, 4, 5, 6]);
  }, [open, habit]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    onSave({
      name: value,
      icon,
      days: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? "Editar hábito" : "Nuevo hábito"}</DialogTitle>
          <DialogDescription>
            Se suma desde este día. Los días anteriores no se tocan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="passive-name">Nombre</Label>
            <Input
              id="passive-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hacer la cama…"
              maxLength={80}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Icono</Label>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
              {HABIT_ICON_IDS.map((id) => {
                const Icon = HABIT_ICONS[id];
                const selected = icon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIcon(id)}
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
            <Label>Días</Label>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS.map((label, i) => {
                const on = days.includes(i);
                return (
                  <button
                    key={label}
                    type="button"
                    title={DAY_NAMES[i]}
                    onClick={() =>
                      setDays((d) => {
                        const has = d.includes(i);
                        const next = has
                          ? d.filter((x) => x !== i)
                          : [...d, i].sort();
                        return next.length === 0 ? d : next;
                      })
                    }
                    className={cn(
                      "grid h-11 place-items-center rounded-md text-sm font-medium",
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
          <Button type="submit" className="w-full">
            {habit ? "Guardar" : "Añadir"}
          </Button>
          {habit && onDelete ? (
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
                Eliminar
              </Button>
            )
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
