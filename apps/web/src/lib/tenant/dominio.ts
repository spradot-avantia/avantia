/**
 * Validación pura del dominio propio de una academia (sin I/O).
 * Un dominio propio no puede ser un host de la plataforma ni vivir bajo un
 * dominio raíz de Avantia: esos se resuelven por subdominio (ver `tenantLookupPorHost`).
 */
const FORMATO = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function validarDominioPropio(
  valor: unknown,
  opciones: { dominiosRaiz: string[]; hostsPlataforma: string[] },
): { ok: true; dominio: string } | { ok: false; motivo: string } {
  if (typeof valor !== "string") return { ok: false, motivo: "Escribe un dominio, por ejemplo micursos.com." };
  const dominio = valor.trim().toLowerCase().replace(/\.$/, "");
  if (dominio.length > 253 || !FORMATO.test(dominio)) {
    return { ok: false, motivo: "El dominio no tiene un formato válido (ejemplo: micursos.com)." };
  }
  const propios = [...opciones.dominiosRaiz, ...opciones.hostsPlataforma, "localhost"].map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (propios.some((h) => dominio === h || dominio.endsWith(`.${h}`))) {
    return { ok: false, motivo: "Ese dominio pertenece a la plataforma. Usa un dominio tuyo." };
  }
  return { ok: true, dominio };
}
