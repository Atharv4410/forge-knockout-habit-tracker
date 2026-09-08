import { removeSubscription } from "../server/store.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method not allowed");
  }
  const { endpoint } = req.body || {};
  if (endpoint) removeSubscription(endpoint);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}
