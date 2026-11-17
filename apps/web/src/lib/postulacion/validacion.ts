import { z } from "zod";

/** Solo para mostrar postulaciones antiguas (formulario con Google, ADR 011). */
export const RANGOS_ALUMNOS = [
  { value: "lt30", label: "Menos de 30" },
  { value: "30-100", label: "30 a 100" },
  { value: "100-300", label: "100 a 300" },
  { value: "gt300", label: "Más de 300" },
] as const;

/** Postulación sin cuenta (ADR 014): nombre, correo y a qué se dedica hoy (qué enseña y a quién). */
export const postulacionSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre.")
    .max(80, "El nombre es demasiado largo. Usa un máximo de 80 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Escribe tu correo.")
    .max(254, "El correo es demasiado largo.")
    .email("Revisa tu correo: parece que le falta algo."),
  ensena: z
    .string()
    .trim()
    .min(1, "Cuéntanos qué enseñas.")
    .max(280, "El texto es demasiado largo. Usa un máximo de 280 caracteres."),
  publico: z
    .string()
    .trim()
    .min(1, "Cuéntanos a quién le enseñas.")
    .max(280, "El texto es demasiado largo. Usa un máximo de 280 caracteres."),
});

/** Las dos respuestas se guardan juntas en `postulaciones.descripcion` (sin cambiar la tabla). */
export function armarDescripcion(ensena: string, publico: string): string {
  return `Qué enseña: ${ensena.trim()} · A quién: ${publico.trim()}`;
}

export interface EstadoPostulacion {
  ok?: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  valores?: { nombre: string; email: string; ensena: string; publico: string };
}

export const ESTADO_POSTULACION_INICIAL: EstadoPostulacion = {};