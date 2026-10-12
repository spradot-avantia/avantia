// Validaciones del Espacio del Creador. Modulo PURO (sin imports de servidor)
// para poder probarlo con vitest y reutilizarlo en cliente (validacion en vivo)
// y servidor (la validacion del servidor es la que manda).
import { z } from "zod";
import type { TipoLeccion } from "./types";

// ---------------------------------------------------------------- Curso

export const TITULO_MIN = 5;
export const TITULO_MAX = 80;
export const DESCRIPCION_MIN = 50;
export const DESCRIPCION_MAX = 400;
export const OBJETIVOS_MAX = 3;
export const OBJETIVO_MAX = 200;
export const PUBLICO_MAX = 200;

export const tituloCurso = z
  .string()
  .trim()
  .min(TITULO_MIN, `El título necesita al menos ${TITULO_MIN} caracteres.`)
  .max(TITULO_MAX, `El título admite hasta ${TITULO_MAX} caracteres.`);

export const descripcionCurso = z
  .string()
  .trim()
  .min(DESCRIPCION_MIN, `La descripción necesita al menos ${DESCRIPCION_MIN} caracteres.`)
  .max(DESCRIPCION_MAX, `La descripción admite hasta ${DESCRIPCION_MAX} caracteres.`);

export const publicoCurso = z
  .string()
  .trim()
  .max(PUBLICO_MAX, `Admite hasta ${PUBLICO_MAX} caracteres.`);

export const objetivosCurso = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Escribe el objetivo o quítalo.")
      .max(OBJETIVO_MAX, `Cada objetivo admite hasta ${OBJETIVO_MAX} caracteres.`),
  )
  .min(1, "Agrega al menos un objetivo.")
  .max(OBJETIVOS_MAX, `Puedes definir hasta ${OBJETIVOS_MAX} objetivos.`);

export const modalidadCurso = z.enum(["a_su_ritmo", "con_fechas"]);
export const accesoCurso = z.enum(["invitados", "enlace"]);
const fechaIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
  .refine((f) => !Number.isNaN(Date.parse(f)), "Fecha inválida.");

export const tituloModulo = z.string().trim().min(1, "El módulo necesita un nombre.").max(120, "Admite hasta 120 caracteres.");
export const tituloLeccion = z.string().trim().min(1, "La lección necesita un título.").max(120, "Admite hasta 120 caracteres.");
export const textoLeccion = z.string().max(20000, "El texto admite hasta 20.000 caracteres.");

/** Valida un campo suelto del curso. Devuelve el valor normalizado o el error. */
export function validarCampoCurso(
  campo: string,
  valor: unknown,
): { ok: true; valor: unknown } | { ok: false; error: string } {
  const schemas: Record<string, z.ZodType> = {
    titulo: tituloCurso,
    descripcion: descripcionCurso,
    publico: publicoCurso,
    objetivos: objetivosCurso,
    modalidad: modalidadCurso,
    acceso: accesoCurso,
    fechaInicio: fechaIso.nullable(),
    fechaTermino: fechaIso.nullable(),
  };
  const schema = schemas[campo];
  if (!schema) return { ok: false, error: "Campo desconocido." };
  const r = schema.safeParse(valor);
  return r.success ? { ok: true, valor: r.data } : { ok: false, error: r.error.issues[0]?.message ?? "Valor inválido." };
}

/** Coherencia de fechas para modalidad con fechas. */
export function validarFechas(inicio: string | null, termino: string | null): string | null {
  if (!inicio) return "Indica la fecha de inicio.";
  if (!termino) return "Indica la fecha de término.";
  if (Date.parse(termino) < Date.parse(inicio)) return "La fecha de término no puede ser anterior al inicio.";
  return null;
}

// ---------------------------------------------------------------- Marca

export const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Usa un color hexadecimal, por ejemplo #2563EB.");
export const nombreAcademia = z.string().trim().min(2, "El nombre necesita al menos 2 caracteres.").max(60, "El nombre admite hasta 60 caracteres.");
export const fraseAcademia = z.string().trim().max(100, "La frase admite hasta 100 caracteres.");
export const areaAcademia = z.string().trim().max(60, "El área admite hasta 60 caracteres.");

export const marcaSchema = z.object({
  nombre: nombreAcademia.optional(),
  frase: fraseAcademia.optional(),
  area: areaAcademia.optional(),
  colorPrimario: colorHex.optional(),
  logoModo: z.enum(["logo_y_nombre", "solo_logo"]).optional(),
  pais: z.string().trim().max(60).optional(),
  moneda: z.string().trim().max(10).optional(),
});

// ---------------------------------------------------------------- URLs

const HOSTS_YOUTUBE = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"];
const HOSTS_VIMEO = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];
const HOSTS_DRIVE = ["drive.google.com"];
const HOSTS_DOCS = ["docs.google.com"];

export type ProveedorUrl = "youtube" | "vimeo" | "drive" | "docs" | "otro";

function parseHttps(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

export function proveedorDeUrl(raw: string): ProveedorUrl | null {
  const u = parseHttps(raw);
  if (!u) return null;
  const h = u.hostname.toLowerCase();
  if (HOSTS_YOUTUBE.includes(h)) return "youtube";
  if (HOSTS_VIMEO.includes(h)) return "vimeo";
  if (HOSTS_DRIVE.includes(h)) return "drive";
  if (HOSTS_DOCS.includes(h)) return "docs";
  return null;
}

/** Aviso que acompaña a los enlaces de documento (el acceso depende del servicio externo). */
export const AVISO_ENLACE_DOCUMENTO = "Revisa que el enlace permita ver a tus estudiantes.";

/**
 * URL de leccion segun tipo.
 * - Video: YouTube, Vimeo o Drive (Drive solo si es un archivo embebible).
 * - Documento: CUALQUIER enlace https (Drive, Dropbox, OneDrive, Notion, Canva...).
 *   El modelo queda listo para `storage_path` (ADR 005), aun sin subida de archivos.
 */
export function validarUrlLeccion(
  tipo: TipoLeccion,
  raw: string,
): { ok: true; url: string; proveedor: ProveedorUrl } | { ok: false; error: string } {
  if (tipo === "texto") return { ok: false, error: "Una lección de texto no lleva enlace." };
  const u = parseHttps(raw);
  if (!u) return { ok: false, error: "Pega un enlace completo que empiece con https://." };
  const prov = proveedorDeUrl(raw);
  if (tipo === "documento") {
    return { ok: true, url: u.toString(), proveedor: prov ?? "otro" };
  }
  if (!prov || !(["youtube", "vimeo", "drive"] as ProveedorUrl[]).includes(prov)) {
    return { ok: false, error: "Para video aceptamos enlaces de YouTube, Vimeo o Google Drive." };
  }
  if (!urlEmbebible(raw)) {
    return {
      ok: false,
      error:
        prov === "drive"
          ? "El enlace de Drive debe ser de un archivo de video (drive.google.com/file/d/…)."
          : "No reconocemos el video en ese enlace. Pega el enlace de un video, no el de un canal o lista.",
    };
  }
  return { ok: true, url: u.toString(), proveedor: prov };
}

/** URL embebible para el reproductor, o null si no se puede incrustar. */
export function urlEmbebible(raw: string): string | null {
  const u = parseHttps(raw);
  const prov = proveedorDeUrl(raw);
  if (!u || !prov) return null;
  if (prov === "youtube") {
    const h = u.hostname.toLowerCase();
    let id: string | null = null;
    if (h === "youtu.be") id = u.pathname.slice(1).split("/")[0] || null;
    else if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = /^\/(?:embed|shorts|live)\/([\w-]{6,20})/.exec(u.pathname);
      id = m ? m[1] : null;
    }
    return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (prov === "vimeo") {
    const m = /\/(\d{6,12})(?:\/|$)/.exec(u.pathname);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (prov === "drive") {
    const m = /\/file\/d\/([\w-]+)/.exec(u.pathname);
    return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
  }
  return null;
}

// ---------------------------------------------------------------- Correos

const emailSchema = z.email();

/** Separa un texto pegado en correos unicos (minusculas) y los invalidos. */
export function parsearCorreos(texto: string): { validos: string[]; invalidos: string[] } {
  const piezas = texto
    .split(/[\s,;]+/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const validos: string[] = [];
  const invalidos: string[] = [];
  for (const p of piezas) {
    if (p.length <= 254 && emailSchema.safeParse(p).success) {
      if (!validos.includes(p)) validos.push(p);
    } else if (!invalidos.includes(p)) invalidos.push(p);
  }
  return { validos, invalidos };
}

// ---------------------------------------------------------------- Slug

export function slugify(texto: string): string {
  const s = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return s || "curso";
}

// ---------------------------------------------------------------- Logo

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_MIN_LADO = 128;
export const LOGO_TIPOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export type LogoMime = (typeof LOGO_TIPOS)[number];
export const LOGO_EXT: Record<LogoMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
/** Relacion ancho/alto desde la cual el logo se muestra solo por defecto. */
export const LOGO_ANCHO_RATIO = 1.8;

export function validarMetaLogo(m: { tipo: string; bytes: number; ancho: number; alto: number }): string | null {
  if (!(LOGO_TIPOS as readonly string[]).includes(m.tipo)) return "Formato no admitido. Usa PNG, JPG, SVG o WebP.";
  if (m.bytes > LOGO_MAX_BYTES) return "El archivo pesa más de 2 MB. Reduce su tamaño y vuelve a intentarlo.";
  if (m.ancho < LOGO_MIN_LADO || m.alto < LOGO_MIN_LADO) return `El logo debe medir al menos ${LOGO_MIN_LADO} px por lado.`;
  return null;
}

export function modoLogoSugerido(ancho: number, alto: number): "logo_y_nombre" | "solo_logo" {
  return alto > 0 && ancho / alto > LOGO_ANCHO_RATIO ? "solo_logo" : "logo_y_nombre";
}

function ascii(b: Uint8Array, desde: number, hasta: number): string {
  return String.fromCharCode(...Array.from(b.slice(desde, hasta)));
}

/** Tipo real segun los primeros bytes (no confiar en el mime declarado). */
export function detectarMime(b: Uint8Array): LogoMime | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  const inicio = new TextDecoder().decode(b.slice(0, 512)).toLowerCase();
  if (inicio.includes("<svg") || (inicio.includes("<?xml") && inicio.includes("svg"))) return "image/svg+xml";
  return null;
}

function dimensionesSvg(svg: string): { ancho: number; alto: number } | null {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0];
  if (!tag) return null;
  const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(tag);
  if (vb) return { ancho: parseFloat(vb[1]), alto: parseFloat(vb[2]) };
  const w = /\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i.exec(tag);
  const h = /\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i.exec(tag);
  return w && h ? { ancho: parseFloat(w[1]), alto: parseFloat(h[1]) } : null;
}

/** Dimensiones desde la cabecera del archivo; null si no se pueden leer. */
export function dimensionesImagen(b: Uint8Array, mime: LogoMime): { ancho: number; alto: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    if (mime === "image/png") return { ancho: dv.getUint32(16), alto: dv.getUint32(20) };
    if (mime === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = b[i + 1];
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
          i += 2;
          continue;
        }
        const len = dv.getUint16(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { alto: dv.getUint16(i + 5), ancho: dv.getUint16(i + 7) };
        }
        i += 2 + len;
      }
      return null;
    }
    if (mime === "image/webp") {
      const tipo = ascii(b, 12, 16);
      if (tipo === "VP8X") {
        return { ancho: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), alto: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
      }
      if (tipo === "VP8L") {
        const bits = dv.getUint32(21, true);
        return { ancho: (bits & 0x3fff) + 1, alto: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (tipo === "VP8 ") return { ancho: dv.getUint16(26, true) & 0x3fff, alto: dv.getUint16(28, true) & 0x3fff };
      return null;
    }
    return dimensionesSvg(new TextDecoder().decode(b));
  } catch {
    return null;
  }
}

/**
 * Sanitiza un SVG eliminando todo lo que pueda ejecutar codigo o cargar
 * recursos externos (ADR 005). Lista de bloqueo + verificacion final: si
 * tras limpiar queda algo sospechoso, se rechaza (devuelve null).
 */
export function sanitizarSvg(entrada: string): string | null {
  let s = entrada;
  s = s.replace(/<\?xml-stylesheet[\s\S]*?\?>/gi, "");
  s = s.replace(/<!DOCTYPE[\s\S]*?(\[[\s\S]*?\])?\s*>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  const peligrosos =
    "script|foreignObject|iframe|embed|object|audio|video|canvas|use|image|animate|set|animateTransform|animateMotion|style|link|meta|handler|listener";
  s = s.replace(new RegExp(`<(${peligrosos})\\b[\\s\\S]*?<\\/\\1\\s*>`, "gi"), "");
  s = s.replace(new RegExp(`<\\/?(${peligrosos})\\b[^>]*>`, "gi"), "");
  s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/\s(?:xlink:)?href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, (m, v: string) =>
    /url\s*\(|expression|javascript:|@import/i.test(v) ? "" : m,
  );
  if (!/<svg\b/i.test(s)) return null;
  if (/<\s*(script|foreignObject|iframe|embed|object)\b|\son[a-z]+\s*=|javascript:|data:text\/html|<!ENTITY/i.test(s)) {
    return null;
  }
  return s.trim();
}

export type ResultadoLogo =
  | {
      ok: true;
      mime: LogoMime;
      ancho: number;
      alto: number;
      bytes: Uint8Array;
      modoSugerido: "logo_y_nombre" | "solo_logo";
    }
  | { ok: false; error: string };

/** Validacion completa de un archivo de logo en el servidor (SVG sanitizado). */
export function inspeccionarLogo(bytes: Uint8Array, mimeDeclarado: string): ResultadoLogo {
  if (bytes.length > LOGO_MAX_BYTES) {
    return { ok: false, error: "El archivo pesa más de 2 MB. Reduce su tamaño y vuelve a intentarlo." };
  }
  const mime = detectarMime(bytes);
  const declaradoOk = !mimeDeclarado || mimeDeclarado === mime || (mimeDeclarado === "image/jpg" && mime === "image/jpeg");
  if (!mime || !declaradoOk) {
    return { ok: false, error: "Formato no admitido o archivo dañado. Usa PNG, JPG, SVG o WebP." };
  }
  let salida = bytes;
  if (mime === "image/svg+xml") {
    const limpio = sanitizarSvg(new TextDecoder().decode(bytes));
    if (!limpio) {
      return { ok: false, error: "El SVG contiene elementos no permitidos (scripts o recursos externos). Expórtalo como PNG o como SVG simple." };
    }
    salida = new TextEncoder().encode(limpio);
  }
  const dim = dimensionesImagen(salida, mime);
  if (!dim) return { ok: false, error: "No pudimos leer el tamaño del logo. Prueba con otro archivo." };
  const err = validarMetaLogo({ tipo: mime, bytes: salida.length, ancho: dim.ancho, alto: dim.alto });
  if (err) return { ok: false, error: err };
  return { ok: true, mime, ancho: dim.ancho, alto: dim.alto, bytes: salida, modoSugerido: modoLogoSugerido(dim.ancho, dim.alto) };
}
