import { defineConfig, devices } from "@playwright/test";

// Pruebas E2E móviles del sitio de la academia. Topología local (ver .env.local):
// localhost = panel, <subdominio>.localhost = academia (Chromium resuelve *.localhost).
// Uso: npm run dev (otra terminal) y `npm run test:e2e` desde apps/web.
// E2E_TENANT = subdominio de una academia con un curso publicado de acceso "enlace".
// E2E_ACADEMIA_URL = URL completa de una academia ya desplegada (anula la topología local).
const tenant = process.env.E2E_TENANT ?? "prueba";
const puerto = process.env.E2E_PORT ?? "3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_ACADEMIA_URL ?? `http://${tenant}.localhost:${puerto}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "movil-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 740 } } },
    { name: "movil-390", use: { ...devices["iPhone 13"], browserName: "chromium", defaultBrowserType: "chromium" } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
});
