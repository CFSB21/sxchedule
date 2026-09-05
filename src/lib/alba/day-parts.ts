import { parseTimeToMinutes, pad2 } from "./time";
import {
  DEFAULT_DAY_PARTS,
  type DayPart,
  type DayPartConfig,
  type Habit,
} from "./types";

const DAY_MS = 24 * 60;

export function clampDayMinutes(n: unknown, fallback: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(DAY_MS, Math.round(n)));
}

export function normalizeDayParts(input?: DayPartConfig[]): DayPartConfig[] {
  const byId = new Map((input ?? []).map((p) => [p.id, p]));
  return DEFAULT_DAY_PARTS.map((base) => {
    const p = byId.get(base.id);
    if (!p) return { ...base };
    const name = (p.name ?? "").trim().slice(0, 40) || base.name;
    return {
      id: base.id,
      name,
      startMin: clampDayMinutes(p.startMin, base.startMin),
      endMin: clampDayMinutes(p.endMin, base.endMin),
    };
  });
}

export function minutesToHm(totalMin: number) {
  if (totalMin >= DAY_MS) return "24:00";
  const n = ((totalMin % DAY_MS) + DAY_MS) % DAY_MS;
  return `${pad2(Math.floor(n / 60))}:${pad2(n % 60)}`;
}

export function formatPartRange(part: DayPartConfig) {
  return `${minutesToHm(part.startMin)}–${minutesToHm(part.endMin)}`;
}

export function minutesInPart(part: DayPartConfig, minutes: number) {
  const { startMin, endMin } = part;
  if (startMin === endMin) return false;
  if (startMin < endMin) return minutes >= startMin && minutes < endMin;
  return minutes >= startMin || minutes < endMin;
}

export function resolvePartId(
  habit: Habit,
  parts: DayPartConfig[],
): DayPart {
  if (habit.scheduledTime) {
    const minutes = parseTimeToMinutes(habit.scheduledTime);
    const hit = parts.find((p) => minutesInPart(p, minutes));
    if (hit) return hit.id;
  }
  return habit.dayPart;
}

export function partName(parts: DayPartConfig[], id: DayPart) {
  return parts.find((p) => p.id === id)?.name ?? id;
}

export function hmInputValue(totalMin: number) {
  const n = Math.min(DAY_MS - 1, Math.max(0, totalMin));
  return `${pad2(Math.floor(n / 60))}:${pad2(n % 60)}`;
}
