import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

// GET /api/tenants/resolve?hostname=academiadejuan.com
// Lo consume el Client Component del reproductor (aprender/[cursoId]/...),
// que necesita el tenant activo del lado del cliente. El resto del sitio
// público ya lo recibe resuelto desde el Server Component
// (public)/[domain]/layout.tsx, sin pasar por este endpoint.
export async function GET(request: Request) {
  const hostname = new URL(request.url).searchParams.get("hostname") ?? "";

  if (!hostname) {
    return NextResponse.json(
      { error: "Falta el parámetro hostname" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, nombre, logo_url, color_primario")
    .or(`custom_domain.eq.${hostname},subdomain.eq.${hostname.split(".")[0]}`)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Academia no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
