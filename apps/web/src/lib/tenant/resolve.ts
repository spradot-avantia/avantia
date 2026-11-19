import { supabaseAdmin } from "../supabase/admin";
import type { Tenant } from "../../types/tenant";
import { formaDe, tipografiaDe } from "./identidad";
import { tenantLookupPorHost } from "./host";

// Cache en memoria simple: hostname/slug -> tenant no cambia seguido, así que
// evitamos pegarle a la base de datos en cada render. Ojo: esto vive por
// instancia del proceso, así que en un despliegue con varias instancias cada
// una tiene su propio cache (aceptable para el volumen actual del proyecto).
// Las dos funciones comparten el mismo cache; se prefijan las claves
// (hostname:/slug:) para que un hostname y un slug iguales no choquen.
const cache = new Map<string, { tenant: Tenant; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function mapRowToTenant(data: {
  id: string;
  slug: string;
  custom_domain: string | null;
  subdomain: string;
  nombre: string;
  logo_url: string | null;
  logo_modo: string | null;
  frase: string | null;
  color_primario: string | null;
  tipografia: string | null;
  forma: string | null;
}): Tenant {
  return {
    id: data.id,
    slug: data.slug,
    customDomain: data.custom_domain,
    subdomain: data.subdomain,
    nombre: data.nombre,
    frase: data.frase,
    theme: {
      logoUrl: data.logo_url,
      logoModo: data.logo_modo === "solo_logo" ? "solo_logo" : "logo_y_nombre",
      colorPrimario: data.color_primario ?? "#000000",
      tipografia: tipografiaDe(data.tipografia),
      forma: formaDe(data.forma),
    },
  };
}

const TENANT_COLUMNS =
  "id, slug, custom_domain, subdomain, nombre, frase, logo_url, logo_modo, color_primario, tipografia, forma";

/**
 * Dominios bajo los que una academia vive como `<subdominio>.<raíz>`: el dominio
 * raíz público, los de TENANT_ROOT_DOMAINS (coma) y los hosts de plataforma y
 * marketing sin `www.` (p. ej. goavantia.com, dev.goavantia.com).
 */
export function dominiosRaizTenant(): string[] {
  const lista = (v: string | undefined) => (v ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const raices = [
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "avantia.app",
    ...lista(process.env.TENANT_ROOT_DOMAINS),
    ...lista(process.env.PLATFORM_HOSTS).map((h) => h.replace(/^www\./, "")),
    ...lista(process.env.MARKETING_HOSTS).map((h) => h.replace(/^www\./, "")),
  ];
  return Array.from(new Set(raices));
}

export async function resolveTenantByHostname(
  hostname: string
): Promise<Tenant | null> {
  // Subdominio solo bajo un dominio raíz conocido; si no, dominio propio exacto.
  // Nunca se mezclan (antes un `.or()` tomaba el primer segmento de cualquier host).
  const busqueda = tenantLookupPorHost(hostname, dominiosRaizTenant());
  if (!busqueda) return null;

  const cacheKey = `${busqueda.por}:${busqueda.valor}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq(busqueda.por === "subdominio" ? "subdomain" : "custom_domain", busqueda.valor)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const tenant = mapRowToTenant(data);
  cache.set(cacheKey, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
  return tenant;
}

// Usado mientras no hay auth (ver Supuestos_y_Pendientes.md): el Dashboard y
// la página de admin de dominio operan sobre un único tenant fijo,
// identificado por DEMO_TENANT_SLUG, en vez de derivarlo de una sesión.
export async function resolveTenantBySlug(
  subdomain: string
): Promise<Tenant | null> {
  const cacheKey = `slug:${subdomain}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const tenant = mapRowToTenant(data);
  cache.set(cacheKey, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
  return tenant;
}
