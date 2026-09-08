// Thin wrapper around web-push. The VAPID private key is read from process.env
// here — server-side only — and never touches anything under src/.

import webpush from "web-push";
import { removeSubscription } from "./store.js";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys are not configured. Set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env (see .env.example).");
  }
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:admin@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

export async function sendPushToSubscription(subscriptionRecord, payload) {
  ensureConfigured();
  const subscription = { endpoint: subscriptionRecord.endpoint, keys: subscriptionRecord.keys };
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // push service says this subscription is gone — stop tracking it
      removeSubscription(subscriptionRecord.endpoint);
    }
    return { ok: false, error: err.message, statusCode: err.statusCode };
  }
}
