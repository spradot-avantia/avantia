import { NextResponse } from "next/server";
import { getCreadorContext } from "../../../../lib/creador/tenantActual";
import { validarDominioPropio } from "../../../../lib/tenant/dominio";
import { dominiosRaizTenant } from "../../../../lib/tenant/resolve";

/**
 * POST /api/tenants/domain { domain }
 * Guarda el dominio propio de la academia de la SESIÓN. El tenant nunca sale del
 * body (antes se aceptaba `tenantId` y se escribía con service role sin sesión:
 * cualquiera podía cambiar el dominio de cualquier academia). Escribe con el
 * cliente con RLS (`tenants_update_propio`).
 *
 * MOCK: solo guarda el dominio, sin provisionarlo en Vercel ni validar DNS
 * (RQ-30). Cuando exista la integración, acá va
 * POST https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains.
 */
export async function POST(request: Request) {
  const ctx = await getCreadorContext();
  if (!ctx || ctx.modo !== "sesion") {
    return NextResponse.json({ error: "Inicia sesión para conectar un dominio." }, { status: 401 });
  }

  let body: { domain?: unknown };
  try {
    body = (await request.json()) as { domain?: unknown };
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const hostsPlataforma = [process.env.PLATFORM_HOSTS, process.env.MARKETING_HOSTS, process.env.PANEL_HOST_SUFFIX]
    .flatMap((v) => (v ?? "").split(","))
    .map((h) => h.trim())
    .filter(Boolean);
  const v = validarDominioPropio(body.domain, { dominiosRaiz: dominiosRaizTenant(), hostsPlataforma });
  if (!v.ok) {
    return NextResponse.json({ error: v.motivo }, { status: 400 });
  }

  const { data, error } = await ctx.db
    .from("tenants")
    .update({ custom_domain: v.dominio })
    .eq("id", ctx.tenant.id)
    .select("id")
    .maybeSingle();

  if (error?.code === "23505") {
    return NextResponse.json({ error: "Ese dominio ya lo usa otra academia." }, { status: 409 });
  }
  if (error || !data) {
    console.error("[tenants/domain] no se pudo guardar", error?.code ?? "sin fila");
    return NextResponse.json({ error: "No se pudo guardar el dominio" }, { status: 500 });
  }

  return NextResponse.json({
    domain: v.dominio,
    status: "pendiente_verificacion",
    registrosDns: [{ tipo: "CNAME", nombre: v.dominio, valor: "cname.vercel-dns.com (mock)" }],
  });
}
