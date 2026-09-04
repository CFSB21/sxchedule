import { useEffect, useState } from "react";
import { Pause, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProgressRing } from "@/components/progress-ring";
import { HABIT_ICONS } from "@/lib/alba/icons";
import { elapsedMs, useRoutineStore } from "@/lib/alba/store";
import { formatClock } from "@/lib/alba/time";
import { toast } from "sonner";

export function SessionDock() {
  const session = useRoutineStore((s) => s.session);
  const habits = useRoutineStore((s) => s.habits);
  const pauseSession = useRoutineStore((s) => s.pauseSession);
  const resumeSession = useRoutineStore((s) => s.resumeSession);
  const finishSession = useRoutineStore((s) => s.finishSession);
  const cancelSession = useRoutineStore((s) => s.cancelSession);
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (session) setOpen(true);
    else setOpen(false);
  }, [session]);

  if (!session) return null;

  const habit = habits.find((h) => h.id === session.habitId);
  if (!habit) return null;

  const elapsed = elapsedMs(session, now);
  const target = habit.durationMin * 60_000;
  const remaining = Math.max(0, target - elapsed);
  const overtime = elapsed > target;
  const progress = Math.min(1, elapsed / target);
  const Icon = HABIT_ICONS[habit.icon];

  function complete() {
    finishSession();
    toast.success("Hábito completado");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-1/2 z-40 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-(--shadow-border) md:bottom-6"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/70" />
          <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
        </span>
        <span className="max-w-32 truncate">{habit.name}</span>
        <span className="tabular-nums">
          {overtime
            ? `+${formatClock(elapsed - target)}`
            : formatClock(remaining)}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm text-center" showClose={false}>
          <DialogHeader className="items-center pr-0">
            <div className="mb-2 grid size-12 place-items-center rounded-lg bg-secondary text-primary">
              <Icon className="size-5" />
            </div>
            <DialogTitle>{habit.name}</DialogTitle>
            <DialogDescription>
              {habit.durationMin} min previstos
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2">
            <ProgressRing value={progress} size={168} stroke={10}>
              <div>
                <p className="font-display text-4xl tabular-nums tracking-tight">
                  {overtime
                    ? `+${formatClock(elapsed - target)}`
                    : formatClock(remaining)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overtime ? "Tiempo extra" : "Restante"}
                </p>
              </div>
            </ProgressRing>
          </div>
          <div className="grid gap-2">
            <Button onClick={complete} className="w-full">
              <Check className="size-4" />
              Completar
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  session.running ? pauseSession() : resumeSession()
                }
              >
                {session.running ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {session.running ? "Pausa" : "Seguir"}
              </Button>
              <Button variant="ghost" onClick={cancelSession}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
