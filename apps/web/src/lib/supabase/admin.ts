import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service role: bypassa RLS por completo. Uso EXCLUSIVO de
 * Server Components / route handlers, en operaciones que necesitan leer o
 * escribir entre tenants (ej. resolver qué tenant corresponde a un
 * hostname). Nunca importar este archivo desde código de cliente ("use
 * client") ni desde nada que responda a un request de un tenant sin filtrar
 * explícitamente por tenant_id.
 *
 * Se instancia bajo demanda (primer uso), no al importar el módulo: así
 * `next build` no necesita secretos para recolectar datos de las rutas, y la
 * falta de variables falla con un mensaje claro recién cuando se usa.
 */
let client: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno"
    );
  }
  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getAdminClient();
    const value = Reflect.get(c, prop, c);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
