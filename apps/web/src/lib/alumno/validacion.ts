// Validación del lado del alumno (puras; mensajes: qué pasó y cómo resolverlo).
import { z } from "zod";
import { LARGO_MAX_CONTRASENA, LARGO_MIN_CONTRASENA } from "../auth/contrasena";

const correo = z
  .string({ message: "Escribe tu correo." })
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu correo.")
  .max(254, "Ese correo es demasiado largo. Revisa que esté bien escrito.")
  .pipe(z.email("Revisa tu correo: debe tener la forma nombre@dominio.com."));

const contrasenaNueva = z
  .string({ message: "Escribe una contraseña." })
  .min(LARGO_MIN_CONTRASENA, `La contraseña es muy corta. Usa al menos ${LARGO_MIN_CONTRASENA} caracteres.`)
  .max(LARGO_MAX_CONTRASENA, `La contraseña es muy larga. Usa un máximo de ${LARGO_MAX_CONTRASENA} caracteres.`);

export const registroSchema = z.object({
  nombre: z
    .string({ message: "Escribe tu nombre y apellido." })
    .trim()
    .min(2, "Escribe tu nombre y apellido.")
    .max(120, "El nombre es demasiado largo. Usa un máximo de 120 caracteres."),
  email: correo,
  password: contrasenaNueva,
  terminos: z.literal(true, { message: "Para crear tu cuenta, marca que aceptas los términos y la política de privacidad." }),
});

export const ingresoSchema = z.object({
  email: correo,
  password: z.string({ message: "Escribe tu contraseña." }).min(1, "Escribe tu contraseña.").max(LARGO_MAX_CONTRASENA * 2),
});

export const recuperacionSchema = z.object({ email: correo });

export const restablecerSchema = z
  .object({
    password: contrasenaNueva,
    confirmacion: z.string({ message: "Repite la contraseña." }).min(1, "Repite la contraseña."),
  })
  .refine((v) => v.password === v.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden. Escríbelas de nuevo, iguales en ambos campos.",
  });

/**
 * Evita open redirect: solo rutas internas de la academia ("/algo"). Rechaza
 * "//host", barras invertidas, caracteres de control y las rutas de acceso (bucle).
 */
export function sanitizarNextAlumno(next: unknown, porDefecto = "/mis-cursos"): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 300) return porDefecto;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return porDefecto;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(next)) return porDefecto;
  if (/^\/(ingresar|registro|recuperar|restablecer|confirmar)(\/|\?|$)/.test(next)) return porDefecto;
  return next;
}

/** Campaña del enlace (utm_*), acotada y sin caracteres raros. */
export function limpiarCampana(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, 120);
  return t && /^[\w .:+@/-]+$/u.test(t) ? t : null;
}

export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "_");
    if (!(k in out)) out[k] = issue.message;
  }
  return out;
}

export const MSG_CREDENCIALES =
  "Correo o contraseña incorrectos. Revísalos e inténtalo de nuevo; si olvidaste tu contraseña, puedes restablecerla.";
export const MSG_LIMITE = "Hiciste demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.";
export const MSG_GENERICO = "No pudimos completar la acción por un problema de nuestro lado. Inténtalo de nuevo en unos minutos.";
