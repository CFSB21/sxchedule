import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HabitFormDialog, type HabitDraft } from "@/components/habit-form";
import { HABIT_ICONS } from "@/lib/alba/icons";
import { nameForDays, templateIsDirty } from "@/lib/alba/schedule";
import { useRoutineStore } from "@/lib/alba/store";
import {
  DAY_LABELS,
  DAY_NAMES,
  DAY_PART_LABEL,
  DAY_PART_ORDER,
} from "@/lib/alba/time";
import type { RoutineTemplate, TemplateActivity } from "@/lib/alba/types";
import { cn } from "@/lib/utils";

export function RoutineEditor() {
  const templates = useRoutineStore((s) => s.templates);
  const dayParts = useRoutineStore((s) => s.settings.dayParts);
  const addTemplate = useRoutineStore((s) => s.addTemplate);
  const updateTemplate = useRoutineStore((s) => s.updateTemplate);
  const deleteTemplate = useRoutineStore((s) => s.deleteTemplate);
  const addTemplateActivity = useRoutineStore((s) => s.addTemplateActivity);
  const updateTemplateActivity = useRoutineStore(
    (s) => s.updateTemplateActivity,
  );
  const deleteTemplateActivity = useRoutineStore(
    (s) => s.deleteTemplateActivity,
  );
  const moveTemplateActivity = useRoutineStore((s) => s.moveTemplateActivity);
  const applyTemplate = useRoutineStore((s) => s.applyTemplate);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = templates.find((t) => t.id === selectedId) ?? null;

  if (selected) {
    return (
      <TemplateDetail
        template={selected}
        dayPartNames={Object.fromEntries(
          dayParts.map((p) => [p.id, p.name]),
        ) as Record<string, string>}
        onBack={() => setSelectedId(null)}
        onRename={(name) => updateTemplate(selected.id, { name })}
        onDays={(days) => updateTemplate(selected.id, { days })}
        onAddActivity={(draft) => addTemplateActivity(selected.id, draft)}
        onUpdateActivity={(id, draft) =>
          updateTemplateActivity(selected.id, id, draft)
        }
        onDeleteActivity={(id) => deleteTemplateActivity(selected.id, id)}
        onMoveActivity={(id, dir) =>
          moveTemplateActivity(selected.id, id, dir)
        }
        onApply={() => {
          if (selected.days.length === 0) {
            toast.error("Elige al menos un día");
            return;
          }
          applyTemplate(selected.id);
          toast.success("Aplicada desde hoy. El pasado no cambia.");
        }}
        onDelete={() => {
          deleteTemplate(selected.id);
          setSelectedId(null);
          toast.success("Plantilla eliminada");
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="alba-enter flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Rutina</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plantillas por días de la semana. Al aplicar, solo cambian hoy y
            lo que sigue.
          </p>
        </div>
        <Button
          onClick={() => {
            const id = addTemplate();
            setSelectedId(id);
          }}
        >
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="alba-enter alba-enter-1 mt-24 text-center font-display text-2xl tracking-tight text-muted-foreground/40">
          No hay plantillas
        </p>
      ) : (
        <ul className="alba-enter alba-enter-1 mt-8 space-y-3">
          {templates.map((template) => {
            const dirty = templateIsDirty(template);
            return (
              <li
                key={template.id}
                className="rounded-xl bg-card p-4 shadow-(--shadow-border)"
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(template.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-xl tracking-tight">
                      {template.name}
                    </p>
                    {dirty ? (
                      <span className="text-xs text-muted-foreground">
                        Sin aplicar
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Aplicada
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.days.length === 0
                      ? "Sin días"
                      : nameForDays(template.days)}{" "}
                    · {template.activities.length}{" "}
                    {template.activities.length === 1
                      ? "actividad"
                      : "actividades"}
                  </p>
                  <div className="mt-3 flex gap-1">
                    {DAY_LABELS.map((label, i) => {
                      const on = template.days.includes(i);
                      return (
                        <span
                          key={label}
                          className={cn(
                            "grid size-8 place-items-center rounded-md text-xs font-medium",
                            on
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </button>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedId(template.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => {
                      if (template.days.length === 0) {
                        toast.error("Elige al menos un día");
                        return;
                      }
                      applyTemplate(template.id);
                      toast.success("Aplicada desde hoy. El pasado no cambia.");
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TemplateDetail({
  template,
  dayPartNames,
  onBack,
  onRename,
  onDays,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onMoveActivity,
  onApply,
  onDelete,
}: {
  template: RoutineTemplate;
  dayPartNames: Record<string, string>;
  onBack: () => void;
  onRename: (name: string) => void;
  onDays: (days: number[]) => void;
  onAddActivity: (draft: Omit<HabitDraft, "days">) => void;
  onUpdateActivity: (id: string, draft: Omit<HabitDraft, "days">) => void;
  onDeleteActivity: (id: string) => void;
  onMoveActivity: (id: string, direction: -1 | 1) => void;
  onApply: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateActivity | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = templateIsDirty(template);

  const grouped = DAY_PART_ORDER.map((part) => ({
    part,
    label: dayPartNames[part] ?? DAY_PART_LABEL[part],
    items: template.activities
      .filter((a) => a.dayPart === part)
      .sort((a, b) => a.order - b.order),
  }));

  function toggleDay(day: number) {
    const has = template.days.includes(day);
    const days = has
      ? template.days.filter((d) => d !== day)
      : [...template.days, day].sort();
    onDays(days);
  }

  function save(draft: HabitDraft) {
    const activity = {
      name: draft.name,
      icon: draft.icon,
      durationMin: draft.durationMin,
      dayPart: draft.dayPart,
      scheduledTime: draft.scheduledTime,
      remind: draft.remind,
    };
    if (editing) onUpdateActivity(editing.id, activity);
    else onAddActivity(activity);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="alba-enter">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Plantillas
        </button>
        <Input
          value={template.name}
          onChange={(e) => onRename(e.target.value)}
          className="h-auto border-0 bg-transparent px-0 font-display text-3xl tracking-tight shadow-none focus-visible:ring-0"
          aria-label="Nombre de la plantilla"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Elige los días. Aplicar cambia desde hoy; lo ya pasado se queda.
        </p>
      </div>

      <div className="alba-enter alba-enter-1 mt-6">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Días
        </p>
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((label, i) => {
            const on = template.days.includes(i);
            return (
              <button
                key={label}
                type="button"
                title={DAY_NAMES[i]}
                onClick={() => toggleDay(i)}
                className={cn(
                  "grid h-11 place-items-center rounded-md text-sm font-medium",
                  on
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
                aria-pressed={on}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="alba-enter alba-enter-2 mt-8 space-y-6">
        {grouped.map((group) =>
          group.items.length === 0 ? null : (
            <section key={group.part}>
              <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h2>
              <ul className="space-y-2">
                {group.items.map((activity, index) => {
                  const Icon = HABIT_ICONS[activity.icon];
                  return (
                    <li
                      key={activity.id}
                      className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-(--shadow-border)"
                    >
                      <div className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                        <Icon className="size-4" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(activity);
                          setOpen(true);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate font-medium">{activity.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {activity.scheduledTime
                            ? `${activity.scheduledTime} · `
                            : ""}
                          {activity.durationMin} min
                        </p>
                      </button>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          aria-label="Subir"
                          disabled={index === 0}
                          onClick={() => onMoveActivity(activity.id, -1)}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar"
                          disabled={index === group.items.length - 1}
                          onClick={() => onMoveActivity(activity.id, 1)}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )}
      </div>

      <div className="alba-enter alba-enter-3 mt-6 grid gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Añadir actividad
        </Button>
        <Button onClick={onApply}>
          {dirty ? "Aplicar desde hoy" : "Volver a aplicar"}
        </Button>
        {confirmDelete ? (
          <Button variant="destructive" onClick={onDelete}>
            Confirmar eliminación
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            Eliminar plantilla
          </Button>
        )}
      </div>

      <HabitFormDialog
        open={open}
        onOpenChange={setOpen}
        habit={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                icon: editing.icon,
                durationMin: editing.durationMin,
                dayPart: editing.dayPart,
                scheduledTime: editing.scheduledTime,
                days: template.days.length ? template.days : [1],
                order: editing.order,
                remind: editing.remind,
              }
            : null
        }
        hideDays
        title={editing ? "Editar actividad" : "Nueva actividad"}
        description="Los días los marca la plantilla, no cada actividad."
        onSave={save}
        onDelete={
          editing
            ? () => {
                onDeleteActivity(editing.id);
                toast.success("Actividad quitada");
              }
            : undefined
        }
      />
    </div>
  );
}
