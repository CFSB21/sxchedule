import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md bg-card px-3 text-base text-foreground shadow-(--shadow-border) outline-none transition-[box-shadow] duration-(--motion-quick) placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
