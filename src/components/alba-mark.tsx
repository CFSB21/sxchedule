import { cn } from "@/lib/utils";

/** Geometric interlocking-C “S” brand mark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 44"
      className={cn("size-8 text-primary", className)}
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="8.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 21 H31 A6.5 6.5 0 0 0 37.5 14.5 V8.2 A6.5 6.5 0 0 0 31 1.7 H10.2 A6.5 6.5 0 0 0 3.7 8.2 V14" />
        <path d="M30 23 H9 A6.5 6.5 0 0 0 2.5 29.5 V35.8 A6.5 6.5 0 0 0 9 42.3 H29.8 A6.5 6.5 0 0 0 36.3 35.8 V30" />
      </g>
    </svg>
  );
}
