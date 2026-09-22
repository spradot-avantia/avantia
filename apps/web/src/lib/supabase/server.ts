import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente por-request que respeta las políticas de RLS según el usuario
 * autenticado: toma la sesión de las cookies (Next.js maneja el
 * refresh/persistencia vía @supabase/ssr). Así, aunque haya un bug en el
 * código de la app, un profesor de un tenant nunca puede leer datos de otro
 * tenant porque la base de datos misma lo bloquea (RLS).
 *
 * Solo puede usarse en Server Components, Route Handlers o Server Actions
 * (necesita acceso a `cookies()`).
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno"
    );
  }

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: CookieOptions;
        }>
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // set() puede fallar si se llama desde un Server Component sin
          // response mutable (ej. durante el render); en ese caso el
          // refresco de sesión lo hace el middleware en la próxima request.
        }
      },
    },
  });
}
