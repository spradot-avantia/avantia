import { cache } from "react";
import { getUsuarioActual } from "./auth/usuario";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Rol "equipo de Avantia" (ADR 016). Fuente de verdad: tabla `staff` (solo
 * service role). STAFF_EMAILS queda como arranque: quien figure ahí se siembra
 * en la tabla la primera vez que se consulta, y desde entonces el equipo se
 * gestiona en /admin/equipo. Deniega por defecto. Solo backend.
 */

export function staffDeEnv(): string[] {
  return (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** ¿Este correo es del equipo? (tabla `staff` o arranque por STAFF_EMAILS). */
export const correoEsStaff = cache(async (email: string | null | undefined): Promise<boolean> => {
  const correo = email?.trim().toLowerCase();
  if (!correo) return false;

  if (staffDeEnv().includes(correo)) {
    // Siembra idempotente: la base (crear_academia) reconoce al staff solo si está en la tabla.
    const { error } = await supabaseAdmin
      .from("staff")
      .upsert({ email: correo, created_by: "STAFF_EMAILS" }, { onConflict: "email", ignoreDuplicates: true });
    if (error) console.error("[staff] no se pudo sembrar", error.code ?? error.message);
    return true;
  }

  const { data, error } = await supabaseAdmin.from("staff").select("email").eq("email", correo).maybeSingle();
  if (error) {
    console.error("[staff] no se pudo consultar", error.code ?? error.message);
    return false;
  }
  return !!data;
});

/** ¿La sesión actual es del equipo? Reutiliza la sesión cacheada por request. */
export async function esStaff(): Promise<boolean> {
  return correoEsStaff((await getUsuarioActual())?.email);
}
