import { ProgressRing } from "@/components/progress-ring";
import { formatMinutes } from "@/lib/alba/time";
import { cn } from "@/lib/utils";

function RingStat({
  label,
  done,
  total,
  onOpen,
}: {
  label: string;
  done: number;
  total: number;
  onOpen?: () => void;
}) {
  const value = total === 0 ? 0 : done / total;
  const pct = Math.round(value * 100);
  const inner = (
    <>
      <ProgressRing value={value} size={80} stroke={7}>
        <span className="font-display text-lg tabular-nums leading-none tracking-tight">
          {pct}
          <span className="text-xs text-muted-foreground">%</span>
        </span>
      </ProgressRing>
      <span className="mt-2 text-sm font-medium">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">
        {done}/{total}
      </span>
    </>
  );

  const className = cn(
    "flex min-h-11 flex-col items-center rounded-lg py-1",
    onOpen && "transition-colors hover:bg-accent/60",
  );

  if (!onOpen) {
    return (
      <div className={className} aria-label={`${label} ${done} de ${total}`}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={className}
      aria-label={`${label} ${done} de ${total}`}
    >
      {inner}
    </button>
  );
}

export function DayProgress({
  routineDone,
  routineTotal,
  customDone,
  customTotal,
  todoDone,
  todoTotal,
  minutes,
  onOpenHabits,
  onOpenTodos,
}: {
  routineDone: number;
  routineTotal: number;
  customDone: number;
  customTotal: number;
  todoDone: number;
  todoTotal: number;
  minutes: number;
  onOpenHabits: () => void;
  onOpenTodos: () => void;
}) {
  return (
    <section className="alba-enter alba-enter-1 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">Progreso del día</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatMinutes(minutes)} en rutina
        </p>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-1">
        <RingStat
          label="Hábitos"
          done={customDone}
          total={customTotal}
          onOpen={onOpenHabits}
        />
        <RingStat
          label="Rutina"
          done={routineDone}
          total={routineTotal}
        />
        <RingStat
          label="To-Do"
          done={todoDone}
          total={todoTotal}
          onOpen={onOpenTodos}
        />
      </div>
    </section>
  );
}
