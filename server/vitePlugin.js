// Mounts the api/*.js handlers as middleware inside the Vite dev server, so
// `npm run dev` alone is enough locally — no separate process, no Vercel CLI.
// The handlers themselves use plain (req, res) Node signatures, so they also
// deploy unchanged as Vercel Serverless Functions from api/.
import subscribeHandler from "../api/subscribe.js";
import unsubscribeHandler from "../api/unsubscribe.js";
import sendTestPushHandler from "../api/send-test-push.js";
import sendRemindersHandler, { runReminderSweep } from "../api/send-reminders.js";

const ROUTES = {
  "/api/subscribe": subscribeHandler,
  "/api/unsubscribe": unsubscribeHandler,
  "/api/send-test-push": sendTestPushHandler,
  "/api/send-reminders": sendRemindersHandler,
};

function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export function localPushApiPlugin() {
  return {
    name: "local-push-api",
    configureServer(server) {
      // Dev-only stand-in for a real cron: checks every 60s for due reminders
      // while the dev server process is alive. This is a server-side scheduler
      // (not a browser tab timer) — it runs whether or not any tab is open.
      const interval = setInterval(() => {
        runReminderSweep().catch((err) => console.error("[push] reminder sweep failed:", err.message));
      }, 60000);
      server.httpServer?.once("close", () => clearInterval(interval));

      server.middlewares.use(async (req, res, next) => {
        const route = ROUTES[req.url?.split("?")[0]];
        if (!route) return next();
        req.body = await readJsonBody(req);
        try {
          await route(req, res);
        } catch (err) {
          console.error("[push] handler error:", err.message);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
    },
  };
}
