// DEV/DEMO SUBSCRIPTION STORE — a flat JSON file, not production persistence.
// Good enough for a single-instance hackathon demo. A real deployment needs a
// proper store (Vercel KV, Upstash, a database...) since serverless instances
// don't share a filesystem and a cold start can reset it.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "server/data");
const FILE = path.join(DATA_DIR, "subscriptions.json");

function ensureFile() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) writeFileSync(FILE, "[]");
}

export function readSubscriptions() {
  ensureFile();
  try {
    return JSON.parse(readFileSync(FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function writeSubscriptions(records) {
  ensureFile();
  writeFileSync(FILE, JSON.stringify(records, null, 2));
}

// Upserts by endpoint — a push subscription's endpoint URL is its stable identity.
export function upsertSubscription(record) {
  const all = readSubscriptions();
  const idx = all.findIndex((r) => r.endpoint === record.endpoint);
  const now = new Date().toISOString();
  if (idx === -1) {
    const created = { ...record, createdAt: now, updatedAt: now };
    all.push(created);
    writeSubscriptions(all);
    return created;
  }
  all[idx] = { ...all[idx], ...record, updatedAt: now };
  writeSubscriptions(all);
  return all[idx];
}

export function removeSubscription(endpoint) {
  writeSubscriptions(readSubscriptions().filter((r) => r.endpoint !== endpoint));
}

export function markNotified(endpoint, dateISO) {
  const all = readSubscriptions();
  const idx = all.findIndex((r) => r.endpoint === endpoint);
  if (idx === -1) return;
  all[idx].lastNotifiedDate = dateISO;
  all[idx].updatedAt = new Date().toISOString();
  writeSubscriptions(all);
}
