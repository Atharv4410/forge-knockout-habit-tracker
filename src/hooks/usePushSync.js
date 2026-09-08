import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext.jsx";
import { isRequiredDay, isSuccess } from "../lib/stats.js";
import { todayISO } from "../lib/dates.js";
import { getExistingPushSubscription, permissionStatus, syncPushSubscription } from "../lib/notifications.js";

// Keeps the server's copy of "what's still incomplete today" fresh so the
// real server-side reminder sweep (server/vitePlugin.js locally, a Vercel Cron
// hitting /api/send-reminders in production) always has accurate data. This
// hook never displays a notification itself — it only syncs state.
export function usePushSync() {
  const { habits, checkins, settings } = useApp();
  const lastSentRef = useRef(null);

  useEffect(() => {
    if (!settings.notificationsEnabled || permissionStatus() !== "granted") return;

    const today = todayISO();
    const incompleteHabitNames = habits
      .filter((h) => h.active && (isRequiredDay(h, today) || h.frequencyType === "weekly_count"))
      .filter((h) => !isSuccess(h, checkins.find((c) => c.habitId === h.id && c.date === today)))
      .map((h) => h.name);

    const signature = JSON.stringify([incompleteHabitNames, settings.reminderTime, settings.notificationsEnabled]);
    if (lastSentRef.current === signature) return;

    let cancelled = false;
    getExistingPushSubscription().then((subscription) => {
      if (cancelled || !subscription) return;
      syncPushSubscription(subscription, {
        reminderTime: settings.reminderTime,
        notificationsEnabled: settings.notificationsEnabled,
        incompleteHabitNames,
      })
        .then(() => {
          lastSentRef.current = signature;
        })
        .catch(() => {
          // best-effort — next state change will retry
        });
    });

    return () => {
      cancelled = true;
    };
  }, [habits, checkins, settings]);
}
