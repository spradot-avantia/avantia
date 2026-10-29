import { z } from "zod";
import { LARGO_MAX_CONTRASENA, LARGO_MIN_CONTRASENA } from "./contrasena";

/** Mensajes: "qué pasó y cómo resolverlo". */
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

export const loginSchema = z.object({
  email: correo,
  // En login no se exige largo mínimo (cuentas viejas); solo que exista.
  password: z.string({ message: "Escribe tu contraseña." }).min(1, "Escribe tu contraseña.").max(LARGO_MAX_CONTRASENA * 2),
});

export const signupSchema = z.object({
  nombre: z
    .string()
    .trim()
    .max(80, "El nombre es demasiado largo. Usa un máximo de 80 caracteres.")
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: correo,
  password: contrasenaNueva,
  terminos: z.literal(true, { message: "Para crear tu cuenta, marca que aceptas los términos y la política de privacidad." }),
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

/** Convierte issues de zod en { campo: primer mensaje }. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "_");
    if (!(k in out)) out[k] = issue.message;
  }
  return out;
}

/**
 * Evita open redirect: solo rutas relativas internas ("/algo"). Rechaza
 * "//host", "/\host", caracteres de control y rutas de auth (bucle).
 */
export function sanitizarNext(next: unknown, porDefecto = "/inicio"): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 500) return porDefecto;
  // "/" es la landing, no el inicio del panel (ADR 012).
  if (next === "/") return porDefecto;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return porDefecto;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(next)) return porDefecto;
  if (/^\/(login|signup|olvide-contrasena|auth)(\/|\?|$)/.test(next)) return porDefecto;
  return next;
}

/** Mensajes genéricos (no revelan si un correo existe). */
export const MSG_CREDENCIALES =
  "Correo o contraseña incorrectos. Revísalos e inténtalo de nuevo; si olvidaste tu contraseña, puedes restablecerla.";
export const MSG_LIMITE = "Hiciste demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.";
export const MSG_GENERICO = "No pudimos completar la acción por un problema de nuestro lado. Inténtalo de nuevo en unos minutos.";
export const MSG_REVISA_CORREO =
  "Si el correo puede usarse, te enviamos un mensaje con las instrucciones. Revisa tu bandeja de entrada y la carpeta de spam; puede tardar un par de minutos.";

/** Traduce un error de Supabase Auth a un mensaje seguro (sin enumerar). */
export function mensajeErrorAuth(
  error: { code?: string; status?: number; message?: string } | null | undefined,
  contexto: "login" | "otro" = "otro",
): string {
  if (!error) return MSG_GENERICO;
  const code = error.code ?? "";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error.status === 429) return MSG_LIMITE;
  if (contexto === "login") {
    if (code === "email_not_confirmed")
      return "Aún no confirmas tu correo. Abre el mensaje que te enviamos y toca el enlace; si no lo encuentras, revisa spam.";
    if (code === "invalid_credentials" || error.status === 400) return MSG_CREDENCIALES;
  }
  if (code === "same_password") return "La nueva contraseña debe ser distinta de la anterior.";
  if (code === "weak_password")
    return `Esa contraseña es muy fácil de adivinar. Usa al menos ${LARGO_MIN_CONTRASENA} caracteres y evita palabras comunes.`;
  if (code === "session_not_found" || code === "not_authenticated" || error.status === 401)
    return "Tu enlace venció. Pide uno nuevo desde “Olvidé mi contraseña”.";
  return MSG_GENERICO;
}
