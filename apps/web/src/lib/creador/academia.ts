// Repo de la academia: marca y onboarding. Filtra siempre por tenant.id.
import { COLUMNAS_TENANT, mapTenant, requireCreadorContext } from "./tenantActual";
import type { Resultado, TenantCreador } from "./types";
import { LOGO_EXT, inspeccionarLogo, marcaSchema } from "./validacion";

export async function getAcademia(): Promise<TenantCreador> {
  return (await requireCreadorContext()).tenant;
}

export interface MarcaInput {
  nombre?: string;
  frase?: string;
  area?: string;
  colorPrimario?: string;
  logoModo?: "logo_y_nombre" | "solo_logo";
  pais?: string;
  moneda?: string;
}

function aFilas(d: MarcaInput): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (d.nombre !== undefined) f.nombre = d.nombre;
  if (d.frase !== undefined) f.frase = d.frase || null;
  if (d.area !== undefined) f.area = d.area || null;
  if (d.colorPrimario !== undefined) f.color_primario = d.colorPrimario.toLowerCase();
  if (d.logoModo !== undefined) f.logo_modo = d.logoModo;
  if (d.pais !== undefined) f.pais = d.pais || null;
  if (d.moneda !== undefined) f.moneda = d.moneda || null;
  return f;
}

/** Actualiza campos de marca (nombre, frase, area, color, modo del logo...). */
export async function actualizarMarca(input: MarcaInput): Promise<Resultado<TenantCreador>> {
  const { tenant, db } = await requireCreadorContext();
  const p = marcaSchema.safeParse(input);
  if (!p.success) {
    const campos: Record<string, string> = {};
    for (const i of p.error.issues) campos[String(i.path[0])] = i.message;
    return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos.", campos };
  }
  const filas = aFilas(p.data);
  if (Object.keys(filas).length === 0) return { ok: true, data: tenant };
  const { data, error } = await db
    .from("tenants")
    .update(filas)
    .eq("id", tenant.id)
    .select(COLUMNAS_TENANT)
    .single();
  if (error) return { ok: false, error: "No pudimos guardar los cambios. Inténtalo de nuevo." };
  return { ok: true, data: mapTenant(data) };
}

/** Paso final del onboarding: guarda marca y marca el onboarding como completado. */
export async function completarOnboarding(input: MarcaInput): Promise<Resultado<TenantCreador>> {
  const r = await actualizarMarca(input);
  if (!r.ok) return r;
  const { tenant, db } = await requireCreadorContext();
  const { data, error } = await db
    .from("tenants")
    .update({ onboarding_completado_at: new Date().toISOString() })
    .eq("id", tenant.id)
    .select(COLUMNAS_TENANT)
    .single();
  if (error) return { ok: false, error: "No pudimos terminar la configuración. Inténtalo de nuevo." };
  return { ok: true, data: mapTenant(data) };
}

/**
 * Sube el logo a Storage ({tenant_id}/logo-<ts>.<ext>), tras validar bytes,
 * tipo real, tamaño, dimensiones y sanitizar SVG (ADR 005).
 */
export async function subirLogo(archivo: File): Promise<Resultado<TenantCreador>> {
  const { tenant, db } = await requireCreadorContext();
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const r = inspeccionarLogo(bytes, archivo.type);
  if (!r.ok) return { ok: false, error: r.error };

  const ruta = `${tenant.id}/logo-${Date.now()}.${LOGO_EXT[r.mime]}`;
  const subida = await db.storage.from("logos").upload(ruta, r.bytes, {
    contentType: r.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (subida.error) return { ok: false, error: "No pudimos subir el logo. Inténtalo de nuevo." };

  const { data: pub } = db.storage.from("logos").getPublicUrl(ruta);
  const anterior = rutaDesdeUrl(tenant.logoUrl, tenant.id);
  const { data, error } = await db
    .from("tenants")
    .update({ logo_url: pub.publicUrl, logo_modo: r.modoSugerido })
    .eq("id", tenant.id)
    .select(COLUMNAS_TENANT)
    .single();
  if (error) {
    await db.storage.from("logos").remove([ruta]);
    return { ok: false, error: "No pudimos guardar el logo. Inténtalo de nuevo." };
  }
  if (anterior) await db.storage.from("logos").remove([anterior]);
  return { ok: true, data: mapTenant(data) };
}

export async function quitarLogo(): Promise<Resultado<TenantCreador>> {
  const { tenant, db } = await requireCreadorContext();
  const anterior = rutaDesdeUrl(tenant.logoUrl, tenant.id);
  const { data, error } = await db
    .from("tenants")
    .update({ logo_url: null, logo_modo: "logo_y_nombre" })
    .eq("id", tenant.id)
    .select(COLUMNAS_TENANT)
    .single();
  if (error) return { ok: false, error: "No pudimos quitar el logo. Inténtalo de nuevo." };
  if (anterior) await db.storage.from("logos").remove([anterior]);
  return { ok: true, data: mapTenant(data) };
}

/** Extrae la ruta del objeto solo si pertenece a la carpeta del tenant. */
function rutaDesdeUrl(url: string | null, tenantId: string): string | null {
  if (!url) return null;
  const marca = "/logos/";
  const i = url.indexOf(marca);
  if (i === -1) return null;
  const ruta = decodeURIComponent(url.slice(i + marca.length).split("?")[0]);
  return ruta.startsWith(`${tenantId}/`) ? ruta : null;
}
