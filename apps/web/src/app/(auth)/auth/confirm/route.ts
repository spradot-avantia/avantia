import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NEXT, hostEsPanel, urlPanel } from "../../../../lib/auth/panel";
import { sanitizarNext } from "../../../../lib/auth/validacion";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const TIPOS = new Set<EmailOtpType>(["signup", "recovery", "email", "email_change", "invite", "magiclink"]);

/**
 * Destino de los enlaces de los correos de Supabase (confirmación de cuenta y
 * recuperación). La plantilla debe apuntar a:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup|recovery
 * Verifica el token con verifyOtp (deja la sesión en cookies) y redirige.
 * Ver docs/producto/Configuracion_Auth_Supabase.md.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  // La sesión del creador vive solo en el host del panel.
  if (!hostEsPanel(host)) {
    return NextResponse.redirect(`${urlPanel()}/auth/confirm${request.nextUrl.search}`);
  }

  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const destino = (path: string) => {
    const u = request.nextUrl.clone();
    const [pathname, search = ""] = path.split("?");
    u.pathname = pathname;
    u.search = search ? `?${search}` : "";
    return NextResponse.redirect(u);
  };

  if (!tokenHash || !type || !TIPOS.has(type)) return destino("/login?error=enlace_invalido");

  const { error } = await createSupabaseServerClient().auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return destino(type === "recovery" ? "/olvide-contrasena?error=enlace_invalido" : "/login?error=enlace_invalido");

  if (type === "recovery") return destino("/restablecer-contrasena");
  const jar = cookies();
  const recordado = type === "signup" ? jar.get(COOKIE_NEXT)?.value : undefined;
  if (recordado) jar.delete(COOKIE_NEXT);
  return destino(sanitizarNext(searchParams.get("next") ?? recordado));
}
