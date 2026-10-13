import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresco de sesión de Supabase para el HOST DEL PANEL (lo invoca middleware.ts
 * solo cuando classifyHost() == "panel"). Sin consultar tablas.
 *
 * Por qué middleware: los Server Components no pueden escribir cookies, así que
 * sin esto un access token vencido nunca se renovaría durante la navegación.
 *
 * Costo: solo si la request trae cookies de sesión (`sb-*-auth-token*`); las
 * anónimas no pagan nada. getSession lee la cookie y únicamente va a la red
 * cuando el token venció (renueva con el refresh token). La validación del
 * JWT contra Auth la hace el layout con getUser, una vez por request.
 *
 * También fija `x-av-pathname` (pisando lo que mande el cliente) para que el
 * layout pueda armar `/login?next=...` sin depender de headers internos.
 */
export async function refrescarSesionPanel(request: NextRequest): Promise<NextResponse> {
  request.headers.set("x-av-pathname", request.nextUrl.pathname + request.nextUrl.search);
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const haySesion = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!url || !anon || !haySesion) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: Array<{ name: string; value: string; options?: CookieOptions }>) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    // getSession lee la cookie y solo va a la red si el token vencio (para
    // renovarlo). NO valida el JWT: la autorizacion real la hace getUser()
    // en el layout (getUsuarioActual), una vez por request. Evita una
    // llamada de red (~200 ms) en cada navegacion.
    await supabase.auth.getSession();
  } catch {
    // Si Supabase no responde, se deja pasar: el layout resolverá la sesión.
  }
  return response;
}
