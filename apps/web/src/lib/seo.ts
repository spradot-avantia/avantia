// URL pública canónica de la plataforma (landing + panel, ADR 012).
// NEXT_PUBLIC_SITE_URL manda; si no existe, cae al host del panel.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_PANEL_URL ??
  "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "Avantia";
export const SITE_DESCRIPTION =
  "Sube tus cursos, recibe los pagos de tus alumnos y entrégales una experiencia con tu marca. Programa fundador: 5 cupos, 30 días gratis, sin tarjeta.";
