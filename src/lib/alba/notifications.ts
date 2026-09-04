import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isComplete } from "./stats";
import { toDateKey } from "./time";
import type { Completion, Habit, Settings } from "./types";

export type UpcomingReminder = {
  id: number;
  habitId: string;
  name: string;
  at: Date;
  dateKey: string;
  minutesBefore: number;
};

function notifId(habitId: string, dateKey: string) {
  let h = 0;
  const s = `${habitId}:${dateKey}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2_000_000_000) + 1;
}

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function upcomingReminders(
  habits: Habit[],
  completions: Completion[],
  settings: Settings,
  now = new Date(),
  daysAhead = 14,
): UpcomingReminder[] {
  const out: UpcomingReminder[] = [];
  const horizon = new Date(now);
  horizon.setDate(now.getDate() + daysAhead);
  for (let i = 0; i <= daysAhead; i++) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(now.getDate() + i);
    const key = toDateKey(day);
    const dow = day.getDay();
    for (const habit of habits) {
      if (!habit.remind || !habit.scheduledTime) continue;
      if (!habit.days.includes(dow)) continue;
      if (isComplete(completions, habit.id, key)) continue;
      const [hh, mm] = habit.scheduledTime.split(":").map(Number);
      const at = new Date(day);
      at.setHours(hh ?? 0, (mm ?? 0) - settings.minutesBefore, 0, 0);
      if (at.getTime() <= now.getTime()) continue;
      if (at.getTime() > horizon.getTime()) continue;
      out.push({
        id: notifId(habit.id, key),
        habitId: habit.id,
        name: habit.name,
        at,
        dateKey: key,
        minutesBefore: settings.minutesBefore,
      });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function reminderBody(item: UpcomingReminder) {
  if (item.minutesBefore <= 0) return `Es la hora de ${item.name}`;
  return `En ${item.minutesBefore} min: ${item.name}`;
}

export async function notificationPermission(): Promise<NotificationPermission | "native"> {
  if (isNativeApp()) {
    const status = await LocalNotifications.checkPermissions();
    return status.display === "granted" ? "native" : "denied";
  }
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (isNativeApp()) {
    const status = await LocalNotifications.requestPermissions();
    return status.display === "granted";
  }
  if (typeof Notification === "undefined") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function showLocalNotice(title: string, body: string) {
  try {
    if (isNativeApp()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Date.now() % 1_000_000) + 3_000_000,
            title,
            body,
            schedule: { at: new Date(Date.now() + 400) },
          },
        ],
      });
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  } catch {
    /* preview iframes and denied permissions */
  }
  try {
    navigator.vibrate?.(180);
  } catch {
    /* ignore */
  }
}

export async function syncNativeAlarms(
  habits: Habit[],
  completions: Completion[],
  settings: Settings,
) {
  if (!isNativeApp()) return;
  if (!settings.notificationsEnabled) {
    const pending = await LocalNotifications.getPending();
    const ids = pending.notifications.map((n) => ({ id: n.id }));
    if (ids.length) await LocalNotifications.cancel({ notifications: ids });
    return;
  }
  const upcoming = upcomingReminders(habits, completions, settings).slice(0, 60);
  const pending = await LocalNotifications.getPending();
  const ids = pending.notifications.map((n) => ({ id: n.id }));
  if (ids.length) await LocalNotifications.cancel({ notifications: ids });
  if (upcoming.length === 0) return;
  await LocalNotifications.schedule({
    notifications: upcoming.map((item) => ({
      id: item.id,
      title: "Alba",
      body: reminderBody(item),
      schedule: { at: item.at, allowWhileIdle: true },
      extra: { habitId: item.habitId, dateKey: item.dateKey },
    })),
  });
}
