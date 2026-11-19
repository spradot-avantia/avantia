import { defineConfig } from "@playwright/test";

// Video demo del MVP (B-48). Corre contra Vercel Preview (dev), nunca contra producción.
//   Validar (sin grabar):  npx playwright test -c demo-video/playwright.demo.config.ts
//   Grabar:                GRABAR=1 npx playwright test -c demo-video/playwright.demo.config.ts --headed
// DEMO_CRED = JSON con { email, password } de la creadora ficticia (fuera del repo).
// DEMO_SALIDA = carpeta de videos y marcas (fuera del repo).
const grabar = process.env.GRABAR === "1";

export default defineConfig({
  testDir: ".",
  testMatch: /demo\.spec\.ts$/,
  timeout: grabar ? 15 * 60_000 : 3 * 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: process.env.DEMO_SALIDA ? `${process.env.DEMO_SALIDA}/resultados` : "test-results-demo",
  use: {
    locale: "es-CL",
    timezoneId: "America/Santiago",
    colorScheme: "light",
    trace: grabar ? "off" : "retain-on-failure",
    screenshot: grabar ? "off" : "only-on-failure",
    launchOptions: { slowMo: grabar ? 120 : 0 },
  },
});
