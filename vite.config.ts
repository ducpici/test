import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vite.dev/config/

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const allowedHosts = env.VITE_ALLOWED_HOST
    ? [env.VITE_ALLOWED_HOST]
    : undefined;
  const port = env.VITE_PORT ? Number(env.VITE_PORT) : 5173;
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port,
      allowedHosts,
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
