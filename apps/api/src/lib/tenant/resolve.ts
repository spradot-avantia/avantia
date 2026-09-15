import { supabaseAdmin } from "../supabase/admin.js";
import type { Tenant } from "../../types/tenant.js";

// Cache en memoria simple: el hostname -> tenant no cambia seguido, así que
// evitamos pegarle a la base de datos en cada request. Ojo: esto vive por
// instancia del proceso, así que en un despliegue con varias instancias cada
// una tiene su propio cache (aceptable para el volumen actual del proyecto).
const cache = new Map<string, { tenant: Tenant; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

export async function resolveTenantByHostname(
  hostname: string
): Promise<Tenant | null> {
  const cached = cache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, custom_domain, subdomain, nombre, logo_url, color_primario")
    .or(`custom_domain.eq.${hostname},subdomain.eq.${hostname.split(".")[0]}`)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const tenant: Tenant = {
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

  cache.set(hostname, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
  return tenant;
}
