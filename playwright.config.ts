import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "**/blueprints/**",

  // Timeout per test — OIDC flow butuh beberapa detik redirect
  timeout: 60_000,

  // Retri mencegah kegagalan spurious saat blueprint Authentik belum selesai apply
  retries: 2,

  // Satu worker — hindari race condition pada session login yang berbeda
  workers: 1,

  use: {
    // E2E_BASE_URL disesuaikan dengan AUTH_URL di .env.e2e (HOST_IP)
    // agar PKCE cookie domain cocok saat callback OIDC
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:9100",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
