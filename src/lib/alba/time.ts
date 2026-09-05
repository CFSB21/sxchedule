import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function currentYear(now = new Date()) {
  return now.getFullYear();
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayKey(now = new Date()) {
  return toDateKey(now);
}

export function shiftDateKey(key: string, days: number) {
  return toDateKey(addDays(fromDateKey(key), days));
}

export function formatLongDate(date: Date) {
  const raw = format(date, "EEEE d 'de' MMMM", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatMonthYear(date: Date) {
  const raw = format(date, "MMMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatShortDate(date: Date) {
  return format(date, "d MMM", { locale: es });
}

export function formatWeekday(date: Date) {
  const raw = format(date, "EEE", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatMinutes(min: number) {
  const safe = Math.max(0, Math.round(min));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export function parseTimeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isoDate(key: string) {
  return parseISO(`${key}T12:00:00`);
}

export function mondayOf(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

export function weekKeysMonday(dateKey: string) {
  const monday = mondayOf(fromDateKey(dateKey));
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(monday, i)));
}

export const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"] as const;
export const WEEK_LABELS_MON = ["L", "M", "X", "J", "V", "S", "D"] as const;
export const WEEK_DAY_INDEX_MON = [1, 2, 3, 4, 5, 6, 0] as const;
export const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const DAY_PART_LABEL: Record<"morning" | "afternoon" | "evening", string> =
  {
    morning: "Mañana",
    afternoon: "Tarde",
    evening: "Noche",
  };

export const DAY_PART_ORDER = ["morning", "afternoon", "evening"] as const;
