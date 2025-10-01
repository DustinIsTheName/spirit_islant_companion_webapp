import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/spirit_islant_companion_webapp/", 
  server: {
    allowedHosts: [
      "ea100a3c8255.ngrok-free.app"
    ]
  }
});