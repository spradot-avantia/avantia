"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../supabase/server";
import { MSG_GENERICO, erroresPorCampo } from "../auth/validacion";
import { postulacionSchema, type EstadoPostulacion } from "./validacion";

/**
 * Postulación al programa fundador (ADR 011). Requiere sesión (Google): el
 * user_id sale de la sesión y el correo lo copia la base desde auth.users,
 * nunca del formulario. RLS limita cada cuenta a su propia fila.
 */
export async function enviarPostulacionAction(_prev: EstadoPostulacion, fd: FormData): Promise<EstadoPostulacion> {
  const valores = {
    nombre: fd.get("nombre")?.toString() ?? "",
    url: fd.get("url")?.toString() ?? "",
    alumnos: fd.get("alumnos")?.toString() ?? "",
  };
  const parsed = postulacionSchema.safeParse(valores);
  if (!parsed.success) return { errores: erroresPorCampo(parsed.error), valores };

  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/postular");

  const fila = parsed.data;
  const { data: existente, error: errLectura } = await supabase
    .from("postulaciones")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (errLectura) {
    console.error("[postulacion] lectura", errLectura.code ?? errLectura.message);
    return { mensaje: MSG_GENERICO, valores };
  }

  const { error } = existente
    ? await supabase.from("postulaciones").update(fila).eq("user_id", auth.user.id)
    : await supabase.from("postulaciones").insert({ user_id: auth.user.id, ...fila });
  if (error) {
    console.error("[postulacion] guardar", error.code ?? error.message);
    return { mensaje: MSG_GENERICO, valores };
  }
  redirect("/postular");
}

/** "¿No eres tú?": cierra la sesión y vuelve al paso 1. */
export async function cambiarCuentaAction(): Promise<void> {
  await createSupabaseServerClient().auth.signOut();
  redirect("/postular");
}
