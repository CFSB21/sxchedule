import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, Download, Smartphone, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBackup, readBackupFile } from "@/lib/alba/backup";
import {
  isNativeApp,
  requestNotificationPermission,
  showLocalNotice,
  upcomingReminders,
} from "@/lib/alba/notifications";
import { useRoutineStore } from "@/lib/alba/store";
import { pad2, todayKey } from "@/lib/alba/time";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const LEAD_OPTIONS = [0, 5, 10, 15, 30];
const GITHUB_REPO = "https://github.com/CFSB21/sxchedule";
const APK_URL = "https://github.com/CFSB21/sxchedule/releases/latest";

export function DatosView() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const settings = useRoutineStore((s) => s.settings);
  const exportBackup = useRoutineStore((s) => s.exportBackup);
  const replaceFromBackup = useRoutineStore((s) => s.replaceFromBackup);
  const mergeFromBackup = useRoutineStore((s) => s.mergeFromBackup);
  const updateSettings = useRoutineStore((s) => s.updateSettings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const upcoming = upcomingReminders(habits, completions, settings).slice(0, 6);

  async function exportNow() {
    try {
      await downloadBackup(exportBackup(), `sxchedule-${todayKey()}.json`);
      toast.success(
        isNativeApp()
          ? "Elige dónde guardar el respaldo"
          : "Respaldo descargado",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/cancel/i.test(msg)) return;
      toast.error("No se pudo exportar");
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      if (mode === "replace") replaceFromBackup(backup);
      else mergeFromBackup(backup);
      toast.success(
        mode === "replace"
          ? "Datos reemplazados"
          : `Importados ${backup.habits.length} hábitos`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo importar");
    }
  }

  async function enableNotifs() {
    const ok = await requestNotificationPermission();
    if (!ok) {
      toast.error("El sistema bloqueó las notificaciones");
      return;
    }
    updateSettings({ notificationsEnabled: true });
    toast.success(
      isNativeApp()
        ? "Alarmas activadas en el dispositivo"
        : "Avisos activados en este navegador",
    );
  }

  async function testNotice() {
    const ok =
      settings.notificationsEnabled || (await requestNotificationPermission());
    if (!ok) {
      toast.error("Activa los avisos primero");
      return;
    }
    if (!settings.notificationsEnabled) {
      updateSettings({ notificationsEnabled: true });
    }
    toast("Es la hora de Meditación");
    await showLocalNotice(APP_NAME, "Aviso de prueba");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="alba-enter">
        <h1 className="font-display text-3xl tracking-tight">Datos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guardado automático, respaldos y avisos a la hora de cada hábito.
        </p>
      </div>

      <section className="alba-enter alba-enter-1 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <h2 className="font-medium">Guardado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La rutina y el historial se guardan solos en este dispositivo. Un
          respaldo JSON te permite llevarlos a otro teléfono o recuperarlos.
        </p>
        <p className="mt-3 text-sm tabular-nums text-muted-foreground">
          {habits.length} hábitos · {completions.length} registros
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void exportNow()}>
            <Download className="size-4" />
            Exportar respaldo
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Importar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setMode("replace")}
            className={cn(
              "h-11 rounded-md text-sm font-medium",
              mode === "replace"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            Reemplazar
          </button>
          <button
            type="button"
            onClick={() => setMode("merge")}
            className={cn(
              "h-11 rounded-md text-sm font-medium",
              mode === "merge"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            Fusionar
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Reemplazar borra lo actual. Fusionar añade hábitos e historial que aún
          no existen.
        </p>
      </section>

      <section className="alba-enter alba-enter-2 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Avisos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isNativeApp()
                ? "En el APK se programan alarmas del sistema, aunque cierres la app."
                : "En la web suenan si la app está abierta. El APK de Android usa alarmas nativas."}
            </p>
          </div>
          <Bell className="size-5 text-primary" />
        </div>

        <label className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-3">
          <span className="text-sm">Activar avisos</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.notificationsEnabled}
            onClick={() => {
              if (settings.notificationsEnabled) {
                updateSettings({ notificationsEnabled: false });
              } else {
                void enableNotifs();
              }
            }}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors",
              settings.notificationsEnabled ? "bg-primary" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-6 rounded-full bg-card transition-transform",
                settings.notificationsEnabled && "translate-x-5",
              )}
            />
          </button>
        </label>

        <p className="mt-4 text-sm font-medium">Avisar con antelación</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LEAD_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateSettings({ minutesBefore: n })}
              className={cn(
                "h-11 min-w-14 rounded-md px-3 text-sm font-medium",
                settings.minutesBefore === n
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {n === 0 ? "En punto" : `${n} min`}
            </button>
          ))}
        </div>

        <Button variant="outline" className="mt-4" onClick={() => void testNotice()}>
          Probar aviso
        </Button>

        <div className="mt-5">
          <p className="text-sm font-medium">Próximos avisos</p>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No hay hábitos con hora programada pendientes.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {upcoming.map((item) => (
                <li
                  key={`${item.habitId}-${item.dateKey}`}
                  className="flex items-baseline justify-between gap-3 py-2 text-sm"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {item.dateKey.slice(5)} · {pad2(item.at.getHours())}:
                    {pad2(item.at.getMinutes())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="alba-enter alba-enter-3 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Android</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El código está en GitHub. Cada publicación genera un APK listo
              para instalar en el teléfono.
            </p>
          </div>
          <Smartphone className="size-5 text-primary" />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <a href={APK_URL} target="_blank" rel="noreferrer">
              <Download className="size-4" />
              Descargar APK
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={GITHUB_REPO} target="_blank" rel="noreferrer">
              Ver en GitHub
            </a>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Permite apps de origen desconocido al instalar. Si Android pide
          permiso de alarmas, acéptalo para que los avisos suenen con la app
          cerrada.
        </p>
      </section>
    </div>
  );
}
