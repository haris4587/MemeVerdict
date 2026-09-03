import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative assets make the same build portable across GitHub Pages,
  // static hosts, and sandbox previews.
  base: "./",
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true,
  },
});
