import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "../app/robots";
import { esDespliegueDePreview } from "./seo";
// @ts-expect-error: next.config.mjs es JavaScript sin tipos.
import nextConfig from "../../next.config.mjs";

describe("despliegues de Preview no indexables", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("solo VERCEL_ENV=preview cuenta como preview", () => {
    expect(esDespliegueDePreview("preview")).toBe(true);
    expect(esDespliegueDePreview("production")).toBe(false);
    expect(esDespliegueDePreview("development")).toBe(false);
    expect(esDespliegueDePreview(undefined)).toBe(false);
  });

  it("robots.txt cierra todo y no anuncia sitemap en preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const r = robots();
    expect(r.rules).toEqual([{ userAgent: "*", disallow: "/" }]);
    expect(r.sitemap).toBeUndefined();
  });

  it("robots.txt de producción sigue abierto y con sitemap", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const r = robots();
    expect(JSON.stringify(r.rules)).toContain('"allow":"/"');
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it("agrega X-Robots-Tag noindex a todas las rutas solo en preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const preview = await nextConfig.headers();
    expect(preview).toHaveLength(1);
    expect(preview[0].source).toBe("/:path*");
    expect(preview[0].headers[0]).toEqual({ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" });

    vi.stubEnv("VERCEL_ENV", "production");
    expect(await nextConfig.headers()).toEqual([]);
  });
});
