import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import envCompatible from "vite-plugin-env-compatible"
import dotenv from "dotenv"

dotenv.config()

const backendProxyTarget =
  process.env.VITE_BACKEND_PROXY_TARGET ?? "http://localhost:8000"

const backendProxy = {
  target: backendProxyTarget,
  changeOrigin: true,
  secure: false,
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite(), envCompatible()],
  define: {
    'process.env': process.env,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": backendProxy,
      "/docs": backendProxy,
      "/redoc": backendProxy,
    },
  },
})
