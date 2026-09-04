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
};

export type Completion = {
  id: string;
  habitId: string;
  date: string;
  durationMin: number;
  completedAt: string;
};

export type Session = {
  habitId: string;
  startedAt: number;
  accumulatedMs: number;
  running: boolean;
};

export type ThemeMode = "light" | "dark";

export type Settings = {
  notificationsEnabled: boolean;
  minutesBefore: number;
  theme: ThemeMode;
};

export type AlbaBackup = {
  version: 1;
  app: "alba" | "sxchedule";
  exportedAt: string;
  habits: Habit[];
  completions: Completion[];
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: false,
  minutesBefore: 5,
  theme: "light",
};
