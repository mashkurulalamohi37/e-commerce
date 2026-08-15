import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Two ways in, because `--mode cpanel` is the cross-platform trigger (it also
  // makes Vite load .env.cpanel) while CPANEL_BUILD=1 is what the older build
  // notes used. Setting an env var inline is not portable between PowerShell
  // and sh, and cross-env is not a dependency here.
  const isCpanelBuild = mode === "cpanel" || process.env.CPANEL_BUILD === "1";

  // The cPanel build is a static SPA dropped into a document root. It is served
  // at the root of nillsmart.com, so asset URLs must be root-absolute. Override
  // with CPANEL_BASE only when deploying into a subfolder (e.g. "/nills_mart/"),
  // and keep the trailing slash -- Vite joins this onto asset paths verbatim.
  const cpanelBase = process.env.CPANEL_BASE || "/";

  return {
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
    base: isCpanelBuild ? cpanelBase : "/",
  };
});
