import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const backendPort = env.DJANGO_PORT || "8005";

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            proxy: {
                "/api": {
                    target: `http://localhost:${backendPort}`,
                    changeOrigin: true,
                },
                "/ws": {
                    target: `ws://localhost:${backendPort}`,
                    ws: true,
                    changeOrigin: true,
                },
            },
        },
    };
});
