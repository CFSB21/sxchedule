import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { z } from "zod";
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
});

const completionSchema = z.object({
  id: z.string().min(1),
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMin: z.number().min(0),
  completedAt: z.string(),
});

const backupSchema = z.object({
  version: z.literal(1),
  app: z.literal("alba"),
  exportedAt: z.string(),
  habits: z.array(habitSchema),
  completions: z.array(completionSchema),
  settings: z
    .object({
      notificationsEnabled: z.boolean(),
      minutesBefore: z.number().int().min(0).max(120),
    })
    .optional(),
});

export function parseBackup(input: unknown): AlbaBackup {
  const parsed = backupSchema.parse(input);
  return {
    version: 1,
    app: "alba",
    exportedAt: parsed.exportedAt,
    habits: parsed.habits.map((h) => ({
      ...h,
      remind: h.remind !== false,
    })) as Habit[],
    completions: parsed.completions,
    settings: parsed.settings ?? DEFAULT_SETTINGS,
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
      title: "Respaldo Alba",
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
    throw new Error("Este archivo no es un respaldo de Alba.");
  }
}
