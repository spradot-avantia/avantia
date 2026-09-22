import { supabaseAdmin } from "../supabase/admin";
import type { Tenant } from "../../types/tenant";

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
  color_primario: string | null;
}): Tenant {
  return {
    id: data.id,
    slug: data.slug,
    customDomain: data.custom_domain,
    subdomain: data.subdomain,
    nombre: data.nombre,
    theme: {
      logoUrl: data.logo_url,
      colorPrimario: data.color_primario ?? "#000000",
    },
  };
}

const TENANT_COLUMNS =
  "id, slug, custom_domain, subdomain, nombre, logo_url, color_primario";

export async function resolveTenantByHostname(
  hostname: string
): Promise<Tenant | null> {
  const cacheKey = `hostname:${hostname}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(TENANT_COLUMNS)
    .or(`custom_domain.eq.${hostname},subdomain.eq.${hostname.split(".")[0]}`)
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
