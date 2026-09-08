export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function permissionStatus() {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  return Notification.requestPermission();
}

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // best-effort — app works fully without it, just without background display
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

// Returns the browser's existing PushSubscription for this app, if any —
// a cheap local check, no network call.
export async function getExistingPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Creates a real Push API subscription with the push service (browser vendor),
// keyed to our VAPID public key. This is the step that makes background/closed-tab
// delivery possible — everything before this was just local permission.
export async function subscribeToPush() {
  if (!pushSupported()) throw new Error("Push isn't supported in this browser.");
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) throw new Error("VITE_VAPID_PUBLIC_KEY is not configured (see .env.example).");

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

export async function unsubscribeFromPush() {
  const sub = await getExistingPushSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch("/api/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
  return endpoint;
}

// Tells the server about this subscription + the current reminder settings and
// today's incomplete habits. Safe to call repeatedly (upserts by endpoint) —
// this is how the server-side scheduler stays accurate without ever touching
// this browser's localStorage.
export async function syncPushSubscription(subscription, { reminderTime, notificationsEnabled, incompleteHabitNames }) {
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), reminderTime, notificationsEnabled, incompleteHabitNames }),
  });
  if (!res.ok) throw new Error(`Sync failed (${res.status})`);
  return res.json();
}

export async function sendTestPush(subscription) {
  const res = await fetch("/api/send-test-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error(body.error || `Test push failed (${res.status})`);
  return body;
}
