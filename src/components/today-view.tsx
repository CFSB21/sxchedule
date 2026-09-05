import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Play, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DayPartDialog } from "@/components/day-part-dialog";
import { OutcomeDialog } from "@/components/outcome-dialog";
import { ProgressRing } from "@/components/progress-ring";
import { WeekStrip } from "@/components/week-strip";
import { formatPartRange, resolvePartId } from "@/lib/alba/day-parts";
import {
  formatCountdown,
  habitPhase,
  habitWindow,
} from "@/lib/alba/habit-timer";
import { HABIT_ICONS } from "@/lib/alba/icons";
import {
  completionFor,
  dayMinutes,
  habitsForDate,
  isComplete,
} from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";
import {
  DAY_PART_ORDER,
  formatLongDate,
  formatMinutes,
  fromDateKey,
  todayKey,
} from "@/lib/alba/time";
import type { DayPart, DayPartConfig, Habit } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

function useNow(intervalMs = 250) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function TodayView({
  date,
  onDateChange,
}: {
  date: string;
  onDateChange: (next: string) => void;
}) {
  const now = useNow(250);
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const settings = useRoutineStore((s) => s.settings);
  const toggleComplete = useRoutineStore((s) => s.toggleComplete);
  const recordOutcome = useRoutineStore((s) => s.recordOutcome);
  const startSession = useRoutineStore((s) => s.startSession);
  const updateDayPart = useRoutineStore((s) => s.updateDayPart);
  const session = useRoutineStore((s) => s.session);

  const day = fromDateKey(date);
  const today = now ? todayKey(now) : date;
  const isToday = Boolean(now) && date === today;
  const due = habitsForDate(habits, day);
  const done = due.filter((h) => isComplete(completions, h.id, date));
  const minutes = dayMinutes(completions, date);
  const rate = due.length === 0 ? 0 : done.length / due.length;
  const parts = settings.dayParts;
  const grouped = DAY_PART_ORDER.map((part) => ({
    part,
    config: parts.find((p) => p.id === part) ?? null,
    items: due.filter((h) => resolvePartId(h, parts) === part),
  }));

  const [editingPart, setEditingPart] = useState<DayPartConfig | null>(null);
  const [outcome, setOutcome] = useState<{
    habit: Habit;
    excuseOnly: boolean;
  } | null>(null);
  const prevPhase = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!isToday || !now) return;
    for (const habit of due) {
      if (session?.habitId === habit.id) continue;
      const completion = completionFor(completions, habit.id, date);
      const phase = habitPhase(habit, date, completion, now, true);
      const prev = prevPhase.current[habit.id];
      prevPhase.current[habit.id] = phase;
      if (prev === "running" && phase === "awaiting") {
        setOutcome({ habit, excuseOnly: false });
        break;
      }
    }
  }, [now, isToday, due, completions, date, session]);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="alba-enter">
        <WeekStrip
          date={date}
          today={today}
          live={Boolean(now)}
          onDateChange={onDateChange}
        />
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {formatLongDate(day)}
        </p>
      </div>

      <section className="alba-enter alba-enter-1 mt-6 flex items-center gap-5 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <ProgressRing value={rate} size={104} stroke={8}>
          <p className="font-display text-2xl tabular-nums leading-none">
            {Math.round(rate * 100)}
            <span className="text-sm text-muted-foreground">%</span>
          </p>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Progreso del día</p>
          <p className="mt-1 font-medium tabular-nums">
            {done.length} de {due.length} hábitos
          </p>
          <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
            {formatMinutes(minutes)} dedicados
          </p>
        </div>
      </section>

      <div className="alba-enter alba-enter-2 mt-8 space-y-6">
        {grouped.map((group) => {
          const config = group.config;
          if (!config) return null;
          return (
            <section key={group.part}>
              <div className="mb-3 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {config.name}
                  </h2>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatPartRange(config)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar ${config.name}`}
                  onClick={() => setEditingPart(config)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
              {group.items.length === 0 ? (
                <p className="rounded-lg bg-card px-4 py-3 text-sm text-muted-foreground shadow-(--shadow-border)">
                  Sin hábitos en este tramo.
                </p>
              ) : (
                <ul className="space-y-2">
                  {group.items.map((habit) => {
                    const completion = completionFor(
                      completions,
                      habit.id,
                      date,
                    );
                    const phase = habitPhase(
                      habit,
                      date,
                      completion,
                      now,
                      isToday,
                    );
                    return (
                      <HabitRow
                        key={habit.id}
                        habit={habit}
                        date={date}
                        phase={phase}
                        completionExcuse={completion?.excuse}
                        isToday={isToday}
                        now={now}
                        sessionActive={session?.habitId === habit.id}
                        onToggle={() => toggleComplete(habit.id, date)}
                        onPlay={() => startSession(habit.id)}
                        onDone={() => {
                          recordOutcome(habit.id, date, "done");
                          toast.success("Hábito completado");
                        }}
                        onAskFail={() =>
                          setOutcome({ habit, excuseOnly: true })
                        }
                      />
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <DayPartDialog
        open={Boolean(editingPart)}
        part={editingPart}
        onOpenChange={(open) => {
          if (!open) setEditingPart(null);
        }}
        onSave={(patch) => {
          if (!editingPart) return;
          updateDayPart(editingPart.id as DayPart, patch);
          toast.success("Momento actualizado");
        }}
      />

      <OutcomeDialog
        open={Boolean(outcome)}
        habitName={outcome?.habit.name ?? ""}
        startOnExcuse={outcome?.excuseOnly}
        onOpenChange={(open) => {
          if (!open) setOutcome(null);
        }}
        onDone={() => {
          if (!outcome) return;
          recordOutcome(outcome.habit.id, date, "done");
          toast.success("Hábito completado");
        }}
        onFail={(excuse) => {
          if (!outcome) return;
          recordOutcome(outcome.habit.id, date, "failed", excuse);
          toast("Marcado como fallido");
        }}
      />
    </div>
  );
}

function HabitRow({
  habit,
  date,
  phase,
  completionExcuse,
  isToday,
  now,
  sessionActive,
  onToggle,
  onPlay,
  onDone,
  onAskFail,
}: {
  habit: Habit;
  date: string;
  phase: ReturnType<typeof habitPhase>;
  completionExcuse?: string;
  isToday: boolean;
  now: Date | null;
  sessionActive: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onDone: () => void;
  onAskFail: () => void;
}) {
  const Icon = HABIT_ICONS[habit.icon];
  const win = habitWindow(habit, date);
  const t = now?.getTime() ?? 0;
  let clock: string | null = null;
  let clockHint: string | null = null;
  if (win && now && !sessionActive) {
    if (phase === "upcoming") {
      clock = formatCountdown(win.start.getTime() - t);
      clockHint = "Empieza";
    } else if (phase === "running") {
      clock = formatCountdown(win.end.getTime() - t);
      clockHint = "Restante";
    }
  }

  const done = phase === "done";
  const failed = phase === "failed";
  const awaiting = phase === "awaiting" && !sessionActive;
  const canPlay =
    isToday &&
    !done &&
    !failed &&
    !awaiting &&
    !sessionActive &&
    (phase === "idle" || phase === "upcoming");

  return (
    <li
      className={cn(
        "rounded-lg bg-card p-2 shadow-(--shadow-border) transition-opacity duration-(--motion-quick)",
        (done || failed) && "opacity-70",
      )}
    >
      <div className="flex items-center gap-3 pr-1">
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
            "grid size-11 shrink-0 place-items-center rounded-md transition-colors duration-(--motion-quick)",
            done && "bg-primary text-primary-foreground",
            failed && "bg-destructive text-destructive-foreground",
            !done &&
              !failed &&
              "bg-secondary text-muted-foreground hover:text-foreground",
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
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium",
              (done || failed) && "text-muted-foreground line-through",
            )}
          >
            {habit.name}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {failed
              ? completionExcuse
                ? `Fallida · ${completionExcuse}`
                : "Fallida"
              : `${habit.scheduledTime ? `${habit.scheduledTime} · ` : ""}${habit.durationMin} min`}
          </p>
        </div>
        {clock ? (
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "font-display text-lg tabular-nums leading-none tracking-tight",
                phase === "running" && "text-primary",
              )}
            >
              {clock}
            </p>
            <p className="mt-0.5 text-xs tracking-wide text-muted-foreground uppercase">
              {clockHint}
            </p>
          </div>
        ) : canPlay ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Iniciar ${habit.name}`}
            onClick={onPlay}
          >
            <Play className="size-4" />
          </Button>
        ) : null}
      </div>
      {awaiting ? (
        <div className="mt-2 grid grid-cols-2 gap-2 px-1 pb-1">
          <Button onClick={onDone}>
            <Check className="size-4" />
            Completada
          </Button>
          <Button variant="outline" onClick={onAskFail}>
            <X className="size-4" />
            Fallida
          </Button>
        </div>
      ) : null}
    </li>
  );
}
