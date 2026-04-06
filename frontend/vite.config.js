import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const [pathname, query = ""] = String(path || "").split("?");
          const cleanPath = pathname.replace(/^\/api\/?/, "");
          const targetPath = `/Online-Learning-Platform/backend/router.php?path=${cleanPath}`;
          return query ? `${targetPath}&${query}` : targetPath;
        }
      },
      "/uploads": {
        target: "http://localhost",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/Online-Learning-Platform/backend${path}`
      }
    }
  }
});
