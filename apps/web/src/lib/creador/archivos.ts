// Archivos propios como material (ADR 030). Flujo en tres pasos para no pasar el archivo por
// Vercel (límite de cuerpo de ~4,5 MB): 1) `prepararSubida` valida y emite una URL firmada de
// subida; 2) el navegador sube directo a Supabase Storage; 3) `confirmarSubida` verifica en
// el bucket el tamaño REAL del objeto, aplica la cuota y recién entonces enlaza el archivo.
// Todo filtra por tenant.id (sale de la sesión) y la ruta del objeto empieza por el tenant.
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CUOTA_ACADEMIA_BYTES,
  RUTA_OBJETO,
  TIPOS_ARCHIVO,
  cabeEnCuota,
  nombreVisible,
  validarArchivo,
} from "./archivosReglas";
import { mapMaterial } from "./cursos";
import { COLS_MATERIAL } from "./materiales";
import { requireCreadorContext } from "./tenantActual";
import type { Material, Resultado } from "./types";

const BUCKET = "materiales";
const ERR = "No pudimos guardar el cambio. Inténtalo de nuevo.";
const TITULO_POR_DEFECTO = "Nuevo material";

export interface Uso {
  usado: number;
  limite: number;
}

async function bytesUsados(db: SupabaseClient, tenantId: string, excluirMaterialId?: string): Promise<number> {
  const { data } = await db.from("materiales").select("id, bytes").eq("tenant_id", tenantId).eq("origen", "archivo");
  return (data ?? []).filter((r) => r.id !== excluirMaterialId).reduce((s, r) => s + (r.bytes ?? 0), 0);
}

async function usoActual(db: SupabaseClient, tenantId: string): Promise<Uso> {
  return { usado: await bytesUsados(db, tenantId), limite: CUOTA_ACADEMIA_BYTES };
}

export async function usoAlmacenamiento(): Promise<Resultado<Uso>> {
  const { tenant, db } = await requireCreadorContext();
  return { ok: true, data: await usoActual(db, tenant.id) };
}

/** Paso 1: valida tipo, tamaño y cuota; devuelve ruta y token para subir directo al bucket. */
export async function prepararSubida(
  materialId: string,
  archivo: { nombre: string; bytes: number },
): Promise<Resultado<{ ruta: string; token: string; mime: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const { data: mat } = await db.from("materiales").select("id, curso_id").eq("tenant_id", tenant.id).eq("id", materialId).maybeSingle();
  if (!mat) return { ok: false, error: "Material no encontrado." };

  const v = validarArchivo(archivo.nombre, archivo.bytes);
  if (!v.ok) return v;
  // El archivo que se reemplaza no cuenta: se libera al confirmar.
  const cuota = cabeEnCuota(await bytesUsados(db, tenant.id, materialId), archivo.bytes);
  if (!cuota.ok) return cuota;

  const ruta = `${tenant.id}/${mat.curso_id}/${randomUUID()}.${v.ext}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(ruta);
  if (error || !data) return { ok: false, error: ERR };
  return { ok: true, data: { ruta, token: data.token, mime: v.mime } };
}

/** Paso 3: confirma el objeto subido, lo enlaza al material y borra el archivo anterior. */
export async function confirmarSubida(
  materialId: string,
  ruta: string,
  nombreOriginal: string,
): Promise<Resultado<{ material: Material; uso: Uso }>> {
  const { tenant, db } = await requireCreadorContext();
  const { data: mat } = await db
    .from("materiales").select("id, curso_id, titulo, storage_path").eq("tenant_id", tenant.id).eq("id", materialId).maybeSingle();
  if (!mat) return { ok: false, error: "Material no encontrado." };

  // La ruta debe ser de ESTE tenant y de ESTE curso: nunca se confía en lo que manda el cliente.
  const m = RUTA_OBJETO.exec(ruta);
  if (!m || m[1] !== tenant.id || m[2] !== mat.curso_id) return { ok: false, error: "Archivo no válido." };

  // Un objeto pertenece a UN material: si otro ya lo usa, quitarlo allí dejaría a este sin archivo.
  const { data: enUso } = await db
    .from("materiales").select("id").eq("tenant_id", tenant.id).eq("storage_path", ruta).neq("id", materialId).limit(1);
  if (enUso && enUso.length > 0) return { ok: false, error: "Archivo no válido." };

  const carpeta = `${m[1]}/${m[2]}`;
  const archivoEnBucket = `${m[3]}.${m[4]}`;
  const { data: lista } = await db.storage.from(BUCKET).list(carpeta, { search: archivoEnBucket, limit: 5 });
  const obj = lista?.find((o) => o.name === archivoEnBucket);
  const tamano = Number((obj?.metadata as { size?: number } | undefined)?.size ?? 0);
  if (!obj || !tamano) return { ok: false, error: "No encontramos el archivo subido. Inténtalo de nuevo." };

  const descartar = async (error: string): Promise<Resultado<never>> => {
    await db.storage.from(BUCKET).remove([ruta]);
    return { ok: false, error };
  };
  const ext = m[4];
  const v = validarArchivo(`x.${ext}`, tamano);
  if (!v.ok) return descartar(v.error);
  const cuota = cabeEnCuota(await bytesUsados(db, tenant.id, materialId), tamano);
  if (!cuota.ok) return descartar(cuota.error);

  const nombre = nombreVisible(nombreOriginal);
  const fila: Record<string, unknown> = {
    origen: "archivo",
    url: null,
    tipo: "documento",
    storage_path: ruta,
    archivo_nombre: nombre,
    mime: TIPOS_ARCHIVO[ext],
    bytes: tamano,
  };
  if (mat.titulo === TITULO_POR_DEFECTO) fila.titulo = nombre.replace(/\.[^.]+$/, "").slice(0, 120) || TITULO_POR_DEFECTO;

  const { data, error } = await db
    .from("materiales").update(fila).eq("tenant_id", tenant.id).eq("id", materialId).select(COLS_MATERIAL).single();
  if (error || !data) return descartar(ERR);
  if (mat.storage_path && mat.storage_path !== ruta) await db.storage.from(BUCKET).remove([mat.storage_path]);
  return { ok: true, data: { material: mapMaterial(data), uso: await usoActual(db, tenant.id) } };
}

/** Quita el archivo del material (vuelve a ser un enlace vacío) y libera su espacio. */
export async function quitarArchivo(materialId: string): Promise<Resultado<{ material: Material; uso: Uso }>> {
  const { tenant, db } = await requireCreadorContext();
  const { data: mat } = await db.from("materiales").select("storage_path").eq("tenant_id", tenant.id).eq("id", materialId).maybeSingle();
  if (!mat) return { ok: false, error: "Material no encontrado." };
  const { data, error } = await db
    .from("materiales")
    .update({ origen: "enlace", storage_path: null, archivo_nombre: null, mime: null, bytes: null })
    .eq("tenant_id", tenant.id).eq("id", materialId).select(COLS_MATERIAL).single();
  if (error || !data) return { ok: false, error: ERR };
  if (mat.storage_path) await db.storage.from(BUCKET).remove([mat.storage_path]);
  return { ok: true, data: { material: mapMaterial(data), uso: await usoActual(db, tenant.id) } };
}

/** URL firmada de 60 s para que el creador abra o descargue su archivo. */
export async function urlDeDescarga(materialId: string): Promise<Resultado<{ url: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const { data: mat } = await db
    .from("materiales").select("storage_path, archivo_nombre").eq("tenant_id", tenant.id).eq("id", materialId).maybeSingle();
  if (!mat?.storage_path) return { ok: false, error: "Este material no tiene archivo." };
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(mat.storage_path, 60, { download: mat.archivo_nombre ?? true });
  if (error || !data) return { ok: false, error: ERR };
  return { ok: true, data: { url: data.signedUrl } };
}
