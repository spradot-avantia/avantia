import { NextResponse, type NextRequest } from "next/server";
import { hostEsPanel, urlPanel } from "../../../../lib/auth/panel";
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

  return destino(sanitizarNext(searchParams.get("next")));
}