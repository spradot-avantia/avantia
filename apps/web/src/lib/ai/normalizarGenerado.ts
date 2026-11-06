// Saneamiento de lo que devuelva el modelo (ADR 029, F3). Puro y sin llamadas externas: aplica
// los mismos límites que el editor, recorta lo que se pasa y descarta lo que no es válido, de
// modo que una respuesta imperfecta o manipulada nunca llegue a la base tal cual. No acepta
// URLs: ningún campo de la salida es un enlace.
import {
  DESCRIPCION_LECCION_MAX,
  DESCRIPCION_MODULO_MAX,
  DURACION_MAX_MIN,
  OBJETIVOS_MODULO_MAX,
  OBJETIVO_MODULO_MAX,
} from "../creador/validacion";
import type { CursoGenerado } from "./generarCurso";

const texto = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
};

const minutos = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number.NaN;
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  return r >= 1 && r <= DURACION_MAX_MIN ? r : null;
};

/** Quita lo que parece un enlace: la IA no puede inventar URLs de materiales. */
const sinEnlaces = (v: string | null): string | null => {
  if (!v) return v;
  const limpio = v.replace(/\b(?:https?:\/\/|www\.)\S+/gi, "").replace(/\s+/g, " ").trim();
  return limpio || null;
};

type ModuloGenerado = CursoGenerado["modulos"][number];

export function normalizarCursoGenerado(crudo: unknown): CursoGenerado | null {
  if (!crudo || typeof crudo !== "object") return null;
  const c = crudo as Record<string, unknown>;
  const titulo = texto(c.titulo, 80);
  if (!titulo || !Array.isArray(c.modulos)) return null;

  const modulos = c.modulos.flatMap((m): ModuloGenerado[] => {
    if (!m || typeof m !== "object") return [];
    const mo = m as Record<string, unknown>;
    const tm = texto(mo.titulo, 120);
    if (!tm) return [];
    const objetivos = (Array.isArray(mo.objetivos) ? mo.objetivos : [])
      .map((o) => sinEnlaces(texto(o, OBJETIVO_MODULO_MAX)))
      .filter((o): o is string => !!o)
      .slice(0, OBJETIVOS_MODULO_MAX);
    const lecciones = (Array.isArray(mo.lecciones) ? mo.lecciones : []).flatMap((l): ModuloGenerado["lecciones"] => {
      if (!l || typeof l !== "object") return [];
      const le = l as Record<string, unknown>;
      const tl = texto(le.titulo, 120);
      if (!tl) return [];
      return [
        {
          titulo: tl,
          resumen: sinEnlaces(texto(le.resumen, 400)) ?? "",
          descripcion: sinEnlaces(texto(le.descripcion, DESCRIPCION_LECCION_MAX)),
          duracionMin: minutos(le.duracionMin),
        },
      ];
    });
    return [
      {
        titulo: tm,
        descripcion: sinEnlaces(texto(mo.descripcion, DESCRIPCION_MODULO_MAX)),
        objetivos,
        duracionMin: minutos(mo.duracionMin),
        lecciones,
      },
    ];
  });

  return { titulo, descripcion: sinEnlaces(texto(c.descripcion, 400)) ?? "", modulos };
}
