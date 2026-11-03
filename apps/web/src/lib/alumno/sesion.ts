// Sesión del alumno (ADR 018): cookie httpOnly propia de cada academia, validada
// contra alumno_tokens. NO usa Supabase Auth y NO se comparte con el panel.
import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseAdmin } from "../supabase/admin";
import { getTenantPublico } from "./contexto";
import { hashToken, nuevoToken } from "./token";

export const COOKIE_ALUMNO = "av_alumno";
const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000;

export interface AlumnoSesion {
  id: string;
  tenantId: string;
  nombre: string;
  correo: string;
  verificado: boolean;
}

/** Crea la sesión en base y fija la cookie (solo Server Actions / Route Handlers). */
export async function crearSesion(tenantId: string, alumnoId: string): Promise<void> {
  const { token, hash } = nuevoToken();
  const expira = new Date(Date.now() + DURACION_SESION_MS);
  const { error } = await supabaseAdmin.from("alumno_tokens").insert({
    tenant_id: tenantId,
    alumno_id: alumnoId,
    tipo: "sesion",
    token_hash: hash,
    expira_at: expira.toISOString(),
  });
  if (error) throw new Error("No se pudo crear la sesión del alumno");
  cookies().set(COOKIE_ALUMNO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

/** Alumno con sesión válida EN ESTA academia, o null. Una consulta por request. */
export const getAlumnoActual = cache(async (): Promise<AlumnoSesion | null> => {
  const token = cookies().get(COOKIE_ALUMNO)?.value;
  if (!token) return null;
  const tenant = await getTenantPublico();
  if (!tenant) return null;

  const { data: t } = await supabaseAdmin
    .from("alumno_tokens")
    .select("alumno_id, expira_at")
    .eq("tenant_id", tenant.id)
    .eq("tipo", "sesion")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!t || new Date(t.expira_at).getTime() <= Date.now()) return null;

  const { data: a } = await supabaseAdmin
    .from("alumnos")
    .select("id, tenant_id, nombre, correo, correo_verificado_at")
    .eq("tenant_id", tenant.id)
    .eq("id", t.alumno_id)
    .maybeSingle();
  if (!a) return null;
  return { id: a.id, tenantId: a.tenant_id, nombre: a.nombre, correo: a.correo, verificado: !!a.correo_verificado_at };
});

export async function cerrarSesion(): Promise<void> {
  const token = cookies().get(COOKIE_ALUMNO)?.value;
  const tenant = await getTenantPublico();
  if (token && tenant) {
    await supabaseAdmin
      .from("alumno_tokens")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("tipo", "sesion")
      .eq("token_hash", hashToken(token));
  }
  cookies().delete(COOKIE_ALUMNO);
}
