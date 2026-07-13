import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/vichola-punjabi-couples/" : "/",
  plugins: [react(), cloudflare()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/uploads": "http://127.0.0.1:8787",
    },
  },
});