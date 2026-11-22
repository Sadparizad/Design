#!/usr/bin/env node
// The one command: `npm start`. Installs what it needs on first run, then serves the Hub.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const hubDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const [major, minor] = process.versions.node.split(".").map(Number);
const supported = (major === 22 && minor >= 12) || major >= 24;
if (!supported) {
  console.error(
    `\nThe Design Hub needs Node.js 22.12 or newer, and this computer has ${process.versions.node}.\n` +
      "Install the latest LTS version from https://nodejs.org and run this again.\n",
  );
  process.exit(1);
}

let installed = true;
try {
  import.meta.resolve("vite");
} catch {
  installed = false;
}

if (!installed) {
  console.log("\nSetting up the Design Hub for the first time. This takes a minute...\n");
  const install = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: hubDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (install.status !== 0) {
    console.error(
      "\nThe set-up did not finish. Check your internet connection and run the same command again.\n",
    );
    process.exit(1);
  }
}

// Loaded only now, because it does not exist until the install above has run.
const { createServer } = await import("vite");
const server = await createServer({ root: hubDir });
await server.listen();
console.log("\nDesign Hub is running. Press Ctrl+C to stop it.");
server.printUrls();
