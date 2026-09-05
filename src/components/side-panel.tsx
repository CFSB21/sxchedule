import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidePanel({
  open,
  side,
  title,
  subtitle,
  headerAction,
  onClose,
  children,
}: {
  open: boolean;
  side: "left" | "right";
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50",
        open && "pointer-events-auto",
      )}
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Cerrar panel"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-overlay transition-opacity duration-(--motion-fast) ease-(--ease-out)",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-y-0 flex w-1/2 min-w-56 max-w-sm flex-col bg-card text-card-foreground shadow-(--shadow-border) transition-transform duration-(--motion-fast) ease-(--ease-out)",
          side === "left" ? "left-0" : "right-0",
          open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h2 className="font-display text-xl tracking-tight">{title}</h2>
              {headerAction}
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </aside>
    </div>
  );
}
