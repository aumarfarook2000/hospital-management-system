import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],

    server: {
        port: 5173,
        proxy:{
            '/api':{
                target:'https://hospital-management-system-xsw9.onrender.com',
                changeOrigin: true,
            },
        },
    },
});