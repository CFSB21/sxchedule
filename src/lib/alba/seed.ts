import type { Completion, Habit } from "./types";
import { toDateKey } from "./time";

function hash01(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

export function defaultHabits(): Habit[] {
  return [
    {
      id: "h-water",
      name: "Agua y estiramientos",
      icon: "droplets",
      durationMin: 10,
      dayPart: "morning",
      scheduledTime: "06:30",
      days: ALL_DAYS,
      order: 0,
      remind: true,
    },
    {
      id: "h-meditate",
      name: "Meditación",
      icon: "brain",
      durationMin: 12,
      dayPart: "morning",
      scheduledTime: "06:45",
      days: ALL_DAYS,
      order: 1,
      remind: true,
    },
    {
      id: "h-train",
      name: "Entrenamiento",
      icon: "dumbbell",
      durationMin: 40,
      dayPart: "morning",
      scheduledTime: "07:00",
      days: [1, 2, 3, 4, 5, 6],
      order: 2,
      remind: true,
    },
    {
      id: "h-breakfast",
      name: "Desayuno con calma",
      icon: "coffee",
      durationMin: 20,
      dayPart: "morning",
      scheduledTime: "07:50",
      days: ALL_DAYS,
      order: 3,
      remind: true,
    },
    {
      id: "h-deep",
      name: "Bloque profundo",
      icon: "focus",
      durationMin: 90,
      dayPart: "afternoon",
      scheduledTime: "09:30",
      days: WEEKDAYS,
      order: 4,
      remind: true,
    },
    {
      id: "h-walk",
      name: "Caminata",
      icon: "walk",
      durationMin: 20,
      dayPart: "afternoon",
      scheduledTime: "13:30",
      days: ALL_DAYS,
      order: 5,
      remind: true,
    },
    {
      id: "h-read",
      name: "Lectura",
      icon: "book",
      durationMin: 25,
      dayPart: "evening",
      scheduledTime: "21:00",
      days: ALL_DAYS,
      order: 6,
      remind: true,
    },
    {
      id: "h-journal",
      name: "Diario",
      icon: "pen",
      durationMin: 10,
      dayPart: "evening",
      scheduledTime: "21:30",
      days: ALL_DAYS,
      order: 7,
      remind: true,
    },
  ];
}

function missChance(habitId: string, dow: number) {
  const weekend = dow === 0 || dow === 6;
  const base: Record<string, number> = {
    "h-water": 0.08,
    "h-meditate": 0.12,
    "h-train": weekend ? 0.28 : 0.18,
    "h-breakfast": 0.1,
    "h-deep": 0.32,
    "h-walk": 0.22,
    "h-read": 0.16,
    "h-journal": 0.2,
  };
  return base[habitId] ?? 0.2;
}

export function createSeed(now = new Date()) {
  const habits = defaultHabits();
  const completions: Completion[] = [];
  const today = toDateKey(now);

  for (let i = 56; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toDateKey(d);
    const dow = d.getDay();
    const forceComplete = i <= 5;
    for (const habit of habits) {
      if (!habit.days.includes(dow)) continue;
      const roll = hash01(`${key}:${habit.id}`);
      const keep = forceComplete || roll > missChance(habit.id, dow);
      if (!keep) continue;
      const variance = 0.86 + roll * 0.22;
      completions.push({
        id: `c-${key}-${habit.id}`,
        habitId: habit.id,
        date: key,
        durationMin: Math.max(5, Math.round(habit.durationMin * variance)),
        completedAt: `${key}T12:00:00.000Z`,
        status: "done",
      });
    }
  }

  const morningToday = habits.filter(
    (h) =>
      h.dayPart === "morning" &&
      h.days.includes(now.getDay()) &&
      h.order <= 1,
  );
  for (const habit of morningToday) {
    completions.push({
      id: `c-${today}-${habit.id}`,
      habitId: habit.id,
      date: today,
      durationMin: habit.durationMin,
      completedAt: now.toISOString(),
      status: "done",
    });
  }

  return { habits, completions };
}
