import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: ["CLUSTIL_"],
  server: {
    proxy: {
      "/socket.io": {
        target: "http://gpu.saige.in",
        changeOrigin: true,
        ws: true,
        xfwd: true,
      },
      "/update_user": {
        target: "http://gpu.saige.in",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/socket.io": {
        target: "http://gpu.saige.in",
        changeOrigin: true,
        ws: true,
        xfwd: true,
      },
      "/update_user": {
        target: "http://gpu.saige.in",
        changeOrigin: true,
      },
    },
    allowedHosts: ["lnx6.ws.saige.in"],
  },
});
