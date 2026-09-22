import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export async function POST(request: Request) {
  const { tenantId, domain } = (await request.json()) as {
    tenantId?: string;
    domain?: string;
  };

  if (!tenantId || !domain || !DOMAIN_REGEX.test(domain)) {
    return NextResponse.json(
      { error: "Falta tenantId o el dominio no tiene un formato válido" },
      { status: 400 }
    );
  }

  // MOCK: por ahora solo guardamos el dominio, sin provisionarlo de verdad.
  // Cuando exista la cuenta de Vercel (ver Supuestos_y_Pendientes.md), acá
  // va la llamada real:
  //   POST https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains
  //   Authorization: Bearer ${VERCEL_API_TOKEN}
  //   body: { name: domain }
  // y el estado/los registros DNS a verificar saldrían de esa respuesta en
  // vez de estar hardcodeados como acá abajo.
  const { error } = await supabaseAdmin
    .from("tenants")
    .update({ custom_domain: domain })
    .eq("id", tenantId);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar el dominio" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    domain,
    status: "pendiente_verificacion",
    registrosDns: [{ tipo: "CNAME", nombre: domain, valor: "cname.vercel-dns.com (mock)" }],
  });
}
