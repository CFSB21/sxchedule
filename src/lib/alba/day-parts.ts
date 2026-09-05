import { isActiveOn } from "./schedule";
import { parseTimeToMinutes, pad2, shiftDateKey } from "./time";
import {
  DEFAULT_DAY_PARTS,
  type DayPart,
  type DayPartConfig,
  type DayPartSchedule,
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

export function defaultDayPartSchedules(): DayPartSchedule[] {
  return schedulesFromParts(DEFAULT_DAY_PARTS);
}

export function schedulesFromParts(
  parts: DayPartConfig[] | undefined,
  id = "dps-default",
): DayPartSchedule[] {
  return [
    {
      id,
      parts: normalizeDayParts(parts),
      activeFrom: "0000-01-01",
      activeUntil: null,
    },
  ];
}

export function partsForDate(
  schedules: DayPartSchedule[] | undefined,
  date: string,
  fallback?: DayPartConfig[],
) {
  const hits = (schedules ?? [])
    .filter((s) => isActiveOn(s, date))
    .sort((a, b) => b.activeFrom.localeCompare(a.activeFrom));
  return normalizeDayParts(hits[0]?.parts ?? fallback);
}

export function setDayPartsAt(
  schedules: DayPartSchedule[],
  date: string,
  parts: DayPartConfig[],
  nextId: () => string,
  span: "forward" | "day",
): DayPartSchedule[] {
  const cloned = normalizeDayParts(parts);
  const later = schedules
    .filter((s) => s.activeFrom > date)
    .sort((a, b) => a.activeFrom.localeCompare(b.activeFrom));
  const until =
    span === "day"
      ? date
      : later[0]
        ? shiftDateKey(later[0].activeFrom, -1)
        : null;

  const next: DayPartSchedule[] = [];
  let replaced = false;

  for (const s of schedules) {
    if (s.activeFrom > date) {
      next.push(s);
      continue;
    }
    const sUntil = s.activeUntil ?? null;
    if (sUntil != null && sUntil < date) {
      next.push(s);
      continue;
    }

    if (s.activeFrom === date) {
      next.push({ ...s, parts: cloned, activeUntil: until });
      replaced = true;
      const tailFrom = until ? shiftDateKey(until, 1) : null;
      if (tailFrom && (sUntil == null || tailFrom <= sUntil)) {
        next.push({
          ...s,
          id: nextId(),
          activeFrom: tailFrom,
          activeUntil: sUntil,
        });
      }
      continue;
    }

    next.push({ ...s, activeUntil: shiftDateKey(date, -1) });
    const tailFrom = until ? shiftDateKey(until, 1) : null;
    if (tailFrom && (sUntil == null || tailFrom <= sUntil)) {
      next.push({
        ...s,
        id: nextId(),
        activeFrom: tailFrom,
        activeUntil: sUntil,
      });
    }
  }

  if (!replaced) {
    next.push({
      id: nextId(),
      parts: cloned,
      activeFrom: date,
      activeUntil: until,
    });
  }
  return next;
}
