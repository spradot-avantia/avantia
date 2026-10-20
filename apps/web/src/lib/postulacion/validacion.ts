import { z } from "zod";

export const RANGOS_ALUMNOS = [
  { value: "lt30", label: "Menos de 30" },
  { value: "30-100", label: "30 a 100" },
  { value: "100-300", label: "100 a 300" },
  { value: "gt300", label: "Más de 300" },
] as const;

const vacioANull = (v: string) => (v ? v : null);

/** Mismos campos que el formulario de la landing V3 (el correo viene de Google). */
export const postulacionSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre.")
    .max(80, "El nombre es demasiado largo. Usa un máximo de 80 caracteres."),
  url: z
    .string()
    .trim()
    .max(300, "El enlace es demasiado largo. Usa un máximo de 300 caracteres.")
    .transform(vacioANull),
  alumnos: z
    .enum(["", ...RANGOS_ALUMNOS.map((r) => r.value)] as ["", ...string[]], { message: "Elige una opción de la lista." })
    .transform(vacioANull),
});

export interface EstadoPostulacion {
  mensaje?: string;
  errores?: Record<string, string>;
  valores?: { nombre: string; url: string; alumnos: string };
}

export const ESTADO_POSTULACION_INICIAL: EstadoPostulacion = {};
