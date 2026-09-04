import { Moon, Sun } from "lucide-react";
import { applyTheme } from "@/lib/alba/theme";
import { useRoutineStore } from "@/lib/alba/store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useRoutineStore((s) => s.settings.theme);
  const updateSettings = useRoutineStore((s) => s.updateSettings);
  const dark = theme === "dark";

  function toggle() {
    const next = dark ? "light" : "dark";
    applyTheme(next);
    updateSettings({ theme: next });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={dark}
      className={cn(
        "grid size-11 place-items-center rounded-md text-muted-foreground transition-colors duration-(--motion-quick) hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
