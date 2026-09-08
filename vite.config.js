import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { localPushApiPlugin } from "./server/vitePlugin.js";

export default defineConfig(({ mode }) => {
  // Vite only auto-exposes VITE_-prefixed vars to client code. The push API
  // handlers run server-side (inside this dev server / as Vercel functions) and
  // need the non-prefixed VAPID vars too, so load the full .env into process.env.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [react(), localPushApiPlugin()],
  };
});
