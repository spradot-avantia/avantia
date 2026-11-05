// Lectura del sitio público de una academia (ADR 021). Corre solo en el
// servidor, sin sesión del visitante: usa service role y por eso está en la
// lista blanca de scripts/check-admin-imports.mjs. TODA consulta filtra por
// tenant_id y solo lee lo publicado (columna `publicado`, cursos publicados).
import { contenidoDesdeJson, type ContenidoPagina } from "../creador/paginaReglas";
import { supabaseAdmin } from "../supabase/admin";
import { formaDe, tipografiaDe } from "../tenant/identidad";
import { formatearPrecio, type AcademiaSitio, type CursoSitio } from "./tipos";

export interface SitioAcademia {
  academia: AcademiaSitio;
  /** null si la academia todavía no publica su página. */
  publicado: ContenidoPagina | null;
  cursos: CursoSitio[];
}

function contar(filas: { curso_id: string }[] | null) {
  const m = new Map<string, number>();
  for (const f of filas ?? []) m.set(f.curso_id, (m.get(f.curso_id) ?? 0) + 1);
  return m;
}

export async function getSitioAcademia(tenantId: string): Promise<SitioAcademia | null> {
  const [t, p, c] = await Promise.all([
    supabaseAdmin.from("tenants").select("nombre, frase, color_primario, logo_url, logo_modo, tipografia, forma, moneda").eq("id", tenantId).maybeSingle(),
    supabaseAdmin.from("paginas_academia").select("publicado").eq("tenant_id", tenantId).maybeSingle(),
    supabaseAdmin
      .from("cursos")
      .select("id, slug, titulo, descripcion, modalidad, fecha_inicio, precio_centavos")
      .eq("tenant_id", tenantId)
      .eq("estado", "publicado")
      .order("published_at", { ascending: true }),
  ]);
  if (t.error || !t.data) return null;
  const tenant = t.data;

  const ids = (c.data ?? []).map((x) => x.id);
  const [mods, lecs] = ids.length
    ? await Promise.all([
        supabaseAdmin.from("modulos").select("curso_id").eq("tenant_id", tenantId).in("curso_id", ids),
        supabaseAdmin.from("lecciones").select("curso_id").eq("tenant_id", tenantId).in("curso_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const cm = contar(mods.data);
  const cl = contar(lecs.data);

  return {
    academia: {
      nombre: t.data.nombre,
      frase: t.data.frase,
      colorPrimario: t.data.color_primario ?? "#2563eb",
      logoUrl: t.data.logo_url,
      logoModo: t.data.logo_modo === "solo_logo" ? "solo_logo" : "logo_y_nombre",
      tipografia: tipografiaDe(t.data.tipografia),
      forma: formaDe(t.data.forma),
    },
    publicado: p.error ? null : contenidoDesdeJson(p.data?.publicado),
    cursos: (c.data ?? []).map((x) => ({
      id: x.id,
      slug: x.slug,
      titulo: x.titulo,
      descripcion: x.descripcion,
      modalidad: x.modalidad === "con_fechas" ? "con_fechas" : "a_su_ritmo",
      fechaInicio: x.fecha_inicio,
      precio: formatearPrecio(x.precio_centavos, tenant.moneda),
      totalModulos: cm.get(x.id) ?? 0,
      totalLecciones: cl.get(x.id) ?? 0,
    })),
  };
}