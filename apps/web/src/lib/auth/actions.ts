"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../supabase/server";
import type { EstadoForm } from "./estado";
import { MSG_SIN_INVITACION, puedeRegistrarse } from "../postulacion/acceso";
import { crearLimitador } from "./limite";
import { COOKIE_NEXT, urlPanel } from "./panel";
import {
  MSG_GENERICO,
  MSG_LIMITE,
  MSG_REVISA_CORREO,
  erroresPorCampo,
  loginSchema,
  mensajeErrorAuth,
  recuperacionSchema,
  restablecerSchema,
  sanitizarNext,
  signupSchema,
} from "./validacion";

/**
 * Acciones de auth del creador (correo + contraseña, Supabase Auth).
 *
 * Abuso: Supabase Auth ya aplica límites propios (por IP y por correo en
 * login/signup/recuperación y en el envío de correos); sus errores 429 se
 * traducen a MSG_LIMITE. Además hay un limitador mínimo en memoria por
 * instancia (lib/auth/limite.ts), solo como red extra. TODO(NF-23): límite
 * compartido cuando haya tráfico real.
 *
 * Enumeración: login devuelve el mismo mensaje para correo inexistente y
 * contraseña errónea; signup y recuperación responden siempre lo mismo.
 *
 * Nunca se recibe tenant_id: la academia se deriva de la sesión (RLS).
 */

const limiteLogin = crearLimitador(8, 10 * 60_000);
const limiteCorreo = crearLimitador(5, 10 * 60_000);

function ipCliente(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
}

function texto(fd: FormData, k: string): string | undefined {
  const v = fd.get(k);
  return typeof v === "string" ? v : undefined;
}

export async function signInAction(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const parsed = loginSchema.safeParse({ email: texto(fd, "email"), password: texto(fd, "password") });
  const valores = { email: texto(fd, "email")?.trim() };
  if (!parsed.success) return { errores: erroresPorCampo(parsed.error), valores };
  if (!limiteLogin.permitir(`${ipCliente()}|${parsed.data.email}`)) return { mensaje: MSG_LIMITE, valores };

  const { error } = await createSupabaseServerClient().auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { mensaje: mensajeErrorAuth(error, "login"), valores };
  redirect(sanitizarNext(texto(fd, "next")));
}

export async function signUpAction(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const parsed = signupSchema.safeParse({
    nombre: texto(fd, "nombre"),
    email: texto(fd, "email"),
    password: texto(fd, "password"),
    terminos: fd.get("terminos") === "on" ? true : false,
  });
  const next = sanitizarNext(texto(fd, "next"));
  const valores = { email: texto(fd, "email")?.trim(), nombre: texto(fd, "nombre")?.trim() };
  if (!parsed.success) return { errores: erroresPorCampo(parsed.error), valores };
  if (!limiteCorreo.permitir(`signup|${ipCliente()}`)) return { mensaje: MSG_LIMITE, valores };
  // Registro por invitación (ADR 014): solo correos con postulación aceptada.
  if (!(await puedeRegistrarse(parsed.data.email))) return { mensaje: MSG_SIN_INVITACION, valores };

  const { data, error } = await createSupabaseServerClient().auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.nombre ? { nombre: parsed.data.nombre } : undefined,
      emailRedirectTo: `${urlPanel()}/auth/confirm`,
    },
  });

  if (error) {
    // Correo ya registrado (con confirmación apagada): misma respuesta que el éxito.
    if (error.code === "user_already_exists") return { ok: true, mensaje: MSG_REVISA_CORREO };
    return { mensaje: mensajeErrorAuth(error), valores };
  }
  // Confirmación de correo apagada (solo dev): ya hay sesión, sigue a `next`.
  if (data.session) redirect(next);
  // El enlace del correo no lleva `next` (la plantilla usa {{ .SiteURL }}): se recuerda
  // en una cookie para que /auth/confirm vuelva, p. ej., a /postular.
  if (next !== "/inicio") {
    cookies().set(COOKIE_NEXT, next, { httpOnly: true, sameSite: "lax", secure: true, path: "/auth", maxAge: 60 * 60 * 24 });
  }
  return { ok: true, mensaje: MSG_REVISA_CORREO };
}

export async function signOutAction(): Promise<void> {
  await createSupabaseServerClient().auth.signOut();
  redirect("/login");
}

export async function solicitarRecuperacionAction(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const parsed = recuperacionSchema.safeParse({ email: texto(fd, "email") });
  const valores = { email: texto(fd, "email")?.trim() };
  if (!parsed.success) return { errores: erroresPorCampo(parsed.error), valores };
  if (!limiteCorreo.permitir(`recuperacion|${ipCliente()}`)) return { mensaje: MSG_LIMITE, valores };

  const { error } = await createSupabaseServerClient().auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${urlPanel()}/auth/confirm?next=/restablecer-contrasena`,
  });
  // Solo se informa el límite; cualquier otro resultado se responde igual (anti-enumeración).
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) return { mensaje: MSG_LIMITE, valores };
  if (error) console.error("[auth] resetPasswordForEmail", error.code ?? error.message);
  return { ok: true, mensaje: MSG_REVISA_CORREO };
}

export async function restablecerContrasenaAction(_prev: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const parsed = restablecerSchema.safeParse({
    password: texto(fd, "password"),
    confirmacion: texto(fd, "confirmacion"),
  });
  if (!parsed.success) return { errores: erroresPorCampo(parsed.error) };

  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { mensaje: "Tu enlace venció o ya se usó. Pide uno nuevo desde “Olvidé mi contraseña”." };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { mensaje: mensajeErrorAuth(error) || MSG_GENERICO };
  redirect("/inicio");
}

export async function signInWithGoogleAction(formData: FormData) {
  const next = sanitizarNext(texto(formData, "next"));

  const { data, error } = await createSupabaseServerClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${urlPanel()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}