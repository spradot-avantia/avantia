import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role: bypassa RLS por completo. Uso EXCLUSIVO de
 * Server Components / route handlers, en operaciones que necesitan leer o
 * escribir entre tenants (ej. resolver qué tenant corresponde a un
 * hostname). Nunca importar este archivo desde código de cliente ("use
 * client") ni desde nada que responda a un request de un tenant sin filtrar
 * explícitamente por tenant_id.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
