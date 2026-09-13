import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    // Fail instead of falling back to 5174: only http://localhost:5173 is a
    // registered Google OAuth JavaScript origin, so any other port sign-in
    // attempt dies with "Error 400: origin_mismatch".
    strictPort: true,

    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});