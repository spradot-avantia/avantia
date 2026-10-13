/**
 * Clasificación pura de hosts para el middleware (corre en el edge: sin I/O).
 * Vive aparte para poder probarla sin Next.
 */
export type HostKind = "marketing" | "panel" | "tenant";

export interface HostConfig {
  /** Host exacto del panel, p. ej. "app.avantia.app". */
  panelHost: string;
  marketingHosts: string[];
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Comparación EXACTA (no `endsWith`): "myapp.avantia.app" es el subdominio de
 * una academia, no el panel. Los subdominios `app`, `www`, `api`, `admin`… se
 * reservan al crear academias (ver lib/tenant/reservados.ts).
 */
export function classifyHost(rawHost: string, config: HostConfig): HostKind {
  const host = rawHost.split(":")[0].trim().toLowerCase();
  if (config.marketingHosts.includes(host)) return "marketing";
  if (LOCAL_HOSTS.has(host) || host === config.panelHost.toLowerCase()) return "panel";
  return "tenant";
}
