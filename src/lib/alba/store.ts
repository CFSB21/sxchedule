import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSeed, defaultPassiveHabits, defaultTemplates } from "./seed";
import {
  defaultDayPartSchedules,
  normalizeDayParts,
  partsForDate,
  schedulesFromParts,
  setDayPartsAt,
} from "./day-parts";
import { overrideFor } from "./overrides";
import {
  applyTemplateToHabits,
  closeFrom,
  isOpen,
  normalizeHabit,
  normalizePassive,
  punchHole,
  stampApplied,
  templatesFromHabits,
} from "./schedule";
import { normalizePalette } from "./palette";
import {
  childrenOf,
  isGroup,
  moveAmong,
  nextOrder,
  normalizeTodo,
} from "./todos";
import type {
  AlbaBackup,
  Completion,
  CompletionStatus,
  DayOverride,
  DayPart,
  DayPartConfig,
  DayPartSchedule,
  Habit,
  HabitIconId,
  PassiveCheck,
  PassiveHabit,
  RoutineTemplate,
  Session,
  Settings,
  TemplateActivity,
  TodoItem,
  TodoKind,
  YearGoal,
  YearGoalKind,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { fromDateKey, todayKey } from "./time";
import { completionFor, completionForLineage } from "./stats";

type HabitDraft = {
  name: string;
  icon: HabitIconId;
  durationMin: number;
  dayPart: DayPart;
  scheduledTime: string | null;
  days: number[];
  remind: boolean;
};

type PassiveDraft = {
  name: string;
  icon: HabitIconId;
  days: number[];
};

type ActivityDraft = {
  name: string;
  icon: HabitIconId;
  durationMin: number;
  dayPart: DayPart;
  scheduledTime: string | null;
  remind: boolean;
};

const seed = createSeed();

type State = {
  habits: Habit[];
  completions: Completion[];
  passiveHabits: PassiveHabit[];
  passiveChecks: PassiveCheck[];
  todos: TodoItem[];
  dayOverrides: DayOverride[];
  templates: RoutineTemplate[];
  dayPartSchedules: DayPartSchedule[];
  goals: YearGoal[];
  settings: Settings;
  initialized: boolean;
  session: Session | null;
  addHabit: (draft: HabitDraft) => void;
  updateHabit: (id: string, draft: HabitDraft) => void;
  deleteHabit: (id: string) => void;
  moveHabit: (id: string, direction: -1 | 1) => void;
  toggleComplete: (habitId: string, date: string) => void;
  recordOutcome: (
    habitId: string,
    date: string,
    status: CompletionStatus,
    excuse?: string,
  ) => void;
  startSession: (habitId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: (outcome?: {
    status?: CompletionStatus;
    excuse?: string;
  }) => void;
  cancelSession: () => void;
  restoreDemo: () => void;
  clearAll: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateDayPart: (
    id: DayPart,
    patch: Partial<DayPartConfig>,
    date: string,
  ) => void;
  addPassiveHabit: (draft: PassiveDraft, date: string) => void;
  updatePassiveHabit: (id: string, draft: PassiveDraft, date: string) => void;
  deletePassiveHabit: (id: string, date: string) => void;
  togglePassiveCheck: (habitId: string, date: string) => void;
  addTodo: (
    date: string,
    title: string,
    opts?: { kind?: TodoKind; parentId?: string },
  ) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, title: string) => void;
  deleteTodo: (id: string) => void;
  moveTodo: (id: string, direction: -1 | 1) => void;
  addGoal: (draft: {
    kind: YearGoalKind;
    name: string;
    targetHours?: number;
  }) => void;
  updateGoal: (
    id: string,
    draft: { kind: YearGoalKind; name: string; targetHours?: number },
  ) => void;
  deleteGoal: (id: string) => void;
  setDayOverride: (
    habitId: string,
    date: string,
    patch: Partial<Omit<DayOverride, "id" | "habitId" | "date">>,
  ) => void;
  clearDayOverride: (habitId: string, date: string) => void;
  addTemplate: (name?: string) => string;
  updateTemplate: (
    id: string,
    patch: Partial<Pick<RoutineTemplate, "name" | "days">>,
  ) => void;
  deleteTemplate: (id: string) => void;
  addTemplateActivity: (templateId: string, draft: ActivityDraft) => void;
  updateTemplateActivity: (
    templateId: string,
    activityId: string,
    draft: ActivityDraft,
  ) => void;
  deleteTemplateActivity: (templateId: string, activityId: string) => void;
  moveTemplateActivity: (
    templateId: string,
    activityId: string,
    direction: -1 | 1,
  ) => void;
  applyTemplate: (id: string) => void;
  exportBackup: () => AlbaBackup;
  replaceFromBackup: (backup: AlbaBackup) => void;
  mergeFromBackup: (backup: AlbaBackup) => void;
};

function elapsedMs(session: Session, now = Date.now()) {
  return session.accumulatedMs + (session.running ? now - session.startedAt : 0);
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

export { elapsedMs };

function patchTemplate(
  templates: RoutineTemplate[],
  id: string,
  fn: (t: RoutineTemplate) => RoutineTemplate,
) {
  return templates.map((t) => (t.id === id ? fn(t) : t));
}

export const useRoutineStore = create<State>()(
  persist(
    (set, get) => ({
      habits: seed.habits,
      completions: seed.completions,
      passiveHabits: seed.passiveHabits,
      passiveChecks: seed.passiveChecks,
      todos: seed.todos,
      dayOverrides: seed.dayOverrides,
      templates: seed.templates,
      dayPartSchedules: seed.dayPartSchedules,
      goals: seed.goals,
      settings: DEFAULT_SETTINGS,
      initialized: true,
      session: null,

      addHabit: (draft) =>
        set((s) => {
          const order = s.habits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
          const id = newId("h");
          const habit: Habit = {
            id,
            lineageId: id,
            ...draft,
            name: draft.name.trim(),
            order,
            activeFrom: todayKey(),
            activeUntil: null,
          };
          return { habits: [...s.habits, habit] };
        }),

      updateHabit: (id, draft) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id ? { ...h, ...draft, name: draft.name.trim() } : h,
          ),
        })),

      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id && isOpen(h) ? closeFrom(h, todayKey()) : h,
          ),
          session: s.session?.habitId === id ? null : s.session,
        })),

      moveHabit: (id, direction) =>
        set((s) => {
          const target = s.habits.find((h) => h.id === id);
          if (!target) return s;
          const group = s.habits
            .filter((h) => h.dayPart === target.dayPart && isOpen(h))
            .sort((a, b) => a.order - b.order);
          const idx = group.findIndex((h) => h.id === id);
          const swap = group[idx + direction];
          if (!swap) return s;
          return {
            habits: s.habits.map((h) => {
              if (h.id === target.id) return { ...h, order: swap.order };
              if (h.id === swap.id) return { ...h, order: target.order };
              return h;
            }),
          };
        }),

      toggleComplete: (habitId, date) =>
        set((s) => {
          const habit = s.habits.find((h) => h.id === habitId);
          const existing = habit
            ? completionForLineage(s.completions, s.habits, habit, date)
            : completionFor(s.completions, habitId, date);
          if (existing) {
            return {
              completions: s.completions.filter((c) => c.id !== existing.id),
            };
          }
          const over = overrideFor(s.dayOverrides, habitId, date);
          const next: Completion = {
            id: `c-${date}-${habitId}`,
            habitId,
            date,
            durationMin: over?.durationMin ?? habit?.durationMin ?? 10,
            completedAt: new Date().toISOString(),
            status: "done",
          };
          return { completions: [...s.completions, next] };
        }),

      recordOutcome: (habitId, date, status, excuse) =>
        set((s) => {
          if (status === "failed" && !excuse?.trim()) return s;
          const habit = s.habits.find((h) => h.id === habitId);
          const over = overrideFor(s.dayOverrides, habitId, date);
          const existing = habit
            ? completionForLineage(s.completions, s.habits, habit, date)
            : completionFor(s.completions, habitId, date);
          const row: Completion = {
            id: existing?.id ?? `c-${date}-${habitId}`,
            habitId,
            date,
            durationMin:
              status === "failed"
                ? 0
                : (over?.durationMin ?? habit?.durationMin ?? 10),
            completedAt: new Date().toISOString(),
            status,
            excuse: status === "failed" ? excuse!.trim() : undefined,
          };
          return {
            completions: existing
              ? s.completions.map((c) => (c.id === existing.id ? row : c))
              : [...s.completions, row],
            session:
              s.session?.habitId === habitId && date === todayKey()
                ? null
                : s.session,
          };
        }),

      startSession: (habitId) =>
        set({
          session: {
            habitId,
            startedAt: Date.now(),
            accumulatedMs: 0,
            running: true,
          },
        }),

      pauseSession: () =>
        set((s) => {
          if (!s.session || !s.session.running) return s;
          return {
            session: {
              ...s.session,
              accumulatedMs: elapsedMs(s.session),
              running: false,
              startedAt: Date.now(),
            },
          };
        }),

      resumeSession: () =>
        set((s) => {
          if (!s.session || s.session.running) return s;
          return {
            session: { ...s.session, running: true, startedAt: Date.now() },
          };
        }),

      finishSession: (outcome) => {
        const { session, habits, dayOverrides } = get();
        if (!session) return;
        const status: CompletionStatus = outcome?.status ?? "done";
        if (status === "failed" && !outcome?.excuse?.trim()) return;
        const habit = habits.find((h) => h.id === session.habitId);
        const minutes = Math.max(1, Math.round(elapsedMs(session) / 60000));
        const date = todayKey();
        const over = overrideFor(dayOverrides, session.habitId, date);
        set((s) => {
          const existing = completionFor(s.completions, session.habitId, date);
          const row: Completion = {
            id: existing?.id ?? `c-${date}-${session.habitId}`,
            habitId: session.habitId,
            date,
            durationMin:
              status === "failed"
                ? 0
                : over?.durationMin ??
                  (habit ? Math.max(1, minutes) : minutes),
            completedAt: new Date().toISOString(),
            status,
            excuse: status === "failed" ? outcome?.excuse?.trim() : undefined,
          };
          return {
            session: null,
            completions: existing
              ? s.completions.map((c) => (c.id === existing.id ? row : c))
              : [...s.completions, row],
          };
        });
      },

      cancelSession: () => set({ session: null }),

      restoreDemo: () => {
        const seeded = createSeed();
        set({
          ...seeded,
          session: null,
          initialized: true,
          settings: DEFAULT_SETTINGS,
        });
      },

      clearAll: () =>
        set({
          habits: [],
          completions: [],
          passiveHabits: [],
          passiveChecks: [],
          todos: [],
          dayOverrides: [],
          templates: [],
          dayPartSchedules: defaultDayPartSchedules(),
          goals: [],
          settings: DEFAULT_SETTINGS,
          session: null,
          initialized: true,
        }),

      updateSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            dayParts: normalizeDayParts(patch.dayParts ?? s.settings.dayParts),
            theme: "dark",
            palette:
              "palette" in patch
                ? normalizePalette(patch.palette)
                : s.settings.palette,
          },
        })),

      updateDayPart: (id, patch, date) =>
        set((s) => {
          const today = todayKey();
          const current = partsForDate(
            s.dayPartSchedules,
            date,
            s.settings.dayParts,
          );
          const parts = normalizeDayParts(
            current.map((p) =>
              p.id === id
                ? {
                    ...p,
                    ...patch,
                    name: (patch.name ?? p.name).trim() || p.name,
                  }
                : p,
            ),
          );
          const schedules = setDayPartsAt(
            s.dayPartSchedules,
            date,
            parts,
            () => newId("dps"),
            date < today ? "day" : "forward",
          );
          return {
            dayPartSchedules: schedules,
            settings: {
              ...s.settings,
              dayParts: partsForDate(schedules, today, parts),
            },
          };
        }),

      addPassiveHabit: (draft, date) =>
        set((s) => {
          const today = todayKey();
          const past = date < today;
          const order =
            s.passiveHabits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
          const habit: PassiveHabit = {
            id: newId("p"),
            name: draft.name.trim(),
            icon: draft.icon,
            days: past ? [fromDateKey(date).getDay()] : draft.days,
            order,
            activeFrom: date,
            activeUntil: past ? date : null,
          };
          return { passiveHabits: [...s.passiveHabits, habit] };
        }),

      updatePassiveHabit: (id, draft, date) =>
        set((s) => {
          const today = todayKey();
          const from = date < today ? today : date;
          const habit = s.passiveHabits.find((h) => h.id === id);
          if (!habit) return s;
          const start = habit.activeFrom ?? "0000-01-01";
          if (isOpen(habit) && start >= from) {
            return {
              passiveHabits: s.passiveHabits.map((h) =>
                h.id === id
                  ? {
                      ...h,
                      name: draft.name.trim(),
                      icon: draft.icon,
                      days: draft.days,
                    }
                  : h,
              ),
            };
          }
          const next: PassiveHabit[] = [];
          for (const h of s.passiveHabits) {
            if (h.id !== id) {
              next.push(h);
              continue;
            }
            next.push(closeFrom(h, from));
            next.push({
              ...h,
              id: newId("p"),
              name: draft.name.trim(),
              icon: draft.icon,
              days: draft.days,
              activeFrom: from,
              activeUntil: null,
            });
          }
          return { passiveHabits: next };
        }),

      deletePassiveHabit: (id, date) =>
        set((s) => {
          const today = todayKey();
          if (date < today) {
            return {
              passiveHabits: s.passiveHabits.flatMap((h) =>
                h.id === id ? punchHole(h, date, () => newId("p")) : [h],
              ),
            };
          }
          return {
            passiveHabits: s.passiveHabits.map((h) =>
              h.id === id && isOpen(h) ? closeFrom(h, date) : h,
            ),
          };
        }),

      togglePassiveCheck: (habitId, date) =>
        set((s) => {
          const existing = s.passiveChecks.find(
            (c) => c.habitId === habitId && c.date === date,
          );
          if (existing) {
            return {
              passiveChecks: s.passiveChecks.filter((c) => c.id !== existing.id),
            };
          }
          return {
            passiveChecks: [
              ...s.passiveChecks,
              { id: `pc-${date}-${habitId}`, habitId, date },
            ],
          };
        }),

      addTodo: (date, title, opts) =>
        set((s) => {
          const trimmed = title.trim();
          if (!trimmed) return s;
          const parentId = opts?.parentId;
          const kind: TodoKind =
            opts?.kind === "group" && !parentId ? "group" : "task";
          const siblings = s.todos.filter((t) =>
            parentId
              ? t.parentId === parentId
              : t.date === date && !t.parentId,
          );
          const item: TodoItem = {
            id: newId("td"),
            date,
            title: trimmed,
            done: false,
            order: nextOrder(siblings),
            kind,
            parentId,
          };
          return { todos: [...s.todos, item] };
        }),

      toggleTodo: (id) =>
        set((s) => {
          const item = s.todos.find((t) => t.id === id);
          if (!item || isGroup(item)) return s;
          const nextDone = !item.done;
          return {
            todos: s.todos.map((t) => {
              if (t.id === id) return { ...t, done: nextDone };
              if (isGroup(t) && t.id === item.parentId) {
                const siblings = childrenOf(s.todos, t.id);
                const all = siblings.every((x) =>
                  x.id === id ? nextDone : x.done,
                );
                return { ...t, done: all };
              }
              return t;
            }),
          };
        }),

      updateTodo: (id, title) =>
        set((s) => {
          const trimmed = title.trim();
          if (!trimmed) return s;
          return {
            todos: s.todos.map((t) =>
              t.id === id ? { ...t, title: trimmed } : t,
            ),
          };
        }),

      deleteTodo: (id) =>
        set((s) => ({
          todos: s.todos.filter((t) => t.id !== id && t.parentId !== id),
        })),

      moveTodo: (id, direction) =>
        set((s) => ({ todos: moveAmong(s.todos, id, direction) })),

      addGoal: (draft) =>
        set((s) => {
          const name = draft.name.trim();
          if (!name) return s;
          const goal: YearGoal = {
            id: newId("g"),
            kind: draft.kind === "days" ? "days" : "hours",
            name,
            targetHours:
              draft.kind === "hours"
                ? Math.max(0.5, Number(draft.targetHours) || 1)
                : undefined,
          };
          return { goals: [...s.goals, goal] };
        }),

      updateGoal: (id, draft) =>
        set((s) => {
          const name = draft.name.trim();
          if (!name) return s;
          return {
            goals: s.goals.map((g) =>
              g.id === id
                ? {
                    ...g,
                    kind: draft.kind === "days" ? "days" : "hours",
                    name,
                    targetHours:
                      draft.kind === "hours"
                        ? Math.max(0.5, Number(draft.targetHours) || 1)
                        : undefined,
                  }
                : g,
            ),
          };
        }),

      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      setDayOverride: (habitId, date, patch) =>
        set((s) => {
          const existing = overrideFor(s.dayOverrides, habitId, date);
          const next: DayOverride = {
            id: existing?.id ?? `o-${date}-${habitId}`,
            habitId,
            date,
            ...existing,
            ...patch,
          };
          return {
            dayOverrides: existing
              ? s.dayOverrides.map((o) => (o.id === existing.id ? next : o))
              : [...s.dayOverrides, next],
          };
        }),

      clearDayOverride: (habitId, date) =>
        set((s) => ({
          dayOverrides: s.dayOverrides.filter(
            (o) => !(o.habitId === habitId && o.date === date),
          ),
        })),

      addTemplate: (name) => {
        const id = newId("tpl");
        set((s) => ({
          templates: [
            ...s.templates,
            {
              id,
              name: (name ?? "Nueva plantilla").trim() || "Nueva plantilla",
              days: [],
              activities: [],
            },
          ],
        }));
        return id;
      },

      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) => {
            if (t.id === id) {
              const days = patch.days ?? t.days;
              return {
                ...t,
                ...patch,
                name: (patch.name ?? t.name).trim() || t.name,
                days,
              };
            }
            if (patch.days) {
              return {
                ...t,
                days: t.days.filter((d) => !patch.days!.includes(d)),
              };
            }
            return t;
          }),
        })),

      deleteTemplate: (id) =>
        set((s) => {
          const today = todayKey();
          const empty: RoutineTemplate = {
            id,
            name: "",
            days: [],
            activities: [],
          };
          return {
            habits: applyTemplateToHabits(s.habits, empty, today, () =>
              newId("h"),
            ).filter((h) => h.templateId !== id || !isOpen(h)),
            templates: s.templates.filter((t) => t.id !== id),
          };
        }),

      addTemplateActivity: (templateId, draft) =>
        set((s) => ({
          templates: patchTemplate(s.templates, templateId, (t) => {
            const order =
              t.activities.reduce((m, a) => Math.max(m, a.order), -1) + 1;
            const id = newId("ta");
            const activity: TemplateActivity = {
              id,
              lineageId: id,
              name: draft.name.trim(),
              icon: draft.icon,
              durationMin: draft.durationMin,
              dayPart: draft.dayPart,
              scheduledTime: draft.scheduledTime,
              order,
              remind: draft.remind,
            };
            return { ...t, activities: [...t.activities, activity] };
          }),
        })),

      updateTemplateActivity: (templateId, activityId, draft) =>
        set((s) => ({
          templates: patchTemplate(s.templates, templateId, (t) => ({
            ...t,
            activities: t.activities.map((a) =>
              a.id === activityId
                ? {
                    ...a,
                    name: draft.name.trim(),
                    icon: draft.icon,
                    durationMin: draft.durationMin,
                    dayPart: draft.dayPart,
                    scheduledTime: draft.scheduledTime,
                    remind: draft.remind,
                  }
                : a,
            ),
          })),
        })),

      deleteTemplateActivity: (templateId, activityId) =>
        set((s) => ({
          templates: patchTemplate(s.templates, templateId, (t) => ({
            ...t,
            activities: t.activities.filter((a) => a.id !== activityId),
          })),
        })),

      moveTemplateActivity: (templateId, activityId, direction) =>
        set((s) => ({
          templates: patchTemplate(s.templates, templateId, (t) => {
            const target = t.activities.find((a) => a.id === activityId);
            if (!target) return t;
            const group = t.activities
              .filter((a) => a.dayPart === target.dayPart)
              .sort((a, b) => a.order - b.order);
            const idx = group.findIndex((a) => a.id === activityId);
            const swap = group[idx + direction];
            if (!swap) return t;
            return {
              ...t,
              activities: t.activities.map((a) => {
                if (a.id === target.id) return { ...a, order: swap.order };
                if (a.id === swap.id) return { ...a, order: target.order };
                return a;
              }),
            };
          }),
        })),

      applyTemplate: (id) =>
        set((s) => {
          const template = s.templates.find((t) => t.id === id);
          if (!template) return s;
          const today = todayKey();
          const claimed = new Set(template.days);
          return {
            habits: applyTemplateToHabits(
              s.habits,
              template,
              today,
              () => newId("h"),
            ),
            templates: s.templates.map((t) => {
              if (t.id === id) return stampApplied(template);
              return { ...t, days: t.days.filter((d) => !claimed.has(d)) };
            }),
          };
        }),

      exportBackup: () => {
        const s = get();
        return {
          version: 1 as const,
          app: "sxchedule" as const,
          exportedAt: new Date().toISOString(),
          habits: s.habits,
          completions: s.completions,
          passiveHabits: s.passiveHabits,
          passiveChecks: s.passiveChecks,
          todos: s.todos,
          dayOverrides: s.dayOverrides,
          templates: s.templates,
          dayPartSchedules: s.dayPartSchedules,
          goals: s.goals,
          settings: {
            ...s.settings,
            theme: "dark",
            dayParts: partsForDate(
              s.dayPartSchedules,
              todayKey(),
              s.settings.dayParts,
            ),
          },
        };
      },

      replaceFromBackup: (backup) =>
        set({
          habits: backup.habits.map(normalizeHabit),
          completions: backup.completions,
          passiveHabits: (backup.passiveHabits ?? defaultPassiveHabits()).map(
            normalizePassive,
          ),
          passiveChecks: backup.passiveChecks ?? [],
          todos: (backup.todos ?? []).map(normalizeTodo),
          dayOverrides: backup.dayOverrides ?? [],
          templates:
            backup.templates ??
            templatesFromHabits(backup.habits.map(normalizeHabit)),
          dayPartSchedules:
            backup.dayPartSchedules ??
            schedulesFromParts(backup.settings?.dayParts),
          goals: backup.goals ?? [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...backup.settings,
            theme: "dark",
            dayParts: normalizeDayParts(backup.settings?.dayParts),
            palette: normalizePalette(backup.settings?.palette),
          },
          session: null,
          initialized: true,
        }),

      mergeFromBackup: (backup) =>
        set((s) => {
          const ids = new Set(s.habits.map((h) => h.id));
          const habits = [
            ...s.habits,
            ...backup.habits.filter((h) => !ids.has(h.id)).map(normalizeHabit),
          ];
          const seen = new Set(s.completions.map((c) => c.id));
          const completions = [
            ...s.completions,
            ...backup.completions.filter((c) => !seen.has(c.id)),
          ];
          const pIds = new Set(s.passiveHabits.map((h) => h.id));
          const passiveHabits = [
            ...s.passiveHabits,
            ...(backup.passiveHabits ?? [])
              .filter((h) => !pIds.has(h.id))
              .map(normalizePassive),
          ];
          const pcSeen = new Set(s.passiveChecks.map((c) => c.id));
          const passiveChecks = [
            ...s.passiveChecks,
            ...(backup.passiveChecks ?? []).filter((c) => !pcSeen.has(c.id)),
          ];
          const tSeen = new Set(s.todos.map((t) => t.id));
          const todos = [
            ...s.todos,
            ...(backup.todos ?? [])
              .filter((t) => !tSeen.has(t.id))
              .map(normalizeTodo),
          ];
          const oSeen = new Set(s.dayOverrides.map((o) => o.id));
          const dayOverrides = [
            ...s.dayOverrides,
            ...(backup.dayOverrides ?? []).filter((o) => !oSeen.has(o.id)),
          ];
          const tplIds = new Set(s.templates.map((t) => t.id));
          const templates = [
            ...s.templates,
            ...(backup.templates ?? []).filter((t) => !tplIds.has(t.id)),
          ];
          const gIds = new Set(s.goals.map((g) => g.id));
          const goals = [
            ...s.goals,
            ...(backup.goals ?? []).filter((g) => !gIds.has(g.id)),
          ];
          return {
            habits,
            completions,
            passiveHabits,
            passiveChecks,
            todos,
            dayOverrides,
            templates,
            goals,
            initialized: true,
          };
        }),
    }),
    {
      name: "alba-routine-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        habits: s.habits,
        completions: s.completions,
        passiveHabits: s.passiveHabits,
        passiveChecks: s.passiveChecks,
        todos: s.todos,
        dayOverrides: s.dayOverrides,
        templates: s.templates,
        dayPartSchedules: s.dayPartSchedules,
        goals: s.goals,
        settings: s.settings,
        initialized: s.initialized,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | {
              habits?: Habit[];
              completions?: Completion[];
              passiveHabits?: PassiveHabit[];
              passiveChecks?: PassiveCheck[];
              todos?: TodoItem[];
              dayOverrides?: DayOverride[];
              templates?: RoutineTemplate[];
              dayPartSchedules?: DayPartSchedule[];
              goals?: YearGoal[];
              settings?: Settings;
              initialized?: boolean;
            }
          | undefined;
        if (!p || !p.initialized) return current;
        const habits = (p.habits ?? current.habits).map(normalizeHabit);
        const templates =
          p.templates ??
          (habits.length ? templatesFromHabits(habits) : defaultTemplates());
        const settings = {
          ...DEFAULT_SETTINGS,
          ...p.settings,
          theme: "dark" as const,
          dayParts: normalizeDayParts(p.settings?.dayParts),
          palette: normalizePalette(p.settings?.palette),
        };
        const dayPartSchedules =
          p.dayPartSchedules ?? schedulesFromParts(settings.dayParts);
        return {
          ...current,
          habits,
          completions: (p.completions ?? current.completions).map((c) => ({
            ...c,
            status: c.status === "failed" ? "failed" : "done",
          })),
          passiveHabits: (p.passiveHabits ?? defaultPassiveHabits()).map(
            normalizePassive,
          ),
          passiveChecks: p.passiveChecks ?? [],
          todos: (p.todos ?? []).map(normalizeTodo),
          dayOverrides: p.dayOverrides ?? [],
          templates,
          dayPartSchedules,
          goals: p.goals ?? current.goals,
          settings: {
            ...settings,
            dayParts: partsForDate(dayPartSchedules, todayKey(), settings.dayParts),
          },
          initialized: true,
        };
      },
    },
  ),
);

export function rehydrateRoutineStore() {
  return useRoutineStore.persist.rehydrate();
}
