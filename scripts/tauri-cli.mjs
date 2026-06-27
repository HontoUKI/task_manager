import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);

// Minimal dotenv reader for the root dev-server settings used by Tauri.
function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return {};

  const env = {};
  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getDevServer() {
  const fileEnv = {
    ...loadDotEnv(join(root, ".env")),
    ...loadDotEnv(join(root, ".env.local")),
  };
  const env = { ...fileEnv, ...process.env };
  const host = env.VITE_DEV_SERVER_HOST || "127.0.0.1";
  const port = Number.parseInt(env.VITE_DEV_SERVER_PORT || "1420", 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("VITE_DEV_SERVER_PORT must be an integer from 1 to 65535.");
  }

  return { host, port };
}

function writeDevConfig() {
  const { host, port } = getDevServer();
  const configPath = join(root, ".local", "tauri.dev.conf.json");

  // Tauri reads devUrl from config before the frontend server starts, so the
  // wrapper writes a small generated override that matches Vite's configured port.
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        build: {
          devUrl: `http://${host}:${port}`,
        },
      },
      null,
      2,
    ),
  );

  return configPath;
}

if (args[0] === "dev") {
  const configPath = writeDevConfig();
  args.push("--config", configPath);
}

// Use the project-local CLI to avoid depending on a global Tauri install.
const binary = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tauri.cmd" : "tauri",
);
const child = spawn(binary, args, {
  cwd: root,
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 1);
});
