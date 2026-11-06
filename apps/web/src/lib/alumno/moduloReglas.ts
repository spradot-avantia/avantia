// Resumen de un módulo para el alumno (ADR 032, F1). Puro: no toca la base de datos.
// La liberación real se vuelve a validar en el servidor al abrir cada lección.
import type { Modulo, TipoLeccion } from "../creador/types";
import { fechaLiberacion, leccionLiberada, type ReglaLiberacion } from "./liberacion";
import { porcentaje } from "./xp";

export type EstadoLeccion = "completada" | "disponible" | "bloqueada";

export interface FilaLeccion {
  id: string;
  titulo: string;
  tipo: TipoLeccion;
  duracionMin: number | null;
  estado: EstadoLeccion;
  /** Fecha (YYYY-MM-DD) desde la que se abre; solo si está bloqueada. */
  abreEl: string | null;
}

export interface ResumenModulo {
  total: number;
  hechas: number;
  pct: number;
  /** Duración declarada del módulo; si falta, la suma de las lecciones que la declaran. */
  duracionMin: number | null;
  filas: FilaLeccion[];
  /** Primera lección disponible sin completar (a donde lleva «Empezar» o «Continuar»). */
  proxima: string | null;
  estado: "sin_empezar" | "en_curso" | "completo";
}

export function resumirModulo(
  m: Modulo,
  regla: ReglaLiberacion,
  diaLiberacion: Map<string, number | null>,
  completadas: Set<string>,
  hoy: string,
): ResumenModulo {
  const filas: FilaLeccion[] = m.lecciones.map((l) => {
    const dia = diaLiberacion.get(l.id) ?? null;
    const hecha = completadas.has(l.id);
    const abierta = leccionLiberada(regla, dia, hoy);
    return {
      id: l.id,
      titulo: l.titulo,
      tipo: l.tipo,
      duracionMin: l.duracionMin,
      estado: hecha ? "completada" : abierta ? "disponible" : "bloqueada",
      abreEl: !hecha && !abierta ? fechaLiberacion(regla, dia) : null,
    };
  });
  const hechas = filas.filter((f) => f.estado === "completada").length;
  const suma = m.lecciones.reduce((n, l) => n + (l.duracionMin ?? 0), 0);
  return {
    total: filas.length,
    hechas,
    pct: porcentaje(hechas, filas.length),
    duracionMin: m.duracionMin ?? (suma > 0 ? suma : null),
    filas,
    proxima: filas.find((f) => f.estado === "disponible")?.id ?? null,
    estado: filas.length > 0 && hechas === filas.length ? "completo" : hechas > 0 ? "en_curso" : "sin_empezar",
  };
}
