// URL pública canónica de la plataforma (landing + panel, ADR 012).
// NEXT_PUBLIC_SITE_URL manda; si no existe, cae al host del panel.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_PANEL_URL ??
  "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * Los despliegues de Preview (la rama `dev`, con datos de prueba) nunca deben
 * indexarse: Vercel define VERCEL_ENV=preview en ellos. Producción y el
 * desarrollo local no se ven afectados. Ver next.config.mjs (X-Robots-Tag) y robots.ts.
 */
export function esDespliegueDePreview(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv === "preview";
}

export const SITE_NAME = "Avantia";
export const SITE_DESCRIPTION =
  "Sube tus cursos, recibe los pagos de tus alumnos y entrégales una experiencia con tu marca. Programa fundador: 5 cupos, 30 días gratis, sin tarjeta.";
