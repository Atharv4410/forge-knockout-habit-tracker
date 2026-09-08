// The scheduled sweep: one reminder per subscription per day, only if there's
// something genuinely incomplete, only once reminderTime has passed, gated by
// lastNotifiedDate so the same day never gets a second reminder.
//
// runReminderSweep() is called two ways:
//  - locally, once a minute, by the Vite dev-server plugin (server/vitePlugin.js)
//    while `npm run dev` is running — a real server-side scheduler, not a browser timer
//  - in production, by hitting this file's default export over HTTP on a schedule
//    (e.g. Vercel Cron) once deployed
import { readSubscriptions, markNotified } from "../server/store.js";
import { sendPushToSubscription } from "../server/push.js";

function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function runReminderSweep() {
  const now = new Date();
  const today = todayISO(now);
  const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const results = [];

  for (const sub of readSubscriptions()) {
    if (!sub.notificationsEnabled) continue;
    if (sub.lastNotifiedDate === today) continue;
    if (!sub.reminderTime || currentHHMM < sub.reminderTime) continue;

    const incomplete = sub.incompleteHabitNames || [];
    if (incomplete.length === 0) continue;

    const body =
      incomplete.length === 1
        ? `You haven't completed your "${incomplete[0]}" habit today.`
        : `You have ${incomplete.length} habits left today, including "${incomplete[0]}".`;

    const result = await sendPushToSubscription(sub, { title: "Atlas", body, url: "/app" });
    if (result.ok) markNotified(sub.endpoint, today);
    results.push({ endpoint: sub.endpoint, ...result });
  }

  return results;
}

export default async function handler(req, res) {
  const results = await runReminderSweep();
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, checked: results.length, results }));
}
