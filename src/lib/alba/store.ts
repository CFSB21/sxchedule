import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSeed, defaultPassiveHabits } from "./seed";
import { normalizeDayParts } from "./day-parts";
import { overrideFor } from "./overrides";
import type {
  AlbaBackup,
  Completion,
  CompletionStatus,
  DayOverride,
  DayPart,
  DayPartConfig,
  Habit,
  HabitIconId,
  PassiveCheck,
  PassiveHabit,
  Session,
  Settings,
  TodoItem,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { todayKey } from "./time";
import { completionFor } from "./stats";

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

const seed = createSeed();

type State = {
  habits: Habit[];
  completions: Completion[];
  passiveHabits: PassiveHabit[];
  passiveChecks: PassiveCheck[];
  todos: TodoItem[];
  dayOverrides: DayOverride[];
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
  updateSettings: (patch: Partial<Settings>) => void;
  updateDayPart: (id: DayPart, patch: Partial<DayPartConfig>) => void;
  addPassiveHabit: (draft: PassiveDraft) => void;
  updatePassiveHabit: (id: string, draft: PassiveDraft) => void;
  deletePassiveHabit: (id: string) => void;
  togglePassiveCheck: (habitId: string, date: string) => void;
  addTodo: (date: string, title: string) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, title: string) => void;
  deleteTodo: (id: string) => void;
  setDayOverride: (
    habitId: string,
    date: string,
    patch: Partial<Omit<DayOverride, "id" | "habitId" | "date">>,
  ) => void;
  clearDayOverride: (habitId: string, date: string) => void;
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

export const useRoutineStore = create<State>()(
  persist(
    (set, get) => ({
      habits: seed.habits,
      completions: seed.completions,
      passiveHabits: seed.passiveHabits,
      passiveChecks: seed.passiveChecks,
      todos: seed.todos,
      dayOverrides: seed.dayOverrides,
      settings: DEFAULT_SETTINGS,
      initialized: true,
      session: null,

      addHabit: (draft) =>
        set((s) => {
          const order = s.habits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
          const habit: Habit = {
            id: newId("h"),
            ...draft,
            name: draft.name.trim(),
            order,
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
          habits: s.habits.filter((h) => h.id !== id),
          completions: s.completions.filter((c) => c.habitId !== id),
          dayOverrides: s.dayOverrides.filter((o) => o.habitId !== id),
          session: s.session?.habitId === id ? null : s.session,
        })),

      moveHabit: (id, direction) =>
        set((s) => {
          const target = s.habits.find((h) => h.id === id);
          if (!target) return s;
          const group = s.habits
            .filter((h) => h.dayPart === target.dayPart)
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
          const existing = completionFor(s.completions, habitId, date);
          if (existing) {
            return {
              completions: s.completions.filter((c) => c.id !== existing.id),
            };
          }
          const habit = s.habits.find((h) => h.id === habitId);
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
          const existing = completionFor(s.completions, habitId, date);
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

      updateSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            dayParts: normalizeDayParts(patch.dayParts ?? s.settings.dayParts),
            theme: "dark",
          },
        })),

      updateDayPart: (id, patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            dayParts: normalizeDayParts(
              s.settings.dayParts.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      ...patch,
                      name: (patch.name ?? p.name).trim() || p.name,
                    }
                  : p,
              ),
            ),
          },
        })),

      addPassiveHabit: (draft) =>
        set((s) => {
          const order =
            s.passiveHabits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
          const habit: PassiveHabit = {
            id: newId("p"),
            name: draft.name.trim(),
            icon: draft.icon,
            days: draft.days,
            order,
          };
          return { passiveHabits: [...s.passiveHabits, habit] };
        }),

      updatePassiveHabit: (id, draft) =>
        set((s) => ({
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
        })),

      deletePassiveHabit: (id) =>
        set((s) => ({
          passiveHabits: s.passiveHabits.filter((h) => h.id !== id),
          passiveChecks: s.passiveChecks.filter((c) => c.habitId !== id),
        })),

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

      addTodo: (date, title) =>
        set((s) => {
          const trimmed = title.trim();
          if (!trimmed) return s;
          const same = s.todos.filter((t) => t.date === date);
          const order = same.reduce((m, t) => Math.max(m, t.order), -1) + 1;
          const item: TodoItem = {
            id: newId("td"),
            date,
            title: trimmed,
            done: false,
            order,
          };
          return { todos: [...s.todos, item] };
        }),

      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t,
          ),
        })),

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
        set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

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
          settings: {
            ...s.settings,
            theme: "dark",
            dayParts: normalizeDayParts(s.settings.dayParts),
          },
        };
      },

      replaceFromBackup: (backup) =>
        set({
          habits: backup.habits,
          completions: backup.completions,
          passiveHabits: backup.passiveHabits ?? defaultPassiveHabits(),
          passiveChecks: backup.passiveChecks ?? [],
          todos: backup.todos ?? [],
          dayOverrides: backup.dayOverrides ?? [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...backup.settings,
            theme: "dark",
            dayParts: normalizeDayParts(backup.settings?.dayParts),
          },
          session: null,
          initialized: true,
        }),

      mergeFromBackup: (backup) =>
        set((s) => {
          const ids = new Set(s.habits.map((h) => h.id));
          const habits = [
            ...s.habits,
            ...backup.habits.filter((h) => !ids.has(h.id)),
          ];
          const seen = new Set(s.completions.map((c) => c.id));
          const completions = [
            ...s.completions,
            ...backup.completions.filter((c) => !seen.has(c.id)),
          ];
          const pIds = new Set(s.passiveHabits.map((h) => h.id));
          const passiveHabits = [
            ...s.passiveHabits,
            ...(backup.passiveHabits ?? []).filter((h) => !pIds.has(h.id)),
          ];
          const pcSeen = new Set(s.passiveChecks.map((c) => c.id));
          const passiveChecks = [
            ...s.passiveChecks,
            ...(backup.passiveChecks ?? []).filter((c) => !pcSeen.has(c.id)),
          ];
          const tSeen = new Set(s.todos.map((t) => t.id));
          const todos = [
            ...s.todos,
            ...(backup.todos ?? []).filter((t) => !tSeen.has(t.id)),
          ];
          const oSeen = new Set(s.dayOverrides.map((o) => o.id));
          const dayOverrides = [
            ...s.dayOverrides,
            ...(backup.dayOverrides ?? []).filter((o) => !oSeen.has(o.id)),
          ];
          return {
            habits,
            completions,
            passiveHabits,
            passiveChecks,
            todos,
            dayOverrides,
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
              settings?: Settings;
              initialized?: boolean;
            }
          | undefined;
        if (!p || !p.initialized) return current;
        return {
          ...current,
          habits: (p.habits ?? current.habits).map((h) => ({
            ...h,
            remind: h.remind !== false,
          })),
          completions: (p.completions ?? current.completions).map((c) => ({
            ...c,
            status: c.status === "failed" ? "failed" : "done",
          })),
          passiveHabits: p.passiveHabits ?? defaultPassiveHabits(),
          passiveChecks: p.passiveChecks ?? [],
          todos: p.todos ?? [],
          dayOverrides: p.dayOverrides ?? [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...p.settings,
            theme: "dark",
            dayParts: normalizeDayParts(p.settings?.dayParts),
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
