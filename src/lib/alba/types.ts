import type { Palette } from "./palette";
import { currentYear } from "./time";

export type DayPart = "morning" | "afternoon" | "evening";

export type HabitIconId =
  | "brain"
  | "dumbbell"
  | "book"
  | "focus"
  | "walk"
  | "pen"
  | "droplets"
  | "coffee"
  | "moon"
  | "sun"
  | "heart"
  | "music"
  | "utensils"
  | "laptop"
  | "shower"
  | "stretch"
  | "bike"
  | "wind"
  | "leaf"
  | "timer";

export type Habit = {
  id: string;
  name: string;
  icon: HabitIconId;
  durationMin: number;
  dayPart: DayPart;
  scheduledTime: string | null;
  days: number[];
  order: number;
  remind: boolean;
  lineageId?: string;
  templateId?: string;
  activeFrom?: string;
  activeUntil?: string | null;
};

export type CompletionStatus = "done" | "failed";

export type Completion = {
  id: string;
  habitId: string;
  date: string;
  durationMin: number;
  completedAt: string;
  status?: CompletionStatus;
  excuse?: string;
};

export type Session = {
  habitId: string;
  startedAt: number;
  accumulatedMs: number;
  running: boolean;
};

export type ThemeMode = "light" | "dark";

export type StatsScope = "year" | "all";

export type YearGoalKind = "hours" | "days";

export type YearGoal = {
  id: string;
  kind: YearGoalKind;
  name: string;
  year: number;
  targetHours?: number;
};

export type DayPartConfig = {
  id: DayPart;
  name: string;
  startMin: number;
  endMin: number;
};

export type DayPartSchedule = {
  id: string;
  parts: DayPartConfig[];
  activeFrom: string;
  activeUntil: string | null;
};

export type Settings = {
  notificationsEnabled: boolean;
  minutesBefore: number;
  theme: ThemeMode;
  dayParts: DayPartConfig[];
  palette?: Palette;
  statsYear?: number;
  statsScope?: StatsScope;
};

export type PassiveHabit = {
  id: string;
  name: string;
  icon: HabitIconId;
  days: number[];
  order: number;
  activeFrom?: string;
  activeUntil?: string | null;
};

export type PassiveCheck = {
  id: string;
  habitId: string;
  date: string;
  status?: CompletionStatus;
  excuse?: string;
};

export type TodoKind = "task" | "group";

export type TodoItem = {
  id: string;
  date: string;
  title: string;
  done: boolean;
  order: number;
  kind?: TodoKind;
  parentId?: string;
};

export type DayOverride = {
  id: string;
  habitId: string;
  date: string;
  name?: string;
  scheduledTime?: string | null;
  durationMin?: number;
  skipped?: boolean;
};

export type TemplateActivity = {
  id: string;
  lineageId?: string;
  name: string;
  icon: HabitIconId;
  durationMin: number;
  dayPart: DayPart;
  scheduledTime: string | null;
  order: number;
  remind: boolean;
};

export type RoutineTemplate = {
  id: string;
  name: string;
  days: number[];
  activities: TemplateActivity[];
  lastApplied?: {
    days: number[];
    activities: TemplateActivity[];
  };
};

export type AlbaBackup = {
  version: 1;
  app: "alba" | "sxchedule";
  exportedAt: string;
  habits: Habit[];
  completions: Completion[];
  settings: Settings;
  passiveHabits?: PassiveHabit[];
  passiveChecks?: PassiveCheck[];
  todos?: TodoItem[];
  dayOverrides?: DayOverride[];
  templates?: RoutineTemplate[];
  dayPartSchedules?: DayPartSchedule[];
  goals?: YearGoal[];
};

export const DEFAULT_DAY_PARTS: DayPartConfig[] = [
  { id: "morning", name: "Mañana", startMin: 5 * 60, endMin: 12 * 60 },
  { id: "afternoon", name: "Tarde", startMin: 12 * 60, endMin: 19 * 60 },
  { id: "evening", name: "Noche", startMin: 19 * 60, endMin: 5 * 60 },
];

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: false,
  minutesBefore: 5,
  theme: "dark",
  dayParts: DEFAULT_DAY_PARTS.map((p) => ({ ...p })),
  statsYear: currentYear(),
  statsScope: "year",
};
