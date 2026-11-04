// Reglas puras del repaso espaciado (ADR 024). Sin acceso a datos.
// Una falla abre el repaso (vence al día siguiente); cada acierto en o después de la
// fecha de vencimiento sube de etapa (3 y 7 días); el tercero la da por aprendida.

export const INTERVALOS_DIAS = [1, 3, 7] as const;
export const MAX_REPASO_DIARIO = 20;
const ZONA = "America/Santiago";

export interface RespuestaRepaso {
  preguntaId: string;
  acierto: boolean;
  /** ISO 8601. */
  creadaEn: string;
}

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
/** Día calendario (AAAA-MM-DD) en la zona de la academia. */
export const diaCalendario = (d: Date | string): string => fmt.format(typeof d === "string" ? new Date(d) : d);

function sumarDias(dia: string, n: number): string {
  const [y, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

interface Estado {
  etapa: 0 | 1 | 2 | 3;
  vence: string;
  aprendida: boolean;
}

/** IDs de las preguntas que vencen hoy o antes (ordenadas por antigüedad del vencimiento). */
export function preguntasDeRepaso(respuestas: RespuestaRepaso[], ahora: Date = new Date(), max: number = MAX_REPASO_DIARIO): string[] {
  const hoy = diaCalendario(ahora);
  const porPregunta = new Map<string, RespuestaRepaso[]>();
  for (const r of respuestas) porPregunta.set(r.preguntaId, [...(porPregunta.get(r.preguntaId) ?? []), r]);

  const vencidas: { id: string; vence: string }[] = [];
  for (const [id, rs] of Array.from(porPregunta)) {
    let e: Estado = { etapa: 0, vence: "", aprendida: false };
    for (const r of [...rs].sort((a, b) => a.creadaEn.localeCompare(b.creadaEn))) {
      const dia = diaCalendario(r.creadaEn);
      if (!r.acierto) {
        e = { etapa: 1, vence: sumarDias(dia, INTERVALOS_DIAS[0]), aprendida: false };
      } else if (e.etapa > 0 && !e.aprendida && dia >= e.vence) {
        if (e.etapa === 3) e = { ...e, aprendida: true };
        else {
          const etapa = (e.etapa + 1) as 2 | 3;
          e = { etapa, vence: sumarDias(dia, INTERVALOS_DIAS[etapa - 1]), aprendida: false };
        }
      }
    }
    if (e.etapa > 0 && !e.aprendida && e.vence <= hoy) vencidas.push({ id, vence: e.vence });
  }
  return vencidas
    .sort((a, b) => a.vence.localeCompare(b.vence) || a.id.localeCompare(b.id))
    .slice(0, max)
    .map((v) => v.id);
}
