import { cn } from "@/lib/utils";

export function AlbaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 text-primary", className)}
      aria-hidden
    >
      <path
        d="M5 23.5h22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 23.5c2.8-8 13.2-8 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="10.5" r="2.6" fill="currentColor" />
    </svg>
  );
}
