import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 text-primary", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M21.6 11c-.9-1.5-2.7-2.4-5-2.4-3.3 0-5.4 1.9-5.4 4.3 0 2.4 1.7 3.6 5.1 4.4l1.2.3c2.4.6 3.4 1.3 3.4 2.7 0 1.6-1.5 2.7-3.8 2.7-1.9 0-3.4-.7-4.3-1.8"
        fill="none"
        stroke="var(--color-primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
