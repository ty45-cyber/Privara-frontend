import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  // cofhejs uses WASM internally for FHE operations
  optimizeDeps: {
    exclude: ["cofhejs"],
  },
  build: {
    target: "esnext",
  },
});