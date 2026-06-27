import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number.parseInt(env.VITE_DEV_SERVER_PORT || "1420", 10);

  // Keep Vite strict: if this port is busy, Tauri should fail loudly instead of
  // waiting on a different devUrl.
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("VITE_DEV_SERVER_PORT must be an integer from 1 to 65535.");
  }

  return {
    plugins: [react()],
    clearScreen: false,
    envPrefix: ["VITE_", "TAURI_ENV_*"],
    server: {
      host: env.VITE_DEV_SERVER_HOST || "127.0.0.1",
      port,
      strictPort: true,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
