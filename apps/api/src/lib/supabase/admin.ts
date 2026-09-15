import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role: bypassa RLS por completo. Uso EXCLUSIVO de
 * backend, en operaciones que necesitan leer/escribir entre tenants (ej.
 * resolver qué tenant corresponde a un hostname). Nunca importar este
 * archivo desde código que responde directamente a un request de un tenant
 * sin filtrar explícitamente por tenant_id.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
