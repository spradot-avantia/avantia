// Reglas de los archivos subidos como material (ADR 030). Puras: las usan el navegador
// (validar antes de subir) y el servidor (validar de nuevo; el cliente no es de fiar).

export const ARCHIVO_MAX_BYTES = 25 * 1024 * 1024; // por archivo
export const CUOTA_ACADEMIA_BYTES = 100 * 1024 * 1024; // por academia, plan Free (ADR 030)
export const NOMBRE_ARCHIVO_MAX = 120;

/** Extensión → tipo MIME permitido. La extensión es la fuente de verdad (el MIME del navegador varía). */
export const TIPOS_ARCHIVO: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  txt: "text/plain",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/** Atributo `accept` del selector de archivos. */
export const ACCEPT_ARCHIVOS = Object.keys(TIPOS_ARCHIVO)
  .map((e) => `.${e}`)
  .join(",");

export const EXTENSIONES_LEGIBLES = "PDF, imágenes (PNG, JPG, WebP), Word, Excel, PowerPoint o texto";

export function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf(".");
  return i === -1 ? "" : nombre.slice(i + 1).toLowerCase();
}

export function formatearBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  const mb = n / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1).replace(".", ",") : Math.round(mb)} MB`;
}

export type ValidacionArchivo = { ok: true; ext: string; mime: string } | { ok: false; error: string };

export function validarArchivo(nombre: string, bytes: number): ValidacionArchivo {
  const ext = extensionDe(nombre);
  const mime = TIPOS_ARCHIVO[ext];
  if (!mime) return { ok: false, error: `Ese tipo de archivo no está permitido. Sube ${EXTENSIONES_LEGIBLES}.` };
  if (!Number.isFinite(bytes) || bytes <= 0) return { ok: false, error: "El archivo está vacío." };
  if (bytes > ARCHIVO_MAX_BYTES) {
    return { ok: false, error: `El archivo pesa ${formatearBytes(bytes)} y el máximo es ${formatearBytes(ARCHIVO_MAX_BYTES)}.` };
  }
  return { ok: true, ext, mime };
}

/** ¿Cabe `nuevo` bytes más sobre lo ya usado dentro de la cuota de la academia? */
export function cabeEnCuota(usado: number, nuevo: number): { ok: true } | { ok: false; error: string } {
  if (usado + nuevo <= CUOTA_ACADEMIA_BYTES) return { ok: true };
  const libre = Math.max(0, CUOTA_ACADEMIA_BYTES - usado);
  return {
    ok: false,
    error: `Tu academia tiene ${formatearBytes(libre)} libres de ${formatearBytes(CUOTA_ACADEMIA_BYTES)}. Libera espacio o usa un enlace.`,
  };
}

/** Nombre visible seguro: sin rutas ni caracteres de control, acotado. */
export function nombreVisible(nombre: string): string {
  const base = nombre.split(/[\\/]/).pop() ?? "";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, NOMBRE_ARCHIVO_MAX) || "archivo";
}

/** Ruta del objeto: {tenant}/{curso}/{uuid}.{ext}. Se valida con esta misma regex al confirmar. */
export const RUTA_OBJETO = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.([a-z0-9]{2,5})$/;
