import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      // `fengari` is the Node build of the Lua VM: at load time it reads
      // `process.versions.node` (liolib.js), which doesn't exist in a browser
      // and crashes the whole app before React mounts (blank page).
      // `fengari-web` is the browser build with the Node-specific code stripped.
      // Node scripts/tests keep using plain `fengari` via @freewrite/core.
      fengari: "fengari-web",
    },
  },
});
