import { defineConfig } from "vitest/config";

// Los E2E de Playwright viven en e2e/ y se corren con `npm run test:e2e`.
export default defineConfig({ test: { exclude: ["**/node_modules/**", "e2e/**", ".next/**"] } });
