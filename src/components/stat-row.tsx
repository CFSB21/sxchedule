import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatRow({
  rank,
  icon: Icon,
  name,
  value,
  bar,
  footer,
}: {
  rank?: number;
  icon: LucideIcon;
  name: string;
  value: ReactNode;
  bar: number;
  footer?: ReactNode;
}) {
  const pct = Math.min(100, Math.max(0, bar));
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      {rank != null ? (
        <span className="mt-2 w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
          {rank}
        </span>
      ) : null}
      <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <p className="min-w-0 flex-1 text-sm font-medium break-words">
            {name}
          </p>
          <p className="min-w-16 shrink-0 pt-px text-right text-sm tabular-nums leading-snug whitespace-nowrap">
            {value}
          </p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
        {footer ? (
          <div className="mt-1 text-xs leading-snug text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </li>
  );
}
