import { cache } from "react";
import { correoEsStaff } from "../staff";
import { supabaseAdmin } from "../supabase/admin";

/**
 * El registro de creadores es por invitación (ADR 014): solo pueden crear
 * cuenta los correos con una postulación 'aceptada' y el equipo (tabla staff, ADR 016).
 * REGISTRO_ABIERTO=true lo abre (desarrollo y pruebas). Solo backend.
 */
export async function puedeRegistrarse(email: string | undefined | null): Promise<boolean> {
  if (process.env.REGISTRO_ABIERTO === "true") return true;
  const correo = email?.trim().toLowerCase();
  if (!correo) return false;
  if (await correoEsStaff(correo)) return true;
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

/**
 * Acceso vigente a la plataforma (ADR 015): el correo de la sesión sigue siendo
 * staff o tiene una postulación 'aceptada'. Se revisa en cada ingreso y en el
 * panel, así un descarte posterior también corta el acceso. Una consulta por request.
 */
export const tieneAcceso = cache(async (email: string | null | undefined): Promise<boolean> => puedeRegistrarse(email));

export const MSG_SIN_INVITACION =
  "El registro es solo por invitación. Postula al programa fundador y, cuando te aceptemos, te escribiremos con el acceso.";
