// Archivos propios del creador (ADR 030): como material de un módulo o de una lección, y como
// contenido de una lección de tipo documento. Flujo en tres pasos para no pasar el archivo por
// Vercel (límite de cuerpo de ~4,5 MB): 1) `prepararSubida*` valida y emite una URL firmada de
// subida; 2) el navegador sube directo a Supabase Storage; 3) `confirmarSubida*` verifica en
// el bucket el tamaño REAL del objeto, aplica la cuota y recién entonces enlaza el archivo.
// Todo filtra por tenant.id (sale de la sesión) y la ruta del objeto empieza por el tenant.
// La cuota de la academia suma los archivos de materiales, los de lecciones y las entregas de alumnos.
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
import { mapLeccion, mapMaterial } from "./cursos";
import { COLS_MATERIAL } from "./materiales";
import { quitarArchivos } from "./limpiezaArchivos";
import { requireCreadorContext } from "./tenantActual";
import type { Leccion, Material, Resultado } from "./types";

const BUCKET = "materiales";
const ERR = "No pudimos guardar el cambio. Inténtalo de nuevo.";
const TITULO_POR_DEFECTO = "Nuevo material";
export const COLS_LECCION =
  "id, modulo_id, curso_id, titulo, tipo, contenido_url, contenido_texto, storage_path, contenido_tipo, archivo_nombre, bytes, descripcion, duracion_min, orden";

export interface Uso {
  usado: number;
  limite: number;
}

/** Dónde vive el archivo: una fila de `materiales` o una lección de tipo documento. */
type Destino = "material" | "leccion";
type Excluir = { destino: Destino; id: string };

const TABLA: Record<Destino, string> = { material: "materiales", leccion: "lecciones" };
// Se tipa como `string` plano: el `select` de Supabase no puede inferir una unión de dos listas.
const colsDe = (destino: Destino): string => (destino === "material" ? COLS_MATERIAL : COLS_LECCION);

export async function bytesUsados(db: SupabaseClient, tenantId: string, excluir?: Excluir): Promise<number> {
  const [mats, lecs, ents] = await Promise.all([
    db.from("materiales").select("id, bytes").eq("tenant_id", tenantId).eq("origen", "archivo"),
    db.from("lecciones").select("id, bytes").eq("tenant_id", tenantId).not("storage_path", "is", null),
    // Las entregas de los alumnos (ADR 038) comparten la misma cuota de la academia.
    db.from("entregas").select("bytes").eq("tenant_id", tenantId),
  ]);
  const suma = (filas: Array<{ id: string; bytes: number | null }> | null, destino: Destino) =>
    (filas ?? []).filter((r) => !(excluir?.destino === destino && excluir.id === r.id)).reduce((s, r) => s + (r.bytes ?? 0), 0);
  const deEntregas = (ents.data ?? []).reduce((s, r) => s + ((r as { bytes: number | null }).bytes ?? 0), 0);
  return suma(mats.data, "material") + suma(lecs.data, "leccion") + deEntregas;
}

async function usoActual(db: SupabaseClient, tenantId: string): Promise<Uso> {
  return { usado: await bytesUsados(db, tenantId), limite: CUOTA_ACADEMIA_BYTES };
}

export async function usoAlmacenamiento(): Promise<Resultado<Uso>> {
  const { tenant, db } = await requireCreadorContext();
  return { ok: true, data: await usoActual(db, tenant.id) };
}

/** Fila del destino (del tenant de la sesión) con lo necesario para validar y enlazar. */
async function cargarDestino(db: SupabaseClient, tenantId: string, destino: Destino, id: string) {
  const cols = destino === "material" ? "id, curso_id, titulo, storage_path" : "id, curso_id, tipo, storage_path";
  const { data } = await db.from(TABLA[destino]).select(cols).eq("tenant_id", tenantId).eq("id", id).maybeSingle();
  return data as { id: string; curso_id: string; titulo?: string; tipo?: string; storage_path: string | null } | null;
}

// ---- Paso 1 -------------------------------------------------------------------------------
async function preparar(
  destino: Destino,
  id: string,
  archivo: { nombre: string; bytes: number },
): Promise<Resultado<{ ruta: string; token: string; mime: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const fila = await cargarDestino(db, tenant.id, destino, id);
  if (!fila) return { ok: false, error: destino === "material" ? "Material no encontrado." : "Lección no encontrada." };
  if (destino === "leccion" && fila.tipo !== "documento") return { ok: false, error: "Esta lección no es de tipo documento." };

  const v = validarArchivo(archivo.nombre, archivo.bytes);
  if (!v.ok) return v;
  // El archivo que se reemplaza no cuenta: se libera al confirmar.
  const cuota = cabeEnCuota(await bytesUsados(db, tenant.id, { destino, id }), archivo.bytes);
  if (!cuota.ok) return cuota;

  const ruta = `${tenant.id}/${fila.curso_id}/${randomUUID()}.${v.ext}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(ruta);
  if (error || !data) return { ok: false, error: ERR };
  return { ok: true, data: { ruta, token: data.token, mime: v.mime } };
}

// ---- Paso 3 -------------------------------------------------------------------------------
async function confirmar(destino: Destino, id: string, ruta: string, nombreOriginal: string) {
  const { tenant, db } = await requireCreadorContext();
  const fila = await cargarDestino(db, tenant.id, destino, id);
  if (!fila) return { ok: false as const, error: destino === "material" ? "Material no encontrado." : "Lección no encontrada." };
  if (destino === "leccion" && fila.tipo !== "documento") return { ok: false as const, error: "Esta lección no es de tipo documento." };

  // La ruta debe ser de ESTE tenant y de ESTE curso: nunca se confía en lo que manda el cliente.
  const m = RUTA_OBJETO.exec(ruta);
  if (!m || m[1] !== tenant.id || m[2] !== fila.curso_id) return { ok: false as const, error: "Archivo no válido." };

  // Un objeto pertenece a UN solo destino: si otro (material o lección) ya lo usa, quitarlo allí
  // dejaría a este sin archivo.
  const [enMat, enLec] = await Promise.all([
    db.from("materiales").select("id").eq("tenant_id", tenant.id).eq("storage_path", ruta).limit(2),
    db.from("lecciones").select("id").eq("tenant_id", tenant.id).eq("storage_path", ruta).limit(2),
  ]);
  const otros = [
    ...(enMat.data ?? []).filter((r) => !(destino === "material" && r.id === id)),
    ...(enLec.data ?? []).filter((r) => !(destino === "leccion" && r.id === id)),
  ];
  if (otros.length > 0) return { ok: false as const, error: "Archivo no válido." };

  const carpeta = `${m[1]}/${m[2]}`;
  const archivoEnBucket = `${m[3]}.${m[4]}`;
  const { data: lista } = await db.storage.from(BUCKET).list(carpeta, { search: archivoEnBucket, limit: 5 });
  const obj = lista?.find((o) => o.name === archivoEnBucket);
  const tamano = Number((obj?.metadata as { size?: number } | undefined)?.size ?? 0);
  if (!obj || !tamano) return { ok: false as const, error: "No encontramos el archivo subido. Inténtalo de nuevo." };

  const descartar = async (error: string) => {
    await db.storage.from(BUCKET).remove([ruta]);
    return { ok: false as const, error };
  };
  const ext = m[4];
  const v = validarArchivo(`x.${ext}`, tamano);
  if (!v.ok) return descartar(v.error);
  const cuota = cabeEnCuota(await bytesUsados(db, tenant.id, { destino, id }), tamano);
  if (!cuota.ok) return descartar(cuota.error);

  const nombre = nombreVisible(nombreOriginal);
  const mime = TIPOS_ARCHIVO[ext];
  let fila2: Record<string, unknown>;
  if (destino === "material") {
    fila2 = { origen: "archivo", url: null, tipo: "documento", storage_path: ruta, archivo_nombre: nombre, mime, bytes: tamano };
    if (fila.titulo === TITULO_POR_DEFECTO) fila2.titulo = nombre.replace(/\.[^.]+$/, "").slice(0, 120) || TITULO_POR_DEFECTO;
  } else {
    fila2 = { contenido_url: null, storage_path: ruta, archivo_nombre: nombre, contenido_tipo: mime, bytes: tamano };
  }

  const { data, error } = await db
    .from(TABLA[destino]).update(fila2).eq("tenant_id", tenant.id).eq("id", id)
    .select(colsDe(destino)).single();
  if (error || !data) return descartar(ERR);
  if (fila.storage_path && fila.storage_path !== ruta) await quitarArchivos(db, [fila.storage_path]);
  return { ok: true as const, fila: data, uso: await usoActual(db, tenant.id) };
}

// ---- Quitar y descargar ---------------------------------------------------------------------
async function quitar(destino: Destino, id: string) {
  const { tenant, db } = await requireCreadorContext();
  const previo = await cargarDestino(db, tenant.id, destino, id);
  if (!previo) return { ok: false as const, error: destino === "material" ? "Material no encontrado." : "Lección no encontrada." };
  const vacio =
    destino === "material"
      ? { origen: "enlace", storage_path: null, archivo_nombre: null, mime: null, bytes: null }
      : { storage_path: null, archivo_nombre: null, contenido_tipo: null, bytes: null };
  const { data, error } = await db
    .from(TABLA[destino]).update(vacio).eq("tenant_id", tenant.id).eq("id", id)
    .select(colsDe(destino)).single();
  if (error || !data) return { ok: false as const, error: ERR };
  if (previo.storage_path) await quitarArchivos(db, [previo.storage_path]);
  return { ok: true as const, fila: data, uso: await usoActual(db, tenant.id) };
}

async function descargar(destino: Destino, id: string): Promise<Resultado<{ url: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const { data: fila } = await db
    .from(TABLA[destino]).select("storage_path, archivo_nombre").eq("tenant_id", tenant.id).eq("id", id).maybeSingle();
  if (!fila?.storage_path) return { ok: false, error: destino === "material" ? "Este material no tiene archivo." : "Esta lección no tiene archivo." };
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(fila.storage_path, 60, { download: fila.archivo_nombre ?? true });
  if (error || !data) return { ok: false, error: ERR };
  return { ok: true, data: { url: data.signedUrl } };
}

// ---- Materiales -----------------------------------------------------------------------------
export const prepararSubida = (materialId: string, archivo: { nombre: string; bytes: number }) =>
  preparar("material", materialId, archivo);

export async function confirmarSubida(materialId: string, ruta: string, nombreOriginal: string): Promise<Resultado<{ material: Material; uso: Uso }>> {
  const r = await confirmar("material", materialId, ruta, nombreOriginal);
  return r.ok ? { ok: true, data: { material: mapMaterial(r.fila), uso: r.uso } } : r;
}

/** Quita el archivo del material (vuelve a ser un enlace vacío) y libera su espacio. */
export async function quitarArchivo(materialId: string): Promise<Resultado<{ material: Material; uso: Uso }>> {
  const r = await quitar("material", materialId);
  return r.ok ? { ok: true, data: { material: mapMaterial(r.fila), uso: r.uso } } : r;
}

/** URL firmada de 60 s para que el creador abra o descargue su archivo. */
export const urlDeDescarga = (materialId: string) => descargar("material", materialId);

// ---- Lecciones de tipo documento ------------------------------------------------------------
export const prepararSubidaLeccion = (leccionId: string, archivo: { nombre: string; bytes: number }) =>
  preparar("leccion", leccionId, archivo);

export async function confirmarSubidaLeccion(leccionId: string, ruta: string, nombreOriginal: string): Promise<Resultado<{ leccion: Leccion; uso: Uso }>> {
  const r = await confirmar("leccion", leccionId, ruta, nombreOriginal);
  return r.ok ? { ok: true, data: { leccion: mapLeccion(r.fila), uso: r.uso } } : r;
}

/** Quita el archivo de la lección (queda sin contenido) y libera su espacio. */
export async function quitarArchivoLeccion(leccionId: string): Promise<Resultado<{ leccion: Leccion; uso: Uso }>> {
  const r = await quitar("leccion", leccionId);
  return r.ok ? { ok: true, data: { leccion: mapLeccion(r.fila), uso: r.uso } } : r;
}

export const urlDeDescargaLeccion = (leccionId: string) => descargar("leccion", leccionId);
