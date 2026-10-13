/** Subdominios que no puede tomar una academia (infraestructura y marca). */
export const SUBDOMINIOS_RESERVADOS = new Set([
  "app", "www", "api", "admin", "staging", "dev", "mail", "smtp", "ftp",
  "docs", "blog", "status", "soporte", "support", "ayuda", "help",
  "login", "registro", "auth", "cdn", "assets", "static", "avantia",
]);

const FORMATO = /^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$/;

export function validarSubdominio(valor: string): { ok: true } | { ok: false; motivo: string } {
  const s = valor.trim().toLowerCase();
  if (!FORMATO.test(s)) {
    return { ok: false, motivo: "Usa de 3 a 40 caracteres: letras, números y guiones, sin guion al inicio ni al final." };
  }
  if (SUBDOMINIOS_RESERVADOS.has(s)) {
    return { ok: false, motivo: "Ese nombre está reservado. Elige otro." };
  }
  return { ok: true };
}
