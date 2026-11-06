"use client";

// Compresión de archivos en el navegador antes de subirlos (ADR 030). Solo comprime lo que se
// comprime bien con APIs del navegador: las imágenes (se redimensionan y pasan a WebP).
// PDF, Word, Excel y PowerPoint se suben tal cual: no hay compresión fiable y gratuita para
// ellos en el navegador (Word/Excel/PowerPoint ya son ZIP). Si algo falla, se sube el original.

const LADO_MAX = 2000; // px, suficiente para leer una captura o infografía en pantalla
const CALIDAD = 0.82;
const COMPRIMIBLES = ["image/png", "image/jpeg", "image/webp"];

export interface ResultadoCompresion {
  archivo: File;
  /** Bytes del original, para mostrar cuánto se ahorró. */
  bytesOriginal: number;
  comprimido: boolean;
}

export async function prepararArchivo(original: File): Promise<ResultadoCompresion> {
  const sinCambio: ResultadoCompresion = { archivo: original, bytesOriginal: original.size, comprimido: false };
  if (!COMPRIMIBLES.includes(original.type)) return sinCambio;
  try {
    const bmp = await createImageBitmap(original, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
    const ancho = Math.max(1, Math.round(bmp.width * escala));
    const alto = Math.max(1, Math.round(bmp.height * escala));
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return sinCambio;
    ctx.drawImage(bmp, 0, 0, ancho, alto);
    bmp.close();
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/webp", CALIDAD));
    // Solo vale la pena si ahorra al menos 5 %; si no, se conserva el original.
    if (!blob || blob.type !== "image/webp" || blob.size >= original.size * 0.95) return sinCambio;
    const base = original.name.replace(/\.[^.]+$/, "") || "imagen";
    return { archivo: new File([blob], `${base}.webp`, { type: "image/webp" }), bytesOriginal: original.size, comprimido: true };
  } catch {
    return sinCambio;
  }
}
