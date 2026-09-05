import { fromDateKey, shiftDateKey, toDateKey } from "./time";
import type { Habit, PassiveHabit, RoutineTemplate, TemplateActivity } from "./types";

export function isActiveOn(
  item: { activeFrom?: string; activeUntil?: string | null },
  dateKey: string,
) {
  const from = item.activeFrom ?? "0000-01-01";
  if (dateKey < from) return false;
  if (item.activeUntil != null && dateKey > item.activeUntil) return false;
  return true;
}

export function isOpen(item: { activeUntil?: string | null }) {
  return item.activeUntil == null;
}

export function lineageOf(habit: Habit) {
  return habit.lineageId ?? habit.id;
}

export function dueHabits(habits: Habit[], date: Date) {
  const key = toDateKey(date);
  const dow = date.getDay();
  return habits
    .filter((h) => h.days.includes(dow) && isActiveOn(h, key))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? "");
    });
}

export function duePassives(habits: PassiveHabit[], dateKey: string) {
  const dow = fromDateKey(dateKey).getDay();
  return [...habits]
    .filter((h) => h.days.includes(dow) && isActiveOn(h, dateKey))
    .sort((a, b) => a.order - b.order);
}

export function closeFrom<T extends { activeFrom?: string; activeUntil?: string | null }>(
  item: T,
  fromDate: string,
): T {
  return { ...item, activeUntil: shiftDateKey(fromDate, -1) };
}

export function activityToHabit(
  template: RoutineTemplate,
  activity: TemplateActivity,
  fromDate: string,
  id: string,
): Habit {
  return {
    id,
    lineageId: activity.lineageId ?? activity.id,
    templateId: template.id,
    name: activity.name,
    icon: activity.icon,
    durationMin: activity.durationMin,
    dayPart: activity.dayPart,
    scheduledTime: activity.scheduledTime,
    days: [...template.days],
    order: activity.order,
    remind: activity.remind,
    activeFrom: fromDate,
    activeUntil: null,
  };
}

export function applyTemplateToHabits(
  habits: Habit[],
  template: RoutineTemplate,
  fromDate: string,
  nextId: () => string,
): Habit[] {
  const claimed = new Set(template.days);
  const next: Habit[] = [];

  for (const habit of habits) {
    if (!isOpen(habit)) {
      next.push(habit);
      continue;
    }
    const sameTemplate = habit.templateId === template.id;
    const remain = habit.days.filter((d) => !claimed.has(d));
    const overlaps = sameTemplate || remain.length !== habit.days.length;
    if (!overlaps) {
      next.push(habit);
      continue;
    }
    next.push(closeFrom(habit, fromDate));
    if (!sameTemplate && remain.length > 0) {
      next.push({
        ...habit,
        id: nextId(),
        days: remain,
        activeFrom: fromDate,
        activeUntil: null,
      });
    }
  }

  if (template.days.length === 0) return next;

  for (const activity of template.activities) {
    next.push(activityToHabit(template, activity, fromDate, nextId()));
  }
  return next;
}

export function punchHole<T extends { id: string; activeFrom?: string; activeUntil?: string | null }>(
  item: T,
  date: string,
  nextId: () => string,
): T[] {
  const from = item.activeFrom ?? "0000-01-01";
  const until = item.activeUntil ?? null;
  if (date < from || (until != null && date > until)) return [item];
  const beforeUntil = shiftDateKey(date, -1);
  const afterFrom = shiftDateKey(date, 1);
  const out: T[] = [];
  if (beforeUntil >= from) {
    out.push({ ...item, activeUntil: beforeUntil });
  }
  const hasAfter = until == null || afterFrom <= until;
  if (hasAfter) {
    out.push({
      ...item,
      id: nextId(),
      activeFrom: afterFrom,
      activeUntil: until,
    });
  }
  if (out.length === 0) {
    return [{ ...item, activeUntil: beforeUntil }];
  }
  return out;
}

export function templatesFromHabits(habits: Habit[]): RoutineTemplate[] {
  const open = habits.filter((h) => isOpen(h));
  if (open.length === 0) return [];
  const groups = new Map<string, Habit[]>();
  for (const habit of open) {
    const key = [...habit.days].sort().join(",");
    const list = groups.get(key);
    if (list) list.push(habit);
    else groups.set(key, [habit]);
  }
  let i = 0;
  const templates: RoutineTemplate[] = [];
  for (const items of groups.values()) {
    const days = [...items[0]!.days].sort();
    const activities: TemplateActivity[] = [...items]
      .sort((a, b) => a.order - b.order)
      .map((h) => ({
        id: lineageOf(h),
        lineageId: lineageOf(h),
        name: h.name,
        icon: h.icon,
        durationMin: h.durationMin,
        dayPart: h.dayPart,
        scheduledTime: h.scheduledTime,
        order: h.order,
        remind: h.remind !== false,
      }));
    const id = items[0]!.templateId ?? `tpl-migrated-${i}`;
    i += 1;
    templates.push({
      id,
      name: nameForDays(days),
      days,
      activities,
      lastApplied: { days: [...days], activities: activities.map(cloneActivity) },
    });
  }
  return templates;
}

export function nameForDays(days: number[]) {
  const key = [...days].sort().join(",");
  if (key === "0,1,2,3,4,5,6") return "Todos los días";
  if (key === "1,2,3,4,5") return "Entre semana";
  if (key === "0,6") return "Fin de semana";
  return days
    .slice()
    .sort()
    .map((d) => ["D", "L", "M", "X", "J", "V", "S"][d])
    .join(" ");
}

export function cloneActivity(activity: TemplateActivity): TemplateActivity {
  return {
    id: activity.id,
    lineageId: activity.lineageId,
    name: activity.name,
    icon: activity.icon,
    durationMin: activity.durationMin,
    dayPart: activity.dayPart,
    scheduledTime: activity.scheduledTime,
    order: activity.order,
    remind: activity.remind,
  };
}

export function templateIsDirty(template: RoutineTemplate) {
  const now = fingerprint(template);
  if (!template.lastApplied) return now !== fingerprint({ days: [], activities: [] });
  return now !== fingerprint(template.lastApplied);
}

function fingerprint(value: { days: number[]; activities: TemplateActivity[] }) {
  return JSON.stringify({
    days: [...value.days].sort(),
    activities: [...value.activities]
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        durationMin: a.durationMin,
        dayPart: a.dayPart,
        scheduledTime: a.scheduledTime,
        order: a.order,
        remind: a.remind,
      })),
  });
}

export function stampApplied(template: RoutineTemplate): RoutineTemplate {
  return {
    ...template,
    lastApplied: {
      days: [...template.days],
      activities: template.activities.map(cloneActivity),
    },
  };
}

export function normalizeHabit(habit: Habit): Habit {
  return {
    ...habit,
    lineageId: habit.lineageId ?? habit.id,
    activeFrom: habit.activeFrom ?? "0000-01-01",
    activeUntil: habit.activeUntil ?? null,
    remind: habit.remind !== false,
  };
}

export function normalizePassive(habit: PassiveHabit): PassiveHabit {
  return {
    ...habit,
    activeFrom: habit.activeFrom ?? "0000-01-01",
    activeUntil: habit.activeUntil ?? null,
  };
}
