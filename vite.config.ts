import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const isCpanelBuild = process.env.CPANEL_BUILD === "1";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      ...(isCpanelBuild
        ? {
            spa: {
              enabled: true,
              prerender: {
                outputPath: "/index.html",
                crawlLinks: false,
                retryCount: 0,
              },
            },
          }
        : {}),
    }),
    viteReact(),
    tailwindcss(),
  ],
  base: isCpanelBuild ? "/nills_mart/" : "/",
});
