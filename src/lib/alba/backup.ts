import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { z } from "zod";
import { APP_NAME } from "@/lib/brand";
import { normalizeDayParts } from "./day-parts";
import { normalizePalette } from "./palette";
import { defaultPassiveHabits } from "./seed";
import { normalizeTodo } from "./todos";
import type { AlbaBackup, Habit, HabitIconId } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const ICON_IDS = [
  "brain",
  "dumbbell",
  "book",
  "focus",
  "walk",
  "pen",
  "droplets",
  "coffee",
  "moon",
  "sun",
  "heart",
  "music",
  "utensils",
  "laptop",
  "shower",
  "stretch",
  "bike",
  "wind",
  "leaf",
  "timer",
] as const satisfies readonly HabitIconId[];

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const habitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  icon: z.enum(ICON_IDS),
  durationMin: z.number().int().min(1).max(24 * 60),
  dayPart: z.enum(["morning", "afternoon", "evening"]),
  scheduledTime: z.string().nullable(),
  days: z.array(z.number().int().min(0).max(6)).min(1),
  order: z.number().int(),
  remind: z.boolean().optional(),
  lineageId: z.string().min(1).optional(),
  templateId: z.string().min(1).optional(),
  activeFrom: dateKey.optional(),
  activeUntil: dateKey.nullable().optional(),
});

const completionSchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMin: z.number().min(0),
  completedAt: z.string(),
  status: z.enum(["done", "failed"]).optional(),
  excuse: z.string().max(280).optional(),
});

const dayPartSchema = z.object({
  id: z.enum(["morning", "afternoon", "evening"]),
  name: z.string().min(1).max(40),
  startMin: z.number().int().min(0).max(24 * 60),
  endMin: z.number().int().min(0).max(24 * 60),
});

const dayPartScheduleSchema = z.object({
  id: z.string().min(1),
  parts: z.array(dayPartSchema),
  activeFrom: dateKey,
  activeUntil: dateKey.nullable(),
});

const passiveHabitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  icon: z.enum(ICON_IDS),
  days: z.array(z.number().int().min(0).max(6)).min(1),
  order: z.number().int(),
  activeFrom: dateKey.optional(),
  activeUntil: dateKey.nullable().optional(),
});

const passiveCheckSchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  date: dateKey,
});

const todoSchema = z.object({
  id: z.string().min(1),
  date: dateKey,
  title: z.string().min(1).max(120),
  done: z.boolean(),
  order: z.number().int(),
  kind: z.enum(["task", "group"]).optional(),
  parentId: z.string().min(1).optional(),
});

const overrideSchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  date: dateKey,
  name: z.string().min(1).max(80).optional(),
  scheduledTime: z.string().nullable().optional(),
  durationMin: z.number().int().min(1).max(24 * 60).optional(),
  skipped: z.boolean().optional(),
});

const templateActivitySchema = z.object({
  id: z.string().min(1),
  lineageId: z.string().min(1).optional(),
  name: z.string().min(1).max(80),
  icon: z.enum(ICON_IDS),
  durationMin: z.number().int().min(1).max(24 * 60),
  dayPart: z.enum(["morning", "afternoon", "evening"]),
  scheduledTime: z.string().nullable(),
  order: z.number().int(),
  remind: z.boolean(),
});

const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  days: z.array(z.number().int().min(0).max(6)),
  activities: z.array(templateActivitySchema),
  lastApplied: z
    .object({
      days: z.array(z.number().int().min(0).max(6)),
      activities: z.array(templateActivitySchema),
    })
    .optional(),
});

const backupSchema = z.object({
  version: z.literal(1),
  app: z.enum(["alba", "sxchedule"]),
  exportedAt: z.string(),
  habits: z.array(habitSchema),
  completions: z.array(completionSchema),
  passiveHabits: z.array(passiveHabitSchema).optional(),
  passiveChecks: z.array(passiveCheckSchema).optional(),
  todos: z.array(todoSchema).optional(),
  dayOverrides: z.array(overrideSchema).optional(),
  templates: z.array(templateSchema).optional(),
  dayPartSchedules: z.array(dayPartScheduleSchema).optional(),
  settings: z
    .object({
      notificationsEnabled: z.boolean(),
      minutesBefore: z.number().int().min(0).max(120),
      theme: z.enum(["light", "dark"]).optional(),
      dayParts: z.array(dayPartSchema).optional(),
      palette: z
        .object({
          background: z.string().optional(),
          foreground: z.string().optional(),
          primary: z.string().optional(),
          secondary: z.string().optional(),
          card: z.string().optional(),
          accent: z.string().optional(),
          muted: z.string().optional(),
          border: z.string().optional(),
          dayOk: z.string().optional(),
          dayWarn: z.string().optional(),
          dayFail: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export function parseBackup(input: unknown): AlbaBackup {
  const parsed = backupSchema.parse(input);
  return {
    version: 1,
    app: "sxchedule",
    exportedAt: parsed.exportedAt,
    habits: parsed.habits.map((h) => ({
      ...h,
      remind: h.remind !== false,
    })) as Habit[],
    completions: parsed.completions.map((c) => ({
      ...c,
      status: c.status === "failed" ? "failed" : "done",
      excuse: c.status === "failed" ? c.excuse : undefined,
    })),
    passiveHabits: parsed.passiveHabits ?? defaultPassiveHabits(),
    passiveChecks: parsed.passiveChecks ?? [],
    todos: (parsed.todos ?? []).map(normalizeTodo),
    dayOverrides: parsed.dayOverrides ?? [],
    templates: parsed.templates,
    dayPartSchedules: parsed.dayPartSchedules,
    settings: {
      ...DEFAULT_SETTINGS,
      ...parsed.settings,
      theme: "dark",
      dayParts: normalizeDayParts(parsed.settings?.dayParts),
      palette: normalizePalette(parsed.settings?.palette),
    },
  };
}

export async function downloadBackup(backup: AlbaBackup, filename: string) {
  const text = JSON.stringify(backup, null, 2);

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });
    await Share.share({
      title: `Respaldo ${APP_NAME}`,
      url: uri,
      dialogTitle: "Exportar respaldo",
    });
    return;
  }

  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<AlbaBackup> {
  const text = await file.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  try {
    return parseBackup(json);
  } catch {
    throw new Error(`Este archivo no es un respaldo de ${APP_NAME}.`);
  }
}
