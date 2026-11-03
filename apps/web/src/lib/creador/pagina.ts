// Repo de la página pública de la academia (ADR 021). Filtra siempre por
// tenant.id (además de RLS). El tenant sale de la sesión (tenantActual.ts).
import { randomBytes } from "node:crypto";
import {
  CONTENIDO_VACIO,
  contenidoDesdeJson,
  mapTestimonios,
  contenidoSchema,
  esClaveTemplate,
  pendientesPagina,
  testimonioSchema,
  validarDominio,
  validarMetaPortada,
  type CambiosContenido,
  type ClaveTemplate,
  type ContenidoPagina,
  type PaginaAcademia,
  type Testimonio,
  TESTIMONIOS_MAX,
} from "./paginaReglas";
import { requireCreadorContext } from "./tenantActual";
import type { Resultado } from "./types";
import { detectarMime, dimensionesImagen, LOGO_EXT } from "./validacion";

const COLS =
  "tenant_id, template, titulo, bajada, foto_url, accion, cursos_ocultos, bio_nombre, bio_texto, testimonios, ejemplo_testimonios_quitado, publicado, publicada_at, dominio_solicitado, dominio_token, dominio_solicitado_at";

function mapPagina(r: any): PaginaAcademia {
  return {
    contenido: {
      template: esClaveTemplate(r.template) ? r.template : null,
      titulo: r.titulo,
      bajada: r.bajada,
      fotoUrl: r.foto_url,
      accion: r.accion === "conversacion" ? "conversacion" : "inscribirme",
      cursosOcultos: r.cursos_ocultos ?? [],
      bioNombre: r.bio_nombre,
      bioTexto: r.bio_texto,
      testimonios: mapTestimonios(r.testimonios),
      ejemploTestimoniosQuitado: !!r.ejemplo_testimonios_quitado,
    },
    publicado: contenidoDesdeJson(r.publicado),
    publicadaAt: r.publicada_at,
    dominioSolicitado: r.dominio_solicitado,
    dominioToken: r.dominio_token,
    dominioSolicitadoAt: r.dominio_solicitado_at,
  };
}

const PAGINA_NUEVA: PaginaAcademia = {
  contenido: CONTENIDO_VACIO,
  publicado: null,
  publicadaAt: null,
  dominioSolicitado: null,
  dominioToken: null,
  dominioSolicitadoAt: null,
};

/** Página de la academia actual (vacía si aún no existe la fila). */
export async function getPagina(): Promise<PaginaAcademia> {
  const { tenant, db } = await requireCreadorContext();
  const { data, error } = await db.from("paginas_academia").select(COLS).eq("tenant_id", tenant.id).maybeSingle();
  if (error) throw error;
  return data ? mapPagina(data) : PAGINA_NUEVA;
}

/** Crea o actualiza la fila de la academia con las columnas dadas. */
async function escribir(filas: Record<string, unknown>, mensajeError: string): Promise<Resultado<PaginaAcademia>> {
  const { tenant, db } = await requireCreadorContext();
  const { data, error } = await db
    .from("paginas_academia")
    .upsert({ tenant_id: tenant.id, ...filas }, { onConflict: "tenant_id" })
    .select(COLS)
    .single();
  if (error) {
    console.error("[pagina] no se pudo guardar", error.code, error.message);
    return { ok: false, error: mensajeError };
  }
  return { ok: true, data: mapPagina(data) };
}

const COLUMNA: Record<keyof CambiosContenido, string> = {
  titulo: "titulo",
  bajada: "bajada",
  accion: "accion",
  cursosOcultos: "cursos_ocultos",
  bioNombre: "bio_nombre",
  bioTexto: "bio_texto",
  ejemploTestimoniosQuitado: "ejemplo_testimonios_quitado",
};

/** Guarda cambios del borrador (autoguardado del editor). */
export async function guardarContenido(cambios: CambiosContenido): Promise<Resultado<PaginaAcademia>> {
  const p = contenidoSchema.safeParse(cambios);
  if (!p.success) {
    const campos: Record<string, string> = {};
    for (const i of p.error.issues) campos[String(i.path[0])] = i.message;
    return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos.", campos };
  }
  if (p.data.accion === "conversacion") {
    return { ok: false, error: "«Agendar una conversación» todavía no está disponible.", campos: { accion: "Aún no disponible." } };
  }
  const filas: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.data)) filas[COLUMNA[k as keyof CambiosContenido]] = v;
  if (Object.keys(filas).length === 0) return { ok: true, data: await getPagina() };
  return escribir(filas, "No pudimos guardar los cambios. Inténtalo de nuevo.");
}

export async function elegirTemplate(template: ClaveTemplate): Promise<Resultado<PaginaAcademia>> {
  if (!esClaveTemplate(template)) return { ok: false, error: "Ese template no existe." };
  return escribir({ template }, "No pudimos guardar el template. Inténtalo de nuevo.");
}

/** Copia el borrador a `publicado`. Rechaza si quedan partes con contenido de ejemplo. */
export async function publicarPagina(): Promise<Resultado<PaginaAcademia>> {
  const actual = await getPagina();
  const pendientes = pendientesPagina(actual.contenido);
  if (pendientes.length) {
    return { ok: false, error: `Quedan ${pendientes.length} partes por completar antes de publicar.` };
  }
  const c = actual.contenido;
  const publicado = {
    ...c,
    testimonios: c.testimonios.map((t) => ({ nombre: t.nombre, texto: t.texto, autorizado_at: t.autorizadoAt })),
  };
  return escribir(
    { publicado, publicada_at: new Date().toISOString() },
    "No pudimos publicar la página. Tu borrador sigue guardado; inténtalo de nuevo.",
  );
}

export async function agregarTestimonio(input: { nombre: string; texto: string; autorizado: boolean }): Promise<Resultado<PaginaAcademia>> {
  const p = testimonioSchema.safeParse(input);
  if (!p.success) {
    const campos: Record<string, string> = {};
    for (const i of p.error.issues) campos[String(i.path[0])] = i.message;
    return { ok: false, error: p.error.issues[0]?.message ?? "Revisa el testimonio.", campos };
  }
  const actual = await getPagina();
  if (actual.contenido.testimonios.length >= TESTIMONIOS_MAX) return { ok: false, error: `Puedes mostrar hasta ${TESTIMONIOS_MAX} testimonios.` };
  const testimonios = [
    ...actual.contenido.testimonios.map((t) => ({ nombre: t.nombre, texto: t.texto, autorizado_at: t.autorizadoAt })),
    { nombre: p.data.nombre, texto: p.data.texto, autorizado_at: new Date().toISOString() },
  ];
  // Un testimonio real reemplaza a los de ejemplo.
  return escribir({ testimonios, ejemplo_testimonios_quitado: true }, "No pudimos guardar el testimonio. Inténtalo de nuevo.");
}

export async function quitarTestimonio(indice: number): Promise<Resultado<PaginaAcademia>> {
  const actual = await getPagina();
  if (!Number.isInteger(indice) || indice < 0 || indice >= actual.contenido.testimonios.length) {
    return { ok: false, error: "No encontramos ese testimonio." };
  }
  const testimonios = actual.contenido.testimonios
    .filter((_, i) => i !== indice)
    .map((t) => ({ nombre: t.nombre, texto: t.texto, autorizado_at: t.autorizadoAt }));
  return escribir({ testimonios }, "No pudimos quitar el testimonio. Inténtalo de nuevo.");
}

// ---------------------------------------------------------------- Foto de portada

/** Sube la foto a Storage ({tenant_id}/portada-<ts>.<ext}, bucket `logos`, ADR 021). */
export async function subirFotoPortada(archivo: File): Promise<Resultado<PaginaAcademia>> {
  const { tenant, db } = await requireCreadorContext();
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const mime = detectarMime(bytes);
  if (!mime || mime === "image/svg+xml") return { ok: false, error: "Formato no admitido o archivo dañado. Usa JPG, PNG o WebP." };
  const dim = dimensionesImagen(bytes, mime);
  if (!dim) return { ok: false, error: "No pudimos leer el tamaño de la foto. Prueba con otro archivo." };
  const err = validarMetaPortada({ tipo: mime, bytes: bytes.length, ancho: dim.ancho, alto: dim.alto });
  if (err) return { ok: false, error: err };

  const ruta = `${tenant.id}/portada-${Date.now()}.${LOGO_EXT[mime]}`;
  const subida = await db.storage.from("logos").upload(ruta, bytes, { contentType: mime, cacheControl: "31536000", upsert: false });
  if (subida.error) return { ok: false, error: "No pudimos subir la foto. Inténtalo de nuevo." };
  const { data: pub } = db.storage.from("logos").getPublicUrl(ruta);

  const anterior = (await getPagina()).contenido.fotoUrl;
  const r = await escribir({ foto_url: pub.publicUrl }, "No pudimos guardar la foto. Inténtalo de nuevo.");
  if (!r.ok) {
    await db.storage.from("logos").remove([ruta]);
    return r;
  }
  await borrarFotoSiNoSePublico(anterior, r.data);
  return r;
}

export async function quitarFotoPortada(): Promise<Resultado<PaginaAcademia>> {
  const anterior = (await getPagina()).contenido.fotoUrl;
  const r = await escribir({ foto_url: null }, "No pudimos quitar la foto. Inténtalo de nuevo.");
  if (r.ok) await borrarFotoSiNoSePublico(anterior, r.data);
  return r;
}

/** Borra la foto anterior del bucket solo si la versión publicada no la usa. */
async function borrarFotoSiNoSePublico(url: string | null, pagina: PaginaAcademia) {
  if (!url || pagina.publicado?.fotoUrl === url) return;
  const { tenant, db } = await requireCreadorContext();
  const marca = "/logos/";
  const i = url.indexOf(marca);
  if (i === -1) return;
  const ruta = decodeURIComponent(url.slice(i + marca.length).split("?")[0]);
  if (ruta.startsWith(`${tenant.id}/portada-`)) await db.storage.from("logos").remove([ruta]);
}

// ---------------------------------------------------------------- Dominio propio (concierge)

/** Guarda el dominio pedido y genera el token del registro TXT. El equipo lo conecta a mano (RQ-30). */
export async function solicitarDominio(dominio: string): Promise<Resultado<PaginaAcademia>> {
  const raiz = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "avantia.app";
  const v = validarDominio(dominio, raiz);
  if (!v.ok) return { ok: false, error: v.error, campos: { dominio: v.error } };
  const { tenant } = await requireCreadorContext();
  if (tenant.customDomain === v.dominio) return { ok: false, error: "Ese dominio ya está conectado a tu academia." };
  return escribir(
    { dominio_solicitado: v.dominio, dominio_token: randomBytes(12).toString("hex"), dominio_solicitado_at: new Date().toISOString() },
    "No pudimos registrar el dominio. Inténtalo de nuevo.",
  );
}

export async function cancelarSolicitudDominio(): Promise<Resultado<PaginaAcademia>> {
  return escribir(
    { dominio_solicitado: null, dominio_token: null, dominio_solicitado_at: null },
    "No pudimos cancelar la solicitud. Inténtalo de nuevo.",
  );
}