// Resultados del quiz por módulo para el creador (puro, sin acceso a datos).
// Solo cuenta el primer intento de cada alumno: repetir el quiz no infla el acierto.

export interface PreguntaBase {
  id: string;
  moduloId: string;
  texto: string;
  orden: number;
}
export interface RespuestaBase {
  alumnoId: string;
  preguntaId: string;
  acierto: boolean;
  primerIntento: boolean;
}
export interface ModuloBase {
  id: string;
  cursoId: string;
  titulo: string;
  orden: number;
}

export interface ResultadoPregunta {
  preguntaId: string;
  texto: string;
  respuestas: number;
  /** 0–100, sobre primeros intentos. */
  acierto: number;
}
export interface ResultadoModulo {
  moduloId: string;
  cursoId: string;
  titulo: string;
  preguntas: number;
  /** Alumnos distintos que respondieron algo. */
  alumnos: number;
  /** 0–100 sobre primeros intentos; null si nadie respondió. */
  acierto: number | null;
  /** Pregunta con menor acierto (empate: la primera por orden); null sin respuestas. */
  masFallada: ResultadoPregunta | null;
}

export function agregarResultados(modulos: ModuloBase[], preguntas: PreguntaBase[], respuestas: RespuestaBase[]): ResultadoModulo[] {
  const porPregunta = new Map<string, PreguntaBase>(preguntas.map((p) => [p.id, p]));
  return [...modulos]
    .sort((a, b) => a.orden - b.orden)
    .flatMap((m) => {
      const ps = preguntas.filter((p) => p.moduloId === m.id).sort((a, b) => a.orden - b.orden);
      if (ps.length === 0) return [];
      const delModulo = respuestas.filter((r) => porPregunta.get(r.preguntaId)?.moduloId === m.id);
      const primeros = delModulo.filter((r) => r.primerIntento);
      const detalle: ResultadoPregunta[] = ps
        .map((p) => {
          const rs = primeros.filter((r) => r.preguntaId === p.id);
          return {
            preguntaId: p.id,
            texto: p.texto,
            respuestas: rs.length,
            acierto: rs.length ? Math.round((rs.filter((r) => r.acierto).length / rs.length) * 100) : 0,
          };
        })
        .filter((d) => d.respuestas > 0);
      const masFallada = detalle.reduce<ResultadoPregunta | null>((peor, d) => (!peor || d.acierto < peor.acierto ? d : peor), null);
      return [
        {
          moduloId: m.id,
          cursoId: m.cursoId,
          titulo: m.titulo,
          preguntas: ps.length,
          alumnos: new Set(delModulo.map((r) => r.alumnoId)).size,
          acierto: primeros.length ? Math.round((primeros.filter((r) => r.acierto).length / primeros.length) * 100) : null,
          masFallada,
        },
      ];
    });
}
