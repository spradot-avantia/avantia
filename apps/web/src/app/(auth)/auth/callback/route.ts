import { NextResponse, type NextRequest } from "next/server";
import { hostEsPanel, urlPanel } from "../../../../lib/auth/panel";
import { puedeRegistrarse } from "../../../../lib/postulacion/acceso";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { sanitizarNext } from "../../../../lib/auth/validacion";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Vuelta del login con Google (OAuth, flujo PKCE). Supabase redirige aquí con
 * ?code=...&next=... ; se cambia el código por una sesión (cookies) y se sigue
 * a `next`. Debe estar en Supabase → Authentication → URL Configuration →
 * Redirect URLs. Los enlaces de correo van a /auth/confirm, no aquí.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  // La sesión del creador vive solo en el host del panel.
  if (!hostEsPanel(host)) {
    return NextResponse.redirect(`${urlPanel()}/auth/callback${request.nextUrl.search}`);
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const destino = (path: string) => {
    const u = request.nextUrl.clone();
    const [pathname, search = ""] = path.split("?");
    u.pathname = pathname;
    u.search = search ? `?${search}` : "";
    return NextResponse.redirect(u);
  };

  // El usuario canceló en Google o Supabase devolvió un error.
  if (searchParams.get("error") || !code) return destino("/login?error=google");

  const { error } = await createSupabaseServerClient().auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] exchangeCodeForSession", error.code ?? error.message);
    return destino("/login?error=google");
  }

  // Registro por invitación (ADR 014). Google crea la cuenta al ingresar: si es nueva
  // (menos de 10 min) y el correo no tiene postulación aceptada, se borra y se cierra la sesión.
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (u && Date.now() - new Date(u.created_at).getTime() < 10 * 60_000 && !(await puedeRegistrarse(u.email))) {
    await supabase.auth.signOut();
    const { error: errBorrado } = await supabaseAdmin.auth.admin.deleteUser(u.id);
    if (errBorrado) console.error("[auth] no se pudo borrar la cuenta sin invitación", errBorrado.message);
    return destino("/login?error=sin_invitacion");
  }

  return destino(sanitizarNext(searchParams.get("next")));
}