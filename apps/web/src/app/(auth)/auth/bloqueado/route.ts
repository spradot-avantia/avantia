import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Cierra la sesión de una cuenta sin acceso vigente (ADR 015): el panel la
 * redirige aquí porque un Server Component no puede borrar cookies.
 */
export async function GET(request: NextRequest) {
  await createSupabaseServerClient().auth.signOut();
  const u = request.nextUrl.clone();
  u.pathname = "/login";
  u.search = "?error=sin_invitacion";
  return NextResponse.redirect(u);
}
