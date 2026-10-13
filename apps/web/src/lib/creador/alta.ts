// Logica PURA del alta de academia (RQ-02): derivacion de subdominio y mapeo de
// errores de la RPC crear_academia. Sin imports de servidor: la usan la Server
// Action, el cliente (validacion en vivo) y los tests.
import { validarSubdominio } from "../tenant/reservados";

export const SUBDOMINIO_MAX = 40;

/** "Academia de Juan" -> "academia-de-juan". Devuelve "" si no queda nada util. */
export function derivarSubdominio(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SUBDOMINIO_MAX)
    .replace(/-+$/g, "");
}

/** Normaliza lo que escribe el usuario en el campo de subdominio. */
export function normalizarSubdominio(valor: string): string {
  return valor.trim().toLowerCase();
}

/** Valida formato + reservados (misma regla que la funcion SQL subdominio_error). */
export function errorSubdominio(valor: string): string | null {
  const v = validarSubdominio(valor);
  return v.ok ? null : v.motivo;
}

export const MENSAJES_ALTA: Record<string, string> = {
  subdominio_tomado: "Ese nombre ya está tomado, elige otro.",
  subdominio_reservado: "Ese nombre está reservado. Elige otro.",
  subdominio_invalido: "Usa de 3 a 40 caracteres: letras, números y guiones, sin guion al inicio ni al final.",
  nombre_invalido: "Revisa el nombre, la frase y el área: alguno excede el largo permitido.",
  ya_tiene_academia: "Ya tienes una academia. Entra a tu espacio para seguir configurándola.",
  no_autenticado: "Tu sesión expiró. Inicia sesión de nuevo.",
};

export type CodigoAlta = keyof typeof MENSAJES_ALTA;

/** Traduce el error de la RPC (message = codigo estable) a espanol. */
export function mapearErrorAlta(err: { message?: string; code?: string } | null | undefined): {
  codigo: CodigoAlta | "desconocido";
  mensaje: string;
} {
  const msg = (err?.message ?? "").trim();
  for (const codigo of Object.keys(MENSAJES_ALTA)) {
    if (msg === codigo || msg.startsWith(`${codigo}:`)) return { codigo, mensaje: MENSAJES_ALTA[codigo] };
  }
  // Respaldo: una violacion de unicidad que escape la funcion = subdominio tomado.
  if (err?.code === "23505") return { codigo: "subdominio_tomado", mensaje: MENSAJES_ALTA.subdominio_tomado };
  return { codigo: "desconocido", mensaje: "No pudimos crear tu academia. Inténtalo de nuevo." };
}
