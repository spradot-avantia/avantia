"use client";

// Secuencia de subida de un archivo desde el navegador (ADR 030), común a los materiales y a las
// lecciones de tipo documento: comprime (imágenes), pide la URL firmada al servidor, sube directo
// al bucket privado y confirma. El servidor repite todas las validaciones: esto es solo el camino.
import { createSupabaseBrowserClient } from "../supabase/client";
import { formatearBytes } from "./archivosReglas";
import { prepararArchivo } from "./comprimir";
import type { Resultado } from "./types";

export interface PasosSubida<T> {
  /** Pide al servidor validar el archivo y emitir la URL firmada de subida. */
  preparar: (archivo: { nombre: string; bytes: number }) => Promise<Resultado<{ ruta: string; token: string; mime: string }>>;
  /** Pide al servidor verificar el objeto subido y enlazarlo. */
  confirmar: (ruta: string, nombreOriginal: string) => Promise<Resultado<T>>;
  /** Mensaje de progreso para mostrar al creador. */
  estado: (mensaje: string) => void;
}

export type ResultadoSubida<T> =
  | { ok: true; data: T; anuncio: string }
  | { ok: false; error: string };

export async function subirArchivoAlBucket<T>(elegido: File, pasos: PasosSubida<T>, bucket = "materiales"): Promise<ResultadoSubida<T>> {
  pasos.estado("Preparando el archivo…");
  const { archivo, bytesOriginal, comprimido } = await prepararArchivo(elegido);
  const prep = await pasos.preparar({ nombre: archivo.name, bytes: archivo.size });
  if (!prep.ok) return { ok: false, error: prep.error };

  pasos.estado(`Subiendo ${formatearBytes(archivo.size)}…`);
  const { error } = await createSupabaseBrowserClient()
    .storage.from(bucket)
    .uploadToSignedUrl(prep.data.ruta, prep.data.token, archivo, { contentType: prep.data.mime });
  if (error) return { ok: false, error: "No pudimos subir el archivo. Revisa tu conexión e inténtalo de nuevo." };

  const fin = await pasos.confirmar(prep.data.ruta, elegido.name);
  if (!fin.ok) return { ok: false, error: fin.error };
  return {
    ok: true,
    data: fin.data,
    anuncio: comprimido
      ? `Archivo subido. La imagen pasó de ${formatearBytes(bytesOriginal)} a ${formatearBytes(archivo.size)}.`
      : "Archivo subido.",
  };
}
