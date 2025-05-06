import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: "public/wasm/*",
          dest: "wasm",
        },
      ],
    }),
  ],
  assetsInclude: ["*.wasm"],
  optimizeDeps: {
    exclude: ["*.wasm"],
  },
  build: {
    rollupOptions: {
      external: ["/wasm/validator.js"],
    },
  },
});
