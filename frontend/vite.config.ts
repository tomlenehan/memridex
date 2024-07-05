import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import envCompatible from 'vite-plugin-env-compatible';
import dotenv from 'dotenv';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite(), envCompatible()],
    define: {
    'process.env': process.env,
  },
})
