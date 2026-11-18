// Datos de la analítica de creadores en /admin (ADR 043). Solo staff: usa service role y por eso
// verifica `esStaff()` antes de leer. Sin tablas nuevas: todo se deriva de columnas existentes.
import { esStaff } from "../staff";
import { supabaseAdmin } from "../supabase/admin";
import { embudo, medianasDias, kpis, type ResumenAcademia } from "./embudoReglas";

const PAGINA = 1000;
/** Lee todas las filas paginando (PostgREST corta en 1000). Tope: 20 000 por consulta. */
async function todas<T>(q: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < 20; i++) {
    const { data, error } = await q(i * PAGINA, (i + 1) * PAGINA - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < PAGINA) break;
  }
  return out;
}

async function todosLosUsuarios() {
  const out: { id: string; email: string | null; last_sign_in_at: string | null }[] = [];
  for (let page = 1; page <= 25; page++) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    for (const u of users) out.push({ id: u.id, email: u.email ?? null, last_sign_in_at: u.last_sign_in_at ?? null });
    if (users.length < 200) break;
  }
  return out;
}

const menor = (a: string | null, b: string) => (a === null || b < a ? b : a);
const mayor = (a: string | null, b: string | null) => (b === null ? a : a === null || b > a ? b : a);

export async function cargarAnaliticaCreadores(ahora = Date.now()) {
  if (!(await esStaff())) throw new Error("No autorizado");
  const db = supabaseAdmin;
  const hace30 = new Date(ahora - 30 * 86_400_000).toISOString();

  const [tenants, membresias, usuarios, cursos, modulos, lecciones, paginas, inscripciones, pagos, alumnos, aceptadas] = await Promise.all([
    todas<{ id: string; nombre: string; subdomain: string; custom_domain: string | null; created_at: string; onboarding_completado_at: string | null; updated_at: string | null }>((d, h) =>
      db.from("tenants").select("id, nombre, subdomain, custom_domain, created_at, onboarding_completado_at, updated_at").order("created_at").range(d, h)),
    todas<{ user_id: string; tenant_id: string }>((d, h) => db.from("membresias").select("user_id, tenant_id").eq("rol", "dueno").range(d, h)),
    todosLosUsuarios(),
    todas<{ tenant_id: string; estado: string; created_at: string; published_at: string | null; updated_at: string | null }>((d, h) =>
      db.from("cursos").select("tenant_id, estado, created_at, published_at, updated_at").order("created_at").range(d, h)),
    todas<{ tenant_id: string; updated_at: string | null }>((d, h) => db.from("modulos").select("tenant_id, updated_at").order("updated_at", { ascending: false }).range(d, h)),
    todas<{ tenant_id: string; updated_at: string | null }>((d, h) => db.from("lecciones").select("tenant_id, updated_at").order("updated_at", { ascending: false }).range(d, h)),
    todas<{ tenant_id: string; updated_at: string | null }>((d, h) => db.from("paginas_academia").select("tenant_id, updated_at").range(d, h)),
    todas<{ tenant_id: string; alumno_id: string; estado: string; created_at: string }>((d, h) =>
      db.from("inscripciones").select("tenant_id, alumno_id, estado, created_at").order("created_at").range(d, h)),
    todas<{ tenant_id: string; created_at: string }>((d, h) => db.from("pagos").select("tenant_id, created_at").order("created_at").range(d, h)),
    todas<{ tenant_id: string; ultimo_ingreso_at: string | null }>((d, h) =>
      db.from("alumnos").select("tenant_id, ultimo_ingreso_at").gte("ultimo_ingreso_at", hace30).range(d, h)),
    db.from("postulaciones").select("id", { count: "exact", head: true }).eq("estado", "aceptada"),
  ]);

  const usuario = new Map(usuarios.map((u) => [u.id, u]));
  const dueno = new Map(membresias.map((m) => [m.tenant_id, usuario.get(m.user_id)]));

  const acum = new Map<string, ResumenAcademia>();
  for (const t of tenants) {
    const d = dueno.get(t.id);
    acum.set(t.id, {
      tenantId: t.id, nombre: t.nombre, subdomain: t.subdomain, dueno: d?.email ?? "—", creadaAt: t.created_at,
      onboardingAt: t.onboarding_completado_at, dominioPropio: !!t.custom_domain,
      cursosTotal: 0, cursosPublicados: 0, leccionesTotal: 0,
      primerCursoAt: null, primerPublicadoAt: null, primerAlumnoAt: null, primerPagoAt: null,
      alumnos: 0, alumnosActivos30: 0, ultimoLogin: d?.last_sign_in_at ?? null, ultimaEdicion: t.updated_at,
    });
  }
  for (const c of cursos) {
    const a = acum.get(c.tenant_id);
    if (!a) continue;
    a.cursosTotal++;
    a.primerCursoAt = menor(a.primerCursoAt, c.created_at);
    if (c.estado === "publicado") {
      a.cursosPublicados++;
      if (c.published_at) a.primerPublicadoAt = menor(a.primerPublicadoAt, c.published_at);
    }
    a.ultimaEdicion = mayor(a.ultimaEdicion, c.updated_at);
  }
  for (const m of modulos) {
    const a = acum.get(m.tenant_id);
    if (a) a.ultimaEdicion = mayor(a.ultimaEdicion, m.updated_at);
  }
  for (const l of lecciones) {
    const a = acum.get(l.tenant_id);
    if (!a) continue;
    a.leccionesTotal++;
    a.ultimaEdicion = mayor(a.ultimaEdicion, l.updated_at);
  }
  for (const p of paginas) {
    const a = acum.get(p.tenant_id);
    if (a) a.ultimaEdicion = mayor(a.ultimaEdicion, p.updated_at);
  }
  const activos = new Map<string, Set<string>>();
  for (const i of inscripciones) {
    const a = acum.get(i.tenant_id);
    if (!a) continue;
    a.primerAlumnoAt = menor(a.primerAlumnoAt, i.created_at);
    if (i.estado === "activa") {
      const s = activos.get(i.tenant_id) ?? new Set<string>();
      s.add(i.alumno_id);
      activos.set(i.tenant_id, s);
    }
  }
  for (const [tid, s] of activos) acum.get(tid)!.alumnos = s.size;
  for (const p of pagos) {
    const a = acum.get(p.tenant_id);
    if (a) a.primerPagoAt = menor(a.primerPagoAt, p.created_at);
  }
  for (const al of alumnos) {
    const a = acum.get(al.tenant_id);
    if (a) a.alumnosActivos30++;
  }

  const academias = [...acum.values()].sort((x, y) => (y.ultimoLogin ?? "").localeCompare(x.ultimoLogin ?? ""));
  return {
    academias,
    embudo: embudo(academias, aceptadas.count ?? 0),
    medianas: medianasDias(academias),
    kpis: kpis(academias, ahora),
    ahora,
  };
}
