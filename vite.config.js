import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/spirit_islant_companion_webapp/", 
  server: {
    allowedHosts: [
      "d6f7e824d660.ngrok-free.app"
    ]
  }
});