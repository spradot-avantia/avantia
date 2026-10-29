import { supabaseAdmin } from "../supabase/admin";

/**
 * El registro de creadores es por invitación (ADR 014): solo pueden crear
 * cuenta los correos con una postulación 'aceptada' y el equipo (STAFF_EMAILS).
 * REGISTRO_ABIERTO=true lo abre (desarrollo y pruebas). Solo backend.
 */
export async function puedeRegistrarse(email: string | undefined | null): Promise<boolean> {
  if (process.env.REGISTRO_ABIERTO === "true") return true;
  const correo = email?.trim().toLowerCase();
  if (!correo) return false;
  const staff = (process.env.STAFF_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (staff.includes(correo)) return true;
  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .select("id")
    .eq("email", correo)
    .eq("estado", "aceptada")
    .maybeSingle();
  if (error) {
    console.error("[acceso] no se pudo verificar la invitación", error.code ?? error.message);
    return false;
  }
  return !!data;
}

export const MSG_SIN_INVITACION =
  "El registro es solo por invitación. Postula al programa fundador y, cuando te aceptemos, te escribiremos con el acceso.";
