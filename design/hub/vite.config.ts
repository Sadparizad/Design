import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";
import { createDataLayer } from "./src/data/index.ts";
import { createApiHandler } from "./src/server/api.ts";

// design/ is the folder above hub/. Passed in explicitly because this file is bundled
// by Vite before it runs, so the data module cannot work out its own location here.
const designRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function designHubApi(): Plugin {
  const handler = createApiHandler(createDataLayer(designRoot)) as Connect.NextHandleFunction;
  return {
    name: "design-hub-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  // "/Design/" on GitHub Pages (set in the workflow); "/" for the local Hub.
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), designHubApi()],
  // Local only: this server can write files, so it is not exposed to the network.
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
});
