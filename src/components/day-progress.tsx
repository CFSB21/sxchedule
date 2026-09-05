import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMinutes } from "@/lib/alba/time";

function Meter({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-(--motion-slow) ease-(--ease-smooth-out)"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Row({
  label,
  done,
  total,
  onOpen,
  side,
}: {
  label: string;
  done: number;
  total: number;
  onOpen?: () => void;
  side?: "left" | "right";
}) {
  const inner = (
    <>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-medium">
          {side === "left" ? (
            <ChevronLeft className="size-3.5 text-muted-foreground" />
          ) : null}
          {label}
          {side === "right" ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : null}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {done}/{total}
        </span>
      </div>
      <Meter value={total === 0 ? 0 : done / total} />
    </>
  );

  if (!onOpen) {
    return <div className="py-1">{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block min-h-11 w-full rounded-md py-1 text-left transition-colors hover:bg-accent/60"
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
      <div className="mt-4 grid gap-3">
        <Row label="Rutina" done={routineDone} total={routineTotal} />
        <Row
          label="Hábitos"
          done={customDone}
          total={customTotal}
          onOpen={onOpenHabits}
          side="left"
        />
        <Row
          label="To-Do"
          done={todoDone}
          total={todoTotal}
          onOpen={onOpenTodos}
          side="right"
        />
      </div>
    </section>
  );
}
