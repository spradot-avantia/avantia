import { z } from "zod";

/** Solo para mostrar postulaciones antiguas (formulario con Google, ADR 011). */
export const RANGOS_ALUMNOS = [
  { value: "lt30", label: "Menos de 30" },
  { value: "30-100", label: "30 a 100" },
  { value: "100-300", label: "100 a 300" },
  { value: "gt300", label: "Más de 300" },
] as const;

/** Postulación sin cuenta (ADR 014): nombre, correo y a qué se dedica hoy. */
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
  descripcion: z
    .string()
    .trim()
    .min(10, "Cuéntanos en una o dos frases qué haces hoy.")
    .max(600, "El texto es demasiado largo. Usa un máximo de 600 caracteres."),
});

export interface EstadoPostulacion {
  ok?: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  valores?: { nombre: string; email: string; descripcion: string };
}

export const ESTADO_POSTULACION_INICIAL: EstadoPostulacion = {};
