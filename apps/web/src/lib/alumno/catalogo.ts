// Lectura de cursos para el sitio público y el player del alumno.
// Service role con .eq("tenant_id", tenantId) en cada query (ADR 018).
import { supabaseAdmin } from "../supabase/admin";
import { mapCurso, mapLeccion } from "../creador/cursos";
import type { CursoCompleto, Curso } from "../creador/types";

const COLS_CURSO =
  "id, slug, titulo, descripcion, publico, estado, modalidad, fecha_inicio, fecha_termino, acceso, published_at, created_at, updated_at";

export interface CursoParaAlumno extends CursoCompleto {
  /** dia_liberacion por lección (ADR 004); null = disponible desde el inicio. */
  diaLiberacion: Map<string, number | null>;
}

export interface CursoListado extends Curso {
  totalModulos: number;
  totalLecciones: number;
}

export async function listarCursosPublicados(tenantId: string): Promise<CursoListado[]> {
  const { data: cursos } = await supabaseAdmin
    .from("cursos")
    .select(COLS_CURSO)
    .eq("tenant_id", tenantId)
    .eq("estado", "publicado")
    .order("published_at", { ascending: false });
  if (!cursos?.length) return [];
  const ids = cursos.map((c) => c.id);
  const [mods, lecs] = await Promise.all([
    supabaseAdmin.from("modulos").select("curso_id").eq("tenant_id", tenantId).in("curso_id", ids),
    supabaseAdmin.from("lecciones").select("curso_id").eq("tenant_id", tenantId).in("curso_id", ids),
  ]);
  const contar = (filas: { curso_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const f of filas ?? []) m.set(f.curso_id, (m.get(f.curso_id) ?? 0) + 1);
    return m;
  };
  const cm = contar(mods.data);
  const cl = contar(lecs.data);
  return cursos.map((c) => ({ ...mapCurso(c), totalModulos: cm.get(c.id) ?? 0, totalLecciones: cl.get(c.id) ?? 0 }));
}

/**
 * Curso completo (objetivos, módulos y lecciones ordenados). `soloPublicado`
 * debe ser true en todo lo que ve un estudiante.
 */
export async function cargarCurso(
  tenantId: string,
  filtro: { id: string } | { slug: string },
  soloPublicado = true,
): Promise<CursoParaAlumno | null> {
  let q = supabaseAdmin.from("cursos").select(COLS_CURSO).eq("tenant_id", tenantId);
  q = "id" in filtro ? q.eq("id", filtro.id) : q.eq("slug", filtro.slug);
  if (soloPublicado) q = q.eq("estado", "publicado");
  const { data: c } = await q.maybeSingle();
  if (!c) return null;

  const [obj, mods, lecs] = await Promise.all([
    supabaseAdmin.from("curso_objetivos").select("texto, orden").eq("tenant_id", tenantId).eq("curso_id", c.id).order("orden"),
    supabaseAdmin.from("modulos").select("id, curso_id, titulo, orden, descripcion, objetivos, duracion_min").eq("tenant_id", tenantId).eq("curso_id", c.id).order("orden"),
    supabaseAdmin
      .from("lecciones")
      .select("id, modulo_id, curso_id, titulo, tipo, contenido_url, contenido_texto, storage_path, contenido_tipo, archivo_nombre, bytes, descripcion, duracion_min, orden, dia_liberacion")
      .eq("tenant_id", tenantId)
      .eq("curso_id", c.id)
      .order("orden"),
  ]);

  const dia = new Map<string, number | null>();
  const porModulo = new Map<string, ReturnType<typeof mapLeccion>[]>();
  for (const l of lecs.data ?? []) {
    dia.set(l.id, l.dia_liberacion ?? null);
    const lista = porModulo.get(l.modulo_id) ?? [];
    // La ruta interna del bucket nunca viaja en lo que ve el alumno: queda `archivoNombre`.
    lista.push({ ...mapLeccion(l), storagePath: null });
    porModulo.set(l.modulo_id, lista);
  }
  return {
    ...mapCurso(c),
    objetivos: (obj.data ?? []).map((o) => o.texto as string),
    modulos: (mods.data ?? []).map((m) => ({
      id: m.id,
      cursoId: m.curso_id,
      titulo: m.titulo,
      orden: m.orden,
      descripcion: m.descripcion ?? null,
      objetivos: Array.isArray(m.objetivos) ? (m.objetivos as string[]) : [],
      duracionMin: m.duracion_min ?? null,
      lecciones: porModulo.get(m.id) ?? [],
      materiales: [], // F3: la vista del alumno los leerá
    })),
    diaLiberacion: dia,
  };
}

/** Lecciones del curso en orden de recorrido (módulo, luego lección). */
export function leccionesEnOrden(curso: CursoCompleto) {
  return curso.modulos.flatMap((m, mi) => m.lecciones.map((l, li) => ({ ...l, moduloTitulo: m.titulo, moduloNum: mi + 1, num: li + 1 })));
}
