import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSeed } from "./seed";
import type {
  AlbaBackup,
  Completion,
  DayPart,
  Habit,
  HabitIconId,
  Session,
  Settings,
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

const seed = createSeed();

type State = {
  habits: Habit[];
  completions: Completion[];
  settings: Settings;
  initialized: boolean;
  session: Session | null;
  addHabit: (draft: HabitDraft) => void;
  updateHabit: (id: string, draft: HabitDraft) => void;
  deleteHabit: (id: string) => void;
  moveHabit: (id: string, direction: -1 | 1) => void;
  toggleComplete: (habitId: string, date: string) => void;
  startSession: (habitId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: () => void;
  cancelSession: () => void;
  restoreDemo: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  exportBackup: () => AlbaBackup;
  replaceFromBackup: (backup: AlbaBackup) => void;
  mergeFromBackup: (backup: AlbaBackup) => void;
};

function elapsedMs(session: Session, now = Date.now()) {
  return session.accumulatedMs + (session.running ? now - session.startedAt : 0);
}

export { elapsedMs };

export const useRoutineStore = create<State>()(
  persist(
    (set, get) => ({
      habits: seed.habits,
      completions: seed.completions,
      settings: DEFAULT_SETTINGS,
      initialized: true,
      session: null,

      addHabit: (draft) =>
        set((s) => {
          const order = s.habits.reduce((m, h) => Math.max(m, h.order), -1) + 1;
          const habit: Habit = {
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `h-${Date.now()}`,
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
          const next: Completion = {
            id: `c-${date}-${habitId}`,
            habitId,
            date,
            durationMin: habit?.durationMin ?? 10,
            completedAt: new Date().toISOString(),
          };
          return { completions: [...s.completions, next] };
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

      finishSession: () => {
        const { session, habits } = get();
        if (!session) return;
        const habit = habits.find((h) => h.id === session.habitId);
        const minutes = Math.max(1, Math.round(elapsedMs(session) / 60000));
        const date = todayKey();
        set((s) => {
          const existing = completionFor(s.completions, session.habitId, date);
          const row: Completion = {
            id: existing?.id ?? `c-${date}-${session.habitId}`,
            habitId: session.habitId,
            date,
            durationMin: habit ? Math.max(1, minutes) : minutes,
            completedAt: new Date().toISOString(),
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
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      exportBackup: () => {
        const s = get();
        return {
          version: 1 as const,
          app: "sxchedule" as const,
          exportedAt: new Date().toISOString(),
          habits: s.habits,
          completions: s.completions,
          settings: { ...s.settings, theme: "dark" },
        };
      },

      replaceFromBackup: (backup) =>
        set({
          habits: backup.habits,
          completions: backup.completions,
          settings: backup.settings,
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
          return { habits, completions, initialized: true };
        }),
    }),
    {
      name: "alba-routine-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        habits: s.habits,
        completions: s.completions,
        settings: s.settings,
        initialized: s.initialized,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | {
              habits?: Habit[];
              completions?: Completion[];
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
          completions: p.completions ?? current.completions,
          settings: { ...DEFAULT_SETTINGS, ...p.settings, theme: "dark" },
          initialized: true,
        };
      },
    },
  ),
);

export function rehydrateRoutineStore() {
  return useRoutineStore.persist.rehydrate();
}
