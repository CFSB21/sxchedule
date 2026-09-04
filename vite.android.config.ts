import path from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  publicDir: "public",
  build: {
    outDir: "android-www",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "android-index.html"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
