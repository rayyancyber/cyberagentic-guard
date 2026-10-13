// Build configuration for CYBERGUARD X
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    // Target Vercel's serverless/edge runtime
    preset: "vercel",
  },
});
