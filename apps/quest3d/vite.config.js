import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          physics: ["@dimforge/rapier3d-compat"],
          three: ["three"],
        },
      },
    },
  },
  server: { host: "127.0.0.1", port: 4317, strictPort: true },
});
