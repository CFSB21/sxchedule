import { Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/progress-ring";
import { HABIT_ICONS } from "@/lib/alba/icons";
import {
  dayMinutes,
  habitsForDate,
  isComplete,
} from "@/lib/alba/stats";
import { useRoutineStore } from "@/lib/alba/store";
import {
  DAY_PART_LABEL,
  DAY_PART_ORDER,
  formatLongDate,
  formatMinutes,
  fromDateKey,
  greeting,
  shiftDateKey,
  todayKey,
} from "@/lib/alba/time";
import type { DayPart, Habit } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

export function TodayView({
  date,
  onDateChange,
}: {
  date: string;
  onDateChange: (next: string) => void;
}) {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const toggleComplete = useRoutineStore((s) => s.toggleComplete);
  const startSession = useRoutineStore((s) => s.startSession);
  const session = useRoutineStore((s) => s.session);

  const day = fromDateKey(date);
  const today = todayKey();
  const isToday = date === today;
  const due = habitsForDate(habits, day);
  const done = due.filter((h) => isComplete(completions, h.id, date));
  const minutes = dayMinutes(completions, date);
  const rate = due.length === 0 ? 0 : done.length / due.length;
  const grouped = DAY_PART_ORDER.map((part) => ({
    part,
    items: due.filter((h) => h.dayPart === part),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="alba-enter flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Día anterior"
          onClick={() => onDateChange(shiftDateKey(date, -1))}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="text-center">
          <p className="font-display text-3xl italic tracking-tight">
            {isToday ? greeting() : "Ese día"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatLongDate(day)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Día siguiente"
          disabled={date >= today}
          onClick={() => onDateChange(shiftDateKey(date, 1))}
        >
          <ChevronRight className="size-5" />
        </Button>
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

      {due.length === 0 ? (
        <div className="alba-enter alba-enter-2 mt-8 rounded-xl bg-card px-5 py-10 text-center shadow-(--shadow-border)">
          <p className="font-display text-xl">Día libre</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No hay hábitos programados para este día. Añádelos en Rutina.
          </p>
        </div>
      ) : (
        <div className="alba-enter alba-enter-2 mt-8 space-y-6">
          {grouped.map((group) => (
            <section key={group.part}>
              <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {DAY_PART_LABEL[group.part as DayPart]}
              </h2>
              <ul className="space-y-2">
                {group.items.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    done={isComplete(completions, habit.id, date)}
                    isToday={isToday}
                    sessionActive={session?.habitId === habit.id}
                    onToggle={() => toggleComplete(habit.id, date)}
                    onPlay={() => startSession(habit.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function HabitRow({
  habit,
  done,
  isToday,
  sessionActive,
  onToggle,
  onPlay,
}: {
  habit: Habit;
  done: boolean;
  isToday: boolean;
  sessionActive: boolean;
  onToggle: () => void;
  onPlay: () => void;
}) {
  const Icon = HABIT_ICONS[habit.icon];
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg bg-card p-2 pr-2 shadow-(--shadow-border) transition-opacity duration-(--motion-quick)",
        done && "opacity-70",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? `Desmarcar ${habit.name}` : `Completar ${habit.name}`}
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-md transition-colors duration-(--motion-quick)",
          done
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground",
        )}
      >
        {done ? <Check className="size-4" /> : <Icon className="size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          {habit.name}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {habit.scheduledTime ? `${habit.scheduledTime} · ` : ""}
          {habit.durationMin} min
        </p>
      </div>
      {isToday && !done && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Iniciar ${habit.name}`}
          onClick={onPlay}
          disabled={sessionActive}
        >
          <Play className="size-4" />
        </Button>
      )}
    </li>
  );
}
