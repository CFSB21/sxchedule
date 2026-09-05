import { useEffect, useRef, useState } from "react";
import { Check, Play, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DayOverrideDialog } from "@/components/day-override-dialog";
import { DayPartDialog } from "@/components/day-part-dialog";
import { DayProgress } from "@/components/day-progress";
import { HabitsPanel } from "@/components/habits-panel";
import { OutcomeDialog } from "@/components/outcome-dialog";
import { TodoPanel } from "@/components/todo-panel";
import { WeekStrip } from "@/components/week-strip";
import { formatPartRange, resolvePartId } from "@/lib/alba/day-parts";
import {
  formatCountdown,
  habitPhase,
  habitWindow,
} from "@/lib/alba/habit-timer";
import { HABIT_ICONS } from "@/lib/alba/icons";
import { useLongPress } from "@/lib/alba/long-press";
import { duePassives } from "@/lib/alba/schedule";
import {
  dueWithOverrides,
  hasDayOverride,
  overrideFor,
} from "@/lib/alba/overrides";
import {
  completionForLineage,
  dayMinutes,
  isCompleteLineage,
} from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";
import {
  DAY_PART_ORDER,
  formatLongDate,
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
  const dayOverrides = useRoutineStore((s) => s.dayOverrides);
  const passiveHabits = useRoutineStore((s) => s.passiveHabits);
  const passiveChecks = useRoutineStore((s) => s.passiveChecks);
  const todos = useRoutineStore((s) => s.todos);
  const toggleComplete = useRoutineStore((s) => s.toggleComplete);
  const recordOutcome = useRoutineStore((s) => s.recordOutcome);
  const startSession = useRoutineStore((s) => s.startSession);
  const updateDayPart = useRoutineStore((s) => s.updateDayPart);
  const session = useRoutineStore((s) => s.session);

  const day = fromDateKey(date);
  const today = now ? todayKey(now) : date;
  const isToday = Boolean(now) && date === today;
  const due = dueWithOverrides(habits, day, date, dayOverrides);
  const done = due.filter((h) =>
    isCompleteLineage(completions, habits, h, date),
  );
  const minutes = dayMinutes(completions, date);
  const parts = settings.dayParts;
  const grouped = DAY_PART_ORDER.map((part) => ({
    part,
    config: parts.find((p) => p.id === part) ?? null,
    items: due.filter((h) => resolvePartId(h, parts) === part),
  }));

  const customsDue = duePassives(passiveHabits, date);
  const customsDone = customsDue.filter((h) =>
    passiveChecks.some((c) => c.habitId === h.id && c.date === date),
  );
  const dayTodos = todos.filter((t) => t.date === date);
  const todosDone = dayTodos.filter((t) => t.done);

  const [editingPart, setEditingPart] = useState<DayPartConfig | null>(null);
  const [panel, setPanel] = useState<"habits" | "todos" | null>(null);
  const [overrideHabit, setOverrideHabit] = useState<Habit | null>(null);
  const [outcome, setOutcome] = useState<{
    habit: Habit;
    excuseOnly: boolean;
  } | null>(null);
  const prevPhase = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!isToday || !now) return;
    for (const habit of due) {
      if (session?.habitId === habit.id) continue;
      const completion = completionForLineage(
        completions,
        habits,
        habit,
        date,
      );
      const phase = habitPhase(habit, date, completion, now, true);
      const prev = prevPhase.current[habit.id];
      prevPhase.current[habit.id] = phase;
      if (prev === "running" && phase === "awaiting") {
        setOutcome({ habit, excuseOnly: false });
        break;
      }
    }
  }, [now, isToday, due, completions, date, session]);

  const sourceHabit = (id: string) => habits.find((h) => h.id === id) ?? null;

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

      <DayProgress
        routineDone={done.length}
        routineTotal={due.length}
        customDone={customsDone.length}
        customTotal={customsDue.length}
        todoDone={todosDone.length}
        todoTotal={dayTodos.length}
        minutes={minutes}
        onOpenHabits={() => setPanel("habits")}
        onOpenTodos={() => setPanel("todos")}
      />

      <div className="alba-enter alba-enter-2 mt-8 space-y-6">
        {grouped.map((group) => {
          const config = group.config;
          if (!config) return null;
          return (
            <DayPartSection
              key={group.part}
              config={config}
              onEdit={() => setEditingPart(config)}
            >
              {group.items.length === 0 ? (
                <p className="rounded-lg bg-card px-4 py-3 text-sm text-muted-foreground shadow-(--shadow-border)">
                  Sin actividades en este tramo.
                </p>
              ) : (
                <ul className="space-y-2">
                  {group.items.map((habit) => {
                    const completion = completionForLineage(
                      completions,
                      habits,
                      habit,
                      date,
                    );
                    const phase = habitPhase(
                      habit,
                      date,
                      completion,
                      now,
                      isToday,
                    );
                    const over = overrideFor(dayOverrides, habit.id, date);
                    return (
                      <HabitRow
                        key={habit.id}
                        habit={habit}
                        date={date}
                        phase={phase}
                        overridden={hasDayOverride(over)}
                        completionExcuse={completion?.excuse}
                        isToday={isToday}
                        now={now}
                        sessionActive={session?.habitId === habit.id}
                        onToggle={() => toggleComplete(habit.id, date)}
                        onPlay={() => startSession(habit.id)}
                        onDone={() => {
                          recordOutcome(habit.id, date, "done");
                          toast.success("Completada");
                        }}
                        onAskFail={() =>
                          setOutcome({ habit, excuseOnly: true })
                        }
                        onEdit={() =>
                          setOverrideHabit(sourceHabit(habit.id) ?? habit)
                        }
                      />
                    );
                  })}
                </ul>
              )}
            </DayPartSection>
          );
        })}
      </div>

      <HabitsPanel
        open={panel === "habits"}
        date={date}
        onClose={() => setPanel(null)}
      />
      <TodoPanel
        open={panel === "todos"}
        date={date}
        onClose={() => setPanel(null)}
      />

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

      <DayOverrideDialog
        open={Boolean(overrideHabit)}
        habit={overrideHabit}
        date={date}
        onOpenChange={(open) => {
          if (!open) setOverrideHabit(null);
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
          toast.success("Completada");
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

function DayPartSection({
  config,
  onEdit,
  children,
}: {
  config: DayPartConfig;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const lp = useLongPress(onEdit);
  return (
    <section>
      <div
        {...lp}
        title="Mantén pulsado para editar"
        className="mb-3 select-none"
      >
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {config.name}
        </h2>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatPartRange(config)}
        </p>
      </div>
      {children}
    </section>
  );
}

function HabitRow({
  habit,
  date,
  phase,
  overridden,
  completionExcuse,
  isToday,
  now,
  sessionActive,
  onToggle,
  onPlay,
  onDone,
  onAskFail,
  onEdit,
}: {
  habit: Habit;
  date: string;
  phase: ReturnType<typeof habitPhase>;
  overridden: boolean;
  completionExcuse?: string;
  isToday: boolean;
  now: Date | null;
  sessionActive: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onDone: () => void;
  onAskFail: () => void;
  onEdit: () => void;
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
  const lp = useLongPress(onEdit);

  return (
    <li
      {...lp}
      className={cn(
        "select-none rounded-lg bg-card p-2 shadow-(--shadow-border) transition-opacity duration-(--motion-quick)",
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
              : `${habit.scheduledTime ? `${habit.scheduledTime} · ` : ""}${habit.durationMin} min${overridden ? " · hoy" : ""}`}
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
