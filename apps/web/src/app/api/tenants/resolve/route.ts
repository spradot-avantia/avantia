import { NextResponse } from "next/server";
import { resolveTenantByHostname } from "../../../../lib/tenant/resolve";

// GET /api/tenants/resolve?hostname=academiadejuan.com
// Datos públicos de la academia de un host. Usa la misma búsqueda que el sitio
// público (subdominio bajo un dominio raíz o dominio propio exacto): el valor del
// query nunca se interpola en un filtro de PostgREST.
export async function GET(request: Request) {
  const hostname = (new URL(request.url).searchParams.get("hostname") ?? "").slice(0, 253);

  if (!hostname) {
    return NextResponse.json({ error: "Falta el parámetro hostname" }, { status: 400 });
  }

  const tenant = await resolveTenantByHostname(hostname);
  if (!tenant) {
    return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    id: tenant.id,
    slug: tenant.slug,
    nombre: tenant.nombre,
    logo_url: tenant.theme.logoUrl,
    color_primario: tenant.theme.colorPrimario,
  });
}
