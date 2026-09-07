import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "..",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://orthoking.onrender.com",
        changeOrigin: true,
      },
      "/uploads": {
        target: "https://orthoking.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
