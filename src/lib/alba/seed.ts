import { activityToHabit, stampApplied } from "./schedule";
import { defaultDayPartSchedules } from "./day-parts";
import type {
  Completion,
  DayOverride,
  DayPartSchedule,
  Habit,
  PassiveCheck,
  PassiveHabit,
  RoutineTemplate,
  TemplateActivity,
  TodoItem,
  YearGoal,
} from "./types";
import { toDateKey, currentYear } from "./time";

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
const WEEKEND = [0, 6];

function act(
  id: string,
  lineage: string,
  name: string,
  icon: TemplateActivity["icon"],
  durationMin: number,
  dayPart: TemplateActivity["dayPart"],
  scheduledTime: string,
  order: number,
): TemplateActivity {
  return {
    id,
    lineageId: lineage,
    name,
    icon,
    durationMin,
    dayPart,
    scheduledTime,
    order,
    remind: true,
  };
}

const WEEKDAY_ACTIVITIES: TemplateActivity[] = [
  act("ta-wd-water", "lin-water", "Agua y estiramientos", "droplets", 10, "morning", "06:30", 0),
  act("ta-wd-meditate", "lin-meditate", "Meditación", "brain", 12, "morning", "06:45", 1),
  act("ta-wd-train", "lin-train", "Entrenamiento", "dumbbell", 40, "morning", "07:00", 2),
  act("ta-wd-breakfast", "lin-breakfast", "Desayuno con calma", "coffee", 20, "morning", "07:50", 3),
  act("ta-wd-deep", "lin-deep", "Bloque profundo", "focus", 90, "afternoon", "09:30", 4),
  act("ta-wd-walk", "lin-walk", "Caminata", "walk", 20, "afternoon", "13:30", 5),
  act("ta-wd-read", "lin-read", "Lectura", "book", 25, "evening", "21:00", 6),
  act("ta-wd-journal", "lin-journal", "Diario", "pen", 10, "evening", "21:30", 7),
];

const WEEKEND_ACTIVITIES: TemplateActivity[] = [
  act("ta-we-water", "lin-water", "Agua y estiramientos", "droplets", 10, "morning", "07:30", 0),
  act("ta-we-meditate", "lin-meditate", "Meditación", "brain", 12, "morning", "07:45", 1),
  act("ta-we-train", "lin-train", "Entrenamiento", "dumbbell", 40, "morning", "09:00", 2),
  act("ta-we-breakfast", "lin-breakfast", "Desayuno con calma", "coffee", 20, "morning", "09:50", 3),
  act("ta-we-walk", "lin-walk", "Caminata", "walk", 25, "afternoon", "12:00", 4),
  act("ta-we-read", "lin-read", "Lectura", "book", 30, "evening", "21:00", 5),
  act("ta-we-journal", "lin-journal", "Diario", "pen", 10, "evening", "21:40", 6),
];

export function defaultTemplates(): RoutineTemplate[] {
  return [
    stampApplied({
      id: "tpl-weekdays",
      name: "Entre semana",
      days: WEEKDAYS,
      activities: WEEKDAY_ACTIVITIES,
    }),
    stampApplied({
      id: "tpl-weekend",
      name: "Fin de semana",
      days: WEEKEND,
      activities: WEEKEND_ACTIVITIES,
    }),
  ];
}

export function defaultHabits(fromDate = "0000-01-01"): Habit[] {
  return defaultTemplates().flatMap((template) =>
    template.activities.map((activity) =>
      activityToHabit(template, activity, fromDate, activity.id),
    ),
  );
}

export function defaultPassiveHabits(fromDate = "0000-01-01"): PassiveHabit[] {
  return [
    {
      id: "p-bed",
      name: "Hacer la cama",
      icon: "sun",
      days: ALL_DAYS,
      order: 0,
      activeFrom: fromDate,
      activeUntil: null,
    },
    {
      id: "p-vitamins",
      name: "Vitaminas",
      icon: "leaf",
      days: ALL_DAYS,
      order: 1,
      activeFrom: fromDate,
      activeUntil: null,
    },
    {
      id: "p-phone",
      name: "Sin teléfono al despertar",
      icon: "moon",
      days: ALL_DAYS,
      order: 2,
      activeFrom: fromDate,
      activeUntil: null,
    },
    {
      id: "p-water",
      name: "Dos litros de agua",
      icon: "droplets",
      days: ALL_DAYS,
      order: 3,
      activeFrom: fromDate,
      activeUntil: null,
    },
    {
      id: "p-desk",
      name: "Escritorio en orden",
      icon: "laptop",
      days: WEEKDAYS,
      order: 4,
      activeFrom: fromDate,
      activeUntil: null,
    },
  ];
}

function missChance(lineage: string, dow: number) {
  const weekend = dow === 0 || dow === 6;
  const base: Record<string, number> = {
    "lin-water": 0.08,
    "lin-meditate": 0.12,
    "lin-train": weekend ? 0.28 : 0.18,
    "lin-breakfast": 0.1,
    "lin-deep": 0.32,
    "lin-walk": 0.22,
    "lin-read": 0.16,
    "lin-journal": 0.2,
  };
  return base[lineage] ?? 0.2;
}

const TODO_TITLES = [
  "Revisar correo",
  "Pagar un recibo",
  "Devolver una llamada",
  "Organizar la mesa",
  "Preparar la comida",
];

const EXCUSES = [
  "Se me hizo tarde",
  "No tenía ganas",
  "Reunión inesperada",
  "Dormí mal",
  "Salí de casa",
];

function fillHistory(
  now: Date,
  startOffset: number,
  endOffset: number,
  habits: Habit[],
  passiveHabits: PassiveHabit[],
  completions: Completion[],
  passiveChecks: PassiveCheck[],
  todos: TodoItem[],
) {
  for (let i = startOffset; i >= endOffset; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toDateKey(d);
    const dow = d.getDay();
    const forceComplete = i <= 5;
    for (const habit of habits) {
      if (!habit.days.includes(dow)) continue;
      const roll = hash01(`${key}:${habit.id}`);
      const keep =
        forceComplete || roll > missChance(habit.lineageId ?? habit.id, dow);
      if (!keep) {
        const failRoll = hash01(`fail:${key}:${habit.id}`);
        if (!forceComplete && failRoll > 0.42) {
          completions.push({
            id: `c-${key}-${habit.id}`,
            habitId: habit.id,
            date: key,
            durationMin: 0,
            completedAt: `${key}T12:00:00.000Z`,
            status: "failed",
            excuse: EXCUSES[Math.floor(failRoll * EXCUSES.length)]!,
          });
        }
        continue;
      }
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
    for (const custom of passiveHabits) {
      if (!custom.days.includes(dow)) continue;
      const roll = hash01(`p:${key}:${custom.id}`);
      if (forceComplete || roll > 0.22) {
        passiveChecks.push({
          id: `pc-${key}-${custom.id}`,
          habitId: custom.id,
          date: key,
          status: "done",
        });
      } else {
        const failRoll = hash01(`pfail:${key}:${custom.id}`);
        if (failRoll > 0.4) {
          passiveChecks.push({
            id: `pc-${key}-${custom.id}`,
            habitId: custom.id,
            date: key,
            status: "failed",
            excuse: EXCUSES[Math.floor(failRoll * EXCUSES.length)]!,
          });
        }
      }
    }
    if (dow !== 0) {
      const n = 2 + Math.floor(hash01(`t:${key}`) * 3);
      for (let t = 0; t < n; t++) {
        const done = forceComplete || hash01(`t:${key}:${t}`) > 0.35;
        todos.push({
          id: `td-${key}-${t}`,
          date: key,
          title: TODO_TITLES[(t + i) % TODO_TITLES.length]!,
          done,
          order: t,
        });
      }
    }
  }
}

export function createSeed(now = new Date()) {
  const fromDate = "2000-01-01";
  const templates = defaultTemplates();
  const habits = defaultHabits(fromDate);
  const passiveHabits = defaultPassiveHabits(fromDate);
  const completions: Completion[] = [];
  const passiveChecks: PassiveCheck[] = [];
  const todos: TodoItem[] = [];
  const dayOverrides: DayOverride[] = [];
  const dayPartSchedules: DayPartSchedule[] = defaultDayPartSchedules();
  const today = toDateKey(now);

  fillHistory(
    now,
    56,
    1,
    habits,
    passiveHabits,
    completions,
    passiveChecks,
    todos,
  );

  const prevDec = new Date(currentYear(now) - 1, 11, 31);
  const prevStart = new Date(currentYear(now) - 1, 11, 10);
  const daysToDec31 = Math.round(
    (now.getTime() - prevDec.getTime()) / 86400000,
  );
  const daysToDec10 = Math.round(
    (now.getTime() - prevStart.getTime()) / 86400000,
  );
  if (daysToDec10 > 56) {
    fillHistory(
      now,
      daysToDec10,
      Math.max(daysToDec31, 57),
      habits,
      passiveHabits,
      completions,
      passiveChecks,
      todos,
    );
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

  for (const custom of passiveHabits.slice(0, 2)) {
    if (!custom.days.includes(now.getDay())) continue;
    passiveChecks.push({
      id: `pc-${today}-${custom.id}`,
      habitId: custom.id,
      date: today,
    });
  }

  todos.push(
    {
      id: `td-${today}-0`,
      date: today,
      title: "Enviar el informe de la semana",
      done: true,
      order: 0,
    },
    {
      id: `td-${today}-1`,
      date: today,
      title: "Comprar verdura",
      done: false,
      order: 1,
    },
    {
      id: `td-${today}-2`,
      date: today,
      title: "Llamar al banco",
      done: false,
      order: 2,
    },
  );

  return {
    habits,
    completions,
    passiveHabits,
    passiveChecks,
    todos,
    dayOverrides,
    templates,
    dayPartSchedules,
    goals: defaultGoals(),
  };
}

export function defaultGoals(now = new Date()): YearGoal[] {
  const year = currentYear(now);
  const prev = year - 1;
  return [
    {
      id: `g-train-${year}`,
      kind: "hours",
      name: "Entrenamiento",
      targetHours: 80,
      year,
    },
    {
      id: `g-read-${year}`,
      kind: "hours",
      name: "Lectura",
      targetHours: 40,
      year,
    },
    {
      id: `g-bed-${year}`,
      kind: "days",
      name: "Hacer la cama",
      year,
    },
    {
      id: `g-desk-${year}`,
      kind: "days",
      name: "Escritorio en orden",
      year,
    },
    {
      id: `g-train-${prev}`,
      kind: "hours",
      name: "Entrenamiento",
      targetHours: 80,
      year: prev,
    },
    {
      id: `g-bed-${prev}`,
      kind: "days",
      name: "Hacer la cama",
      year: prev,
    },
  ];
}
