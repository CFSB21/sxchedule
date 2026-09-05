import { useEffect, useState, type FormEvent } from "react";
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
import { overrideFor } from "@/lib/alba/overrides";
import { useRoutineStore } from "@/lib/alba/store";
import { formatLongDate, fromDateKey } from "@/lib/alba/time";
import type { Habit } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

export function DayOverrideDialog({
  open,
  habit,
  date,
  onOpenChange,
}: {
  open: boolean;
  habit: Habit | null;
  date: string;
  onOpenChange: (open: boolean) => void;
}) {
  const dayOverrides = useRoutineStore((s) => s.dayOverrides);
  const setDayOverride = useRoutineStore((s) => s.setDayOverride);
  const clearDayOverride = useRoutineStore((s) => s.clearDayOverride);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(20);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!open || !habit) return;
    const over = overrideFor(dayOverrides, habit.id, date);
    setName(over?.name ?? habit.name);
    setTime(
      over?.scheduledTime === undefined
        ? (habit.scheduledTime ?? "")
        : (over.scheduledTime ?? ""),
    );
    setDuration(over?.durationMin ?? habit.durationMin);
    setSkipped(Boolean(over?.skipped));
  }, [open, habit, date, dayOverrides]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!habit) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setDayOverride(habit.id, date, {
      name: trimmed === habit.name ? undefined : trimmed,
      scheduledTime: time || null,
      durationMin: duration === habit.durationMin ? undefined : duration,
      skipped,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solo este día</DialogTitle>
          <DialogDescription>
            Cambia {habit?.name ?? "la actividad"} para el{" "}
            {formatLongDate(fromDateKey(date))}. La rutina del resto de días no
            se toca.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <label className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-3">
            <span className="text-sm">Omitir este día</span>
            <button
              type="button"
              role="switch"
              aria-checked={skipped}
              onClick={() => setSkipped((v) => !v)}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                skipped ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-6 rounded-full bg-card transition-transform",
                  skipped && "translate-x-5",
                )}
              />
            </button>
          </label>
          {skipped ? null : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="over-name">Nombre</Label>
                <Input
                  id="over-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={48}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="over-duration">Minutos</Label>
                  <Input
                    id="over-duration"
                    type="number"
                    min={1}
                    max={240}
                    value={duration}
                    onChange={(e) =>
                      setDuration(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="over-time">Hora</Label>
                  <Input
                    id="over-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
          <Button type="submit" className="w-full">
            Guardar para este día
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!habit) return;
              clearDayOverride(habit.id, date);
              onOpenChange(false);
            }}
          >
            Volver a la rutina
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
