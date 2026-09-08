// POST { subscription, reminderTime, notificationsEnabled, incompleteHabitNames }
// Upserts by subscription.endpoint. Called both on first subscribe and on every
// later sync (so the server always knows what's actually incomplete today).
import { upsertSubscription } from "../server/store.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method not allowed");
  }
  const { subscription, reminderTime, notificationsEnabled, incompleteHabitNames } = req.body || {};
  if (!subscription?.endpoint || !subscription?.keys) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: "Missing subscription" }));
  }
  const record = upsertSubscription({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    reminderTime: reminderTime ?? "20:00",
    notificationsEnabled: notificationsEnabled ?? true,
    incompleteHabitNames: incompleteHabitNames ?? [],
  });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, record }));
}
