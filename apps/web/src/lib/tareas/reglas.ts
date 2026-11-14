// Reglas puras de tareas, entregas y clases en vivo (ADR 038 y 039). Las usan el navegador
// (validar antes de enviar) y el servidor (validar de nuevo: el cliente no es de fiar).
import { validarArchivo, type ValidacionArchivo } from "../creador/archivosReglas";

export const PUNTAJE_TOPE = 10000;
export const TITULO_MAX = 120;
export const INSTRUCCIONES_MAX = 20000;
export const COMENTARIO_ALUMNO_MAX = 2000;
export const COMENTARIO_REVISION_MAX = 10000;
export const ENTREGAS_MAX = 20;
export const ZONA_ACADEMIA = "America/Santiago";

/** «25», «25,5» o «25.5» → número con hasta 2 decimales; null si no es un puntaje válido (> 0). */
export function leerPuntaje(raw: string | number): number | null {
  const s = String(raw).trim().replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n <= PUNTAJE_TOPE ? n : null;
}

/** Como `leerPuntaje` pero admite 0 (una entrega puede sacar 0 puntos). */
export function leerPuntajeObtenido(raw: string | number): number | null {
  const s = String(raw).trim().replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= PUNTAJE_TOPE ? n : null;
}

/** 25 → «25»; 25.5 → «25,5». */
export function formatearPuntaje(n: number): string {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

export interface EntradaTarea {
  titulo: string;
  instrucciones: string;
  puntajeMaximo: string | number;
  /** `YYYY-MM-DDTHH:mm` en hora de la academia, o vacío. */
  fechaLimite: string;
  permiteReenvio: boolean;
}

export interface TareaValida {
  titulo: string;
  instrucciones: string;
  puntajeMaximo: number;
  fechaLimite: string | null; // ISO UTC
  permiteReenvio: boolean;
}

export type ResultadoValidacion<T> = { ok: true; data: T } | { ok: false; error: string; campos: Record<string, string> };

export function validarTarea(e: EntradaTarea): ResultadoValidacion<TareaValida> {
  const campos: Record<string, string> = {};
  const titulo = e.titulo.trim();
  if (!titulo) campos.titulo = "Escribe un título para la tarea.";
  else if (titulo.length > TITULO_MAX) campos.titulo = `El título admite hasta ${TITULO_MAX} caracteres.`;
  if (e.instrucciones.length > INSTRUCCIONES_MAX) campos.instrucciones = `Las instrucciones admiten hasta ${INSTRUCCIONES_MAX} caracteres.`;
  const puntaje = leerPuntaje(e.puntajeMaximo);
  if (puntaje === null) campos.puntajeMaximo = "Escribe un puntaje máximo mayor que 0 (por ejemplo, 30 o 7,5).";
  let limite: string | null = null;
  if (e.fechaLimite.trim()) {
    limite = localAUtc(e.fechaLimite.trim());
    if (!limite) campos.fechaLimite = "La fecha límite no es válida.";
  }
  if (Object.keys(campos).length) return { ok: false, error: Object.values(campos)[0], campos };
  return {
    ok: true,
    data: { titulo, instrucciones: e.instrucciones, puntajeMaximo: puntaje as number, fechaLimite: limite, permiteReenvio: e.permiteReenvio },
  };
}

export interface EntradaRevision {
  puntaje: string | number;
  comentario: string;
  puntajeMaximo: number;
}

export function validarRevision(e: EntradaRevision): ResultadoValidacion<{ puntaje: number; comentario: string }> {
  const campos: Record<string, string> = {};
  const p = leerPuntajeObtenido(e.puntaje);
  if (p === null) campos.puntaje = "Escribe el puntaje obtenido (por ejemplo, 24 o 24,5).";
  else if (p > e.puntajeMaximo) campos.puntaje = `El puntaje no puede superar el máximo de la tarea (${formatearPuntaje(e.puntajeMaximo)}).`;
  if (e.comentario.length > COMENTARIO_REVISION_MAX) campos.comentario = `El comentario admite hasta ${COMENTARIO_REVISION_MAX} caracteres.`;
  if (Object.keys(campos).length) return { ok: false, error: Object.values(campos)[0], campos };
  return { ok: true, data: { puntaje: p as number, comentario: e.comentario.trim() } };
}

// ---- Archivo de la entrega ------------------------------------------------------------------
/** El bucket `entregas` admite menos tipos que `materiales` (sin Excel ni PowerPoint). */
export const EXT_ENTREGA = ["pdf", "png", "jpg", "jpeg", "webp", "txt", "docx"] as const;
export const ACCEPT_ENTREGA = EXT_ENTREGA.map((e) => `.${e}`).join(",");
export const LEGIBLE_ENTREGA = "PDF, imagen (PNG, JPG, WebP), Word o texto";

export function validarArchivoEntrega(nombre: string, bytes: number): ValidacionArchivo {
  const v = validarArchivo(nombre, bytes);
  const noPermitido = { ok: false as const, error: `Ese tipo de archivo no está permitido. Sube ${LEGIBLE_ENTREGA}.` };
  if (!v.ok) return v.error.includes("no está permitido") ? noPermitido : v;
  if (!(EXT_ENTREGA as readonly string[]).includes(v.ext)) return noPermitido;
  return v;
}

/** Ruta del objeto de una entrega: {tenant}/{tarea}/{alumno}/{uuid}.{ext}. */
export const RUTA_ENTREGA = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.([a-z0-9]{2,5})$/;

export type PermisoEntrega = { ok: true; numero: number } | { ok: false; error: string };

/** ¿Puede el alumno enviar (o reenviar) ahora? `previas` = cuántas entregas ya hizo. */
export function puedeEntregar(t: { permiteReenvio: boolean }, previas: number): PermisoEntrega {
  if (previas === 0) return { ok: true, numero: 1 };
  if (!t.permiteReenvio) return { ok: false, error: "Esta tarea admite una sola entrega." };
  if (previas >= ENTREGAS_MAX) return { ok: false, error: `Llegaste al máximo de ${ENTREGAS_MAX} entregas.` };
  return { ok: true, numero: previas + 1 };
}

// ---- Fechas en la zona de la academia -------------------------------------------------------
const RE_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function partesEnZona(ms: number, zona: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ms));
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { y: g("year"), mo: g("month"), d: g("day"), h: g("hour"), mi: g("minute") };
}

/** `YYYY-MM-DDTHH:mm` (hora de la academia) → ISO UTC; null si no es una fecha real. */
export function localAUtc(local: string, zona = ZONA_ACADEMIA): string | null {
  const m = RE_LOCAL.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (h > 23 || mi > 59) return null;
  const objetivo = Date.UTC(y, mo - 1, d, h, mi);
  if (new Date(objetivo).getUTCMonth() !== mo - 1) return null;
  let ms = objetivo;
  for (let i = 0; i < 2; i++) {
    const z = partesEnZona(ms, zona);
    ms += objetivo - Date.UTC(z.y, z.mo - 1, z.d, z.h, z.mi);
  }
  const fin = partesEnZona(ms, zona);
  if (Date.UTC(fin.y, fin.mo - 1, fin.d, fin.h, fin.mi) !== objetivo) return null; // hora que no existe (cambio de horario)
  return new Date(ms).toISOString();
}

/** ISO UTC → `YYYY-MM-DDTHH:mm` en la zona de la academia (para el input datetime-local). */
export function utcALocal(iso: string, zona = ZONA_ACADEMIA): string {
  const z = partesEnZona(new Date(iso).getTime(), zona);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${z.y}-${p2(z.mo)}-${p2(z.d)}T${p2(z.h)}:${p2(z.mi)}`;
}

/** «lunes, 9 de noviembre, 18:00». */
export function fechaHoraLarga(iso: string, zona = ZONA_ACADEMIA): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: zona,
  }).format(new Date(iso));
}

// ---- Clases en vivo -------------------------------------------------------------------------
export interface EntradaClase {
  titulo: string;
  descripcion: string;
  inicia: string; // datetime-local
  duracionMin: string | number;
  enlaceMeet: string;
  grabacionUrl: string;
  resumen: string;
}
export interface ClaseValida {
  titulo: string;
  descripcion: string;
  iniciaAt: string;
  duracionMin: number;
  enlaceMeet: string | null;
  grabacionUrl: string | null;
  resumen: string;
}

function https(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const s = u.toString();
    return s.length <= 2000 ? s : null;
  } catch {
    return null;
  }
}

export function validarClase(e: EntradaClase): ResultadoValidacion<ClaseValida> {
  const campos: Record<string, string> = {};
  const titulo = e.titulo.trim();
  if (!titulo) campos.titulo = "Escribe un título para la clase.";
  else if (titulo.length > TITULO_MAX) campos.titulo = `El título admite hasta ${TITULO_MAX} caracteres.`;
  if (e.descripcion.length > 2000) campos.descripcion = "La descripción admite hasta 2000 caracteres.";
  const iniciaAt = localAUtc(e.inicia.trim());
  if (!iniciaAt) campos.inicia = "Elige la fecha y la hora de la clase.";
  const dur = Number(e.duracionMin);
  if (!Number.isInteger(dur) || dur < 5 || dur > 600) campos.duracionMin = "La duración va entre 5 y 600 minutos.";
  let meet: string | null = null;
  if (e.enlaceMeet.trim()) {
    meet = https(e.enlaceMeet);
    if (!meet) campos.enlaceMeet = "Pega un enlace completo que empiece con https://.";
  }
  let grab: string | null = null;
  if (e.grabacionUrl.trim()) {
    grab = https(e.grabacionUrl);
    if (!grab) campos.grabacionUrl = "Pega un enlace completo que empiece con https://.";
  }
  if (e.resumen.length > 20000) campos.resumen = "El resumen admite hasta 20000 caracteres.";
  if (Object.keys(campos).length) return { ok: false, error: Object.values(campos)[0], campos };
  return {
    ok: true,
    data: { titulo, descripcion: e.descripcion, iniciaAt: iniciaAt as string, duracionMin: dur, enlaceMeet: meet, grabacionUrl: grab, resumen: e.resumen },
  };
}

/** Separa las clases en próximas (o en curso) y pasadas. Una clase sigue «próxima» hasta que termina. */
export function separarClases<T extends { iniciaAt: string; duracionMin: number }>(clases: T[], ahora = new Date()): { proximas: T[]; pasadas: T[] } {
  const t = ahora.getTime();
  const fin = (c: T) => new Date(c.iniciaAt).getTime() + c.duracionMin * 60_000;
  const proximas = clases.filter((c) => fin(c) >= t).sort((a, b) => a.iniciaAt.localeCompare(b.iniciaAt));
  const pasadas = clases.filter((c) => fin(c) < t).sort((a, b) => b.iniciaAt.localeCompare(a.iniciaAt));
  return { proximas, pasadas };
}
