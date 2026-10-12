// Reglas de publicacion (puras). Ver pantalla 09 y Reconciliacion fila 16.
import type { Bloqueo, CursoCompleto, Leccion, ResultadoValidacionPublicacion } from "./types";
import { DESCRIPCION_MAX, DESCRIPCION_MIN, TITULO_MAX, TITULO_MIN, validarFechas, validarUrlLeccion } from "./validacion";

export function leccionLista(l: Pick<Leccion, "tipo" | "contenidoUrl" | "contenidoTexto" | "titulo">): boolean {
  if (!l.titulo.trim()) return false;
  if (l.tipo === "texto") return !!l.contenidoTexto?.trim();
  return !!l.contenidoUrl && validarUrlLeccion(l.tipo, l.contenidoUrl).ok;
}

export function validarPublicacion(
  curso: CursoCompleto,
  opts: { estudiantesRegistrados?: number } = {},
): ResultadoValidacionPublicacion {
  const bloqueos: Bloqueo[] = [];
  const recomendaciones: Bloqueo[] = [];

  const t = curso.titulo.trim().length;
  if (t < TITULO_MIN || t > TITULO_MAX) {
    bloqueos.push({ mensaje: `El título debe tener entre ${TITULO_MIN} y ${TITULO_MAX} caracteres.`, paso: "esencial" });
  }
  const d = (curso.descripcion ?? "").trim().length;
  if (d < DESCRIPCION_MIN || d > DESCRIPCION_MAX) {
    bloqueos.push({ mensaje: `La descripción debe tener entre ${DESCRIPCION_MIN} y ${DESCRIPCION_MAX} caracteres.`, paso: "esencial" });
  }
  if (curso.objetivos.length < 1) {
    bloqueos.push({ mensaje: "Agrega al menos un objetivo de aprendizaje.", paso: "objetivo" });
  }

  if (curso.modulos.length < 1) {
    bloqueos.push({ mensaje: "Agrega al menos un módulo con una lección.", paso: "estructura" });
  } else {
    for (const m of curso.modulos) {
      if (!m.titulo.trim()) bloqueos.push({ mensaje: "Hay un módulo sin nombre.", paso: "estructura" });
      if (m.lecciones.length === 0) {
        bloqueos.push({ mensaje: `El módulo "${m.titulo}" no tiene lecciones.`, paso: "estructura" });
      }
      for (const l of m.lecciones) {
        if (!leccionLista(l)) {
          bloqueos.push({ mensaje: `La lección "${l.titulo || "sin título"}" no tiene contenido listo.`, paso: "estructura" });
        }
      }
    }
  }

  if (curso.modalidad === "con_fechas") {
    const e = validarFechas(curso.fechaInicio, curso.fechaTermino);
    if (e) bloqueos.push({ mensaje: e, paso: "modalidad" });
  }

  if (!curso.publico?.trim()) {
    recomendaciones.push({ mensaje: "Cuenta para quién es el curso: ayuda a que se inscriban las personas correctas.", paso: "esencial" });
  }
  if (curso.objetivos.length === 1) {
    recomendaciones.push({ mensaje: "Un segundo objetivo hace más concreto lo que se llevan.", paso: "objetivo" });
  }
  if (curso.acceso === "invitados" && (opts.estudiantesRegistrados ?? 0) === 0) {
    recomendaciones.push({ mensaje: "Con acceso por invitación, registra a tus estudiantes después de publicar.", paso: "acceso" });
  }

  return { bloqueos, recomendaciones, puedePublicar: bloqueos.length === 0 };
}
