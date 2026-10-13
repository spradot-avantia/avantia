import { cache } from "react";
import { createSupabaseServerClient } from "../supabase/server";

export interface UsuarioActual {
  id: string;
  email: string | null;
}

/** Usuario de la sesión (valida el JWT contra Supabase Auth con getUser). Null si no hay. */
export const getUsuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  try {
    const { data } = await createSupabaseServerClient().auth.getUser();
    return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
  } catch {
    return null;
  }
});

/** El demo (sin sesión) solo existe en desarrollo local y con opt-in explícito. */
export function demoPermitido(): boolean {
  return process.env.ALLOW_DEMO_TENANT === "true" && !!process.env.DEMO_TENANT_SLUG;
}
