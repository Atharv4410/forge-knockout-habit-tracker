// POST { subscription } — sends one real push immediately, for the
// "Send Test Notification" button. Bypasses the daily lastNotifiedDate gate
// on purpose (it's a manual test, not a scheduled reminder).
import { sendPushToSubscription } from "../server/push.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method not allowed");
  }
  const { subscription } = req.body || {};
  if (!subscription?.endpoint || !subscription?.keys) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: "Missing subscription" }));
  }

  const result = await sendPushToSubscription(subscription, {
    title: "Atlas",
    body: "Test notification — if you can see this with the app closed, push is working.",
    url: "/app",
  });

  res.setHeader("Content-Type", "application/json");
  res.statusCode = result.ok ? 200 : 500;
  res.end(JSON.stringify(result));
}
