import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DAY_NAMES,
  WEEK_DAY_INDEX_MON,
  WEEK_LABELS_MON,
  fromDateKey,
  shiftDateKey,
  weekKeysMonday,
} from "@/lib/alba/time";
import { cn } from "@/lib/utils";

export function WeekStrip({
  date,
  today,
  live,
  onDateChange,
}: {
  date: string;
  today: string;
  live: boolean;
  onDateChange: (next: string) => void;
}) {
  const keys = weekKeysMonday(date);
  const weekStart = keys[0]!;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Semana anterior"
        onClick={() => onDateChange(shiftDateKey(weekStart, -7))}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <div className="grid min-w-0 flex-1 grid-cols-7 gap-1">
        {keys.map((key, i) => {
          const label = WEEK_LABELS_MON[i]!;
          const jsDay = WEEK_DAY_INDEX_MON[i]!;
          const isToday = live && key === today;
          const isSelected = key === date;
          const isFuture = live && key > today;
          const isPast = live && key < today;
          const dayNum = fromDateKey(key).getDate();
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDateChange(key)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              aria-label={`${DAY_NAMES[jsDay]} ${dayNum}${isToday ? ", hoy" : isPast ? ", pasado" : isFuture ? ", siguiente" : ""}`}
              className={cn(
                "flex h-14 flex-col items-center justify-center rounded-lg text-xs transition-colors duration-(--motion-quick)",
                isToday && "bg-primary text-primary-foreground",
                !isToday &&
                  isSelected &&
                  "bg-accent text-foreground shadow-(--shadow-border)",
                !isToday &&
                  !isSelected &&
                  !isFuture &&
                  "text-foreground hover:bg-accent",
                !isToday &&
                  !isSelected &&
                  isFuture &&
                  "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "font-medium tracking-wide",
                  !isToday && "text-muted-foreground",
                  isToday && "text-primary-foreground/80",
                  isSelected && !isToday && "text-foreground",
                )}
              >
                {label}
              </span>
              <span className="mt-0.5 grid size-5 place-items-center">
                {isPast ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="text-xs tabular-nums leading-none">
                    {dayNum}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Semana siguiente"
        onClick={() => onDateChange(shiftDateKey(weekStart, 7))}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
