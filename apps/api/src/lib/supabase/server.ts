import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente por-request que respeta las políticas de RLS según el usuario
 * autenticado: se crea pasándole el JWT que el frontend manda en el header
 * Authorization. Así, aunque haya un bug en el código de la API, un profesor
 * de un tenant nunca puede leer datos de otro tenant porque la base de datos
 * misma lo bloquea (RLS). Es el equivalente al lib/supabase/server.ts de
 * Next.js, que ahí tomaba la sesión de las cookies en vez de un header.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    "Faltan SUPABASE_URL o SUPABASE_ANON_KEY en las variables de entorno"
  );
}

export function createSupabaseForRequest(accessToken?: string): SupabaseClient {
  return createClient(supabaseUrl!, anonKey!, {
    auth: { persistSession: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}
