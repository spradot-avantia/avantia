import type { AccesoCurso } from "../../../lib/creador/types";

export const ETIQUETA_ACCESO: Record<AccesoCurso, string> = {
  invitados: "solo invitados",
  enlace: "con enlace",
};

export function textoEstudiantes(n: number, acceso: AccesoCurso): string {
  return `${n} ${n === 1 ? "estudiante" : "estudiantes"} · ${ETIQUETA_ACCESO[acceso]}`;
}
