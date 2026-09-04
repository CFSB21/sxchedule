import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  reminderBody,
  showLocalNotice,
  syncNativeAlarms,
  upcomingReminders,
} from "@/lib/alba/notifications";
import { useRoutineStore } from "@/lib/alba/store";
import { APP_NAME } from "@/lib/brand";

export function ReminderHost() {
  const habits = useRoutineStore((s) => s.habits);
  const completions = useRoutineStore((s) => s.completions);
  const settings = useRoutineStore((s) => s.settings);
  const fired = useRef(new Set<string>());

  useEffect(() => {
    void syncNativeAlarms(habits, completions, settings);
  }, [habits, completions, settings]);

  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    const timers: number[] = [];
    const upcoming = upcomingReminders(
      habits,
      completions,
      settings,
      new Date(),
      1,
    );
    for (const item of upcoming) {
      const delay = item.at.getTime() - Date.now();
      if (delay <= 0 || delay > 36 * 60 * 60 * 1000) continue;
      const key = `${item.habitId}:${item.dateKey}`;
      timers.push(
        window.setTimeout(() => {
          if (fired.current.has(key)) return;
          fired.current.add(key);
          const body = reminderBody(item);
          toast(body);
          void showLocalNotice(APP_NAME, body);
        }, delay),
      );
    }
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [habits, completions, settings]);

  return null;
}
