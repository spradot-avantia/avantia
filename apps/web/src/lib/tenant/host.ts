/**
 * Clasificación pura de hosts para el middleware (corre en el edge: sin I/O).
 * Vive aparte para poder probarla sin Next.
 */
export type HostKind = "marketing" | "panel" | "plataforma" | "tenant";

export interface HostConfig {
  /** Host exacto del panel, p. ej. "app.avantia.app". */
  panelHost: string;
  marketingHosts: string[];
  /**
   * Hosts que sirven landing Y panel en el mismo dominio (ADR 012): "/" muestra
   * la landing a quien no tiene sesión y el panel a quien la tiene.
   */
  platformHosts?: string[];
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Comparación EXACTA (no `endsWith`): "myapp.avantia.app" es el subdominio de
 * una academia, no el panel. Los subdominios `app`, `www`, `api`, `admin`… se
 * reservan al crear academias (ver lib/tenant/reservados.ts).
 */
export function classifyHost(rawHost: string, config: HostConfig): HostKind {
  const host = rawHost.split(":")[0].trim().toLowerCase();
  if (config.platformHosts?.includes(host)) return "plataforma";
  if (config.marketingHosts.includes(host)) return "marketing";
  if (LOCAL_HOSTS.has(host) || host === config.panelHost.toLowerCase()) return "panel";
  return "tenant";
}

/** Cómo buscar la academia dueña de un host público (ver `tenantLookupPorHost`). */
export type BusquedaTenant = { por: "subdominio"; valor: string } | { por: "dominio"; valor: string };

function normalizarHost(rawHost: string): string {
  return rawHost.split(":")[0].trim().toLowerCase().replace(/\.$/, "");
}

/**
 * Decide si un host de academia se busca por subdominio o por dominio propio.
 * Pura (sin I/O). `<sub>.<dominio raíz>` y `<sub>.localhost` → subdominio (un solo
 * segmento); cualquier otro host → dominio propio exacto. Así `finanzasclaras.cl`
 * nunca cae en la academia de subdominio `finanzasclaras`, y viceversa.
 */
export function tenantLookupPorHost(rawHost: string, dominiosRaiz: string[]): BusquedaTenant | null {
  const host = normalizarHost(rawHost);
  if (!host) return null;
  const raices = [...dominiosRaiz.map(normalizarHost), "localhost"].filter(Boolean);
  for (const raiz of raices) {
    if (!host.endsWith(`.${raiz}`)) continue;
    const sub = host.slice(0, -(raiz.length + 1));
    if (sub && !sub.includes(".")) return { por: "subdominio", valor: sub };
  }
  return { por: "dominio", valor: host };
}
