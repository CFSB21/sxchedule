import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Database, ListChecks } from "lucide-react";
import { BrandMark } from "@/components/alba-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { rehydrateRoutineStore, useRoutineStore } from "@/lib/alba/store";
import { applyTheme } from "@/lib/alba/theme";
import { currentStreak } from "@/lib/alba/stats";
import { cn } from "@/lib/utils";
import { SessionDock } from "@/components/session-dock";
import { ReminderHost } from "@/components/reminder-host";

const NAV = [
  { to: "/", label: "Hoy", icon: CalendarDays },
  { to: "/rutina", label: "Rutina", icon: ListChecks },
  { to: "/stats", label: "Estadísticas", icon: BarChart3 },
  { to: "/datos", label: "Datos", icon: Database },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme(useRoutineStore.getState().settings.theme);
    void Promise.resolve(rehydrateRoutineStore()).then(() => {
      applyTheme(useRoutineStore.getState().settings.theme);
    });
    return useRoutineStore.subscribe((state, prev) => {
      if (state.settings.theme !== prev.settings.theme) {
        applyTheme(state.settings.theme);
      }
    });
  }, []);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const streak = currentStreak(habits, completions);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden md:flex md:flex-col md:border-r md:border-border md:bg-card md:px-5 md:py-6">
        <div className="flex items-start justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <div>
              <p className="font-display text-xl leading-none tracking-tight">
                {APP_NAME}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-(--motion-quick)",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg bg-secondary px-4 py-3">
          <p className="text-xs text-muted-foreground">Racha actual</p>
          <p className="mt-0.5 font-display text-2xl tabular-nums leading-none">
            {streak}
            <span className="ml-1 text-sm text-muted-foreground">días</span>
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-1 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark className="size-7 shrink-0" />
            <span className="font-display text-lg tracking-tight">
              {APP_NAME}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <p className="pr-1 text-sm tabular-nums text-muted-foreground">
              Racha {streak}
            </p>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 pb-28 md:px-8 md:pt-8 md:pb-16">
          {children}
        </main>
        <ReminderHost />
        <SessionDock />
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
          <div className="grid grid-cols-4">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
