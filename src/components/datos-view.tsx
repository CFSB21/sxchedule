import { useRef, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Bell, ChevronRight, Download, Palette, Smartphone, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { YearSelect } from "@/components/year-select";
import { downloadBackup, readBackupFile } from "@/lib/alba/backup";
import {
  isNativeApp,
  requestNotificationPermission,
  showLocalNotice,
  upcomingReminders,
} from "@/lib/alba/notifications";
import {
  DEFAULT_PALETTE,
  PALETTE_FIELDS,
  isHex,
  type Palette as AppPalette,
} from "@/lib/alba/palette";
import { useRoutineStore } from "@/lib/alba/store";
import { pad2, todayKey } from "@/lib/alba/time";
import { APP_NAME, APP_VERSION } from "@/lib/brand";
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
  const clearAll = useRoutineStore((s) => s.clearAll);
  const updateSettings = useRoutineStore((s) => s.updateSettings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
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
      replaceFromBackup(backup);
      toast.success("Datos reemplazados");
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
        <h1 className="font-display text-3xl tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Colores, respaldos y avisos. Todo se guarda en este dispositivo.
        </p>
      </div>

      <AppearanceCard
        palette={settings.palette}
        onChange={(palette) => updateSettings({ palette })}
        onReset={() => updateSettings({ palette: undefined })}
      />

      <section className="alba-enter alba-enter-2 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-primary">
            <BarChart3 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-medium">Año de Stats</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Un año concreto, o todo el histórico. Las metas se quedan en el
              año en que las creaste.
            </p>
          </div>
        </div>
        <YearSelect className="mt-4" />
      </section>

      <section className="alba-enter alba-enter-3 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
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
        <p className="mt-2 text-xs text-muted-foreground">
          Al importar se reemplaza todo lo actual.
        </p>
        <Button
          variant="destructive"
          className="mt-4 w-full sm:w-auto"
          onClick={() => {
            if (!confirmWipe) {
              setConfirmWipe(true);
              return;
            }
            clearAll();
            setConfirmWipe(false);
            toast.success("Datos borrados");
          }}
        >
          <Trash2 className="size-4" />
          {confirmWipe ? "Confirmar borrado" : "Borrar todos los datos"}
        </Button>
        {confirmWipe ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Esto no se puede deshacer. Exporta un respaldo antes.
          </p>
        ) : null}
      </section>

      <section className="alba-enter alba-enter-3 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
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

      <section className="alba-enter alba-enter-4 mt-6 rounded-xl bg-card p-5 shadow-(--shadow-border)">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Android</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Versión {APP_VERSION}. El código está en GitHub. Cada publicación
              genera un APK listo para instalar en el teléfono.
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

function AppearanceCard({
  palette,
  onChange,
  onReset,
}: {
  palette?: AppPalette;
  onChange: (palette: AppPalette) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const current = { ...DEFAULT_PALETTE, ...palette };

  function setKey(key: keyof AppPalette, value: string) {
    if (!isHex(value)) return;
    onChange({ ...current, [key]: value.toLowerCase() });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="alba-enter alba-enter-1 mt-6 flex w-full items-center gap-3 rounded-xl bg-card p-5 text-left shadow-(--shadow-border) transition-colors hover:bg-accent/40"
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-primary">
          <Palette className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">Apariencia</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Colores de la app
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apariencia</DialogTitle>
            <DialogDescription>
              El contraste del texto sobre el principal se calcula solo.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {PALETTE_FIELDS.map((field) => (
              <li
                key={field.key}
                className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2"
              >
                <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-md shadow-(--shadow-border)">
                  <span className="sr-only">{field.label}</span>
                  <input
                    type="color"
                    value={current[field.key]}
                    onChange={(e) => setKey(field.key, e.target.value)}
                    className="absolute -inset-2 size-[180%] cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{field.label}</p>
                  <input
                    value={current[field.key]}
                    onChange={(e) => {
                      const next = e.target.value.trim();
                      if (isHex(next)) setKey(field.key, next);
                    }}
                    spellCheck={false}
                    className="mt-0.5 w-full bg-transparent text-xs tabular-nums text-muted-foreground outline-none"
                    aria-label={`${field.label} hexadecimal`}
                  />
                </div>
              </li>
            ))}
          </ul>
          <Button variant="outline" onClick={onReset}>
            Restablecer colores
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
