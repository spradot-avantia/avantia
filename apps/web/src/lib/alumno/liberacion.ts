// Liberación de lecciones por fecha (ADR 004). Pura: la validación real ocurre en
// el servidor al abrir la lección; ocultar en la UI no basta.

export interface ReglaLiberacion {
  modalidad: "a_su_ritmo" | "con_fechas";
  fechaInicio: string | null; // YYYY-MM-DD
}

/** Fecha de hoy (YYYY-MM-DD) en la zona de la academia. Por ahora, Chile. */
export function hoyEnZona(ahora: Date = new Date(), zona = "America/Santiago"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Fecha desde la que se libera una lección (null = disponible desde ya). */
export function fechaLiberacion(r: ReglaLiberacion, diaLiberacion: number | null): string | null {
  if (r.modalidad !== "con_fechas" || !r.fechaInicio) return null;
  return diaLiberacion != null ? sumarDias(r.fechaInicio, diaLiberacion) : r.fechaInicio;
}

export function leccionLiberada(r: ReglaLiberacion, diaLiberacion: number | null, hoy: string): boolean {
  const f = fechaLiberacion(r, diaLiberacion);
  return f == null || hoy >= f;
}
