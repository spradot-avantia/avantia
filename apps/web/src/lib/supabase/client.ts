"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase del navegador, para Client Components (ej. formularios
 * de login, el player embebido). Comparte la sesión con el server vía
 * cookies gracias a @supabase/ssr.
 */
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno"
    );
  }

  return createBrowserClient(supabaseUrl, anonKey);
}
