import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 112,
  stroke = 8,
  className,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value));
  const offset = c * (1 - clamped);

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-secondary"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-primary"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition:
              "stroke-dashoffset var(--motion-slow) var(--ease-smooth-out)",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
