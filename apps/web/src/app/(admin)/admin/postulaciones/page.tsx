import Link from "next/link";
import { Badge } from "../../../../components/creador";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { cambiarEstadoPostulacionAction } from "../../../../lib/postulacion/actions";
import { RANGOS_ALUMNOS } from "../../../../lib/postulacion/validacion";

export const dynamic = "force-dynamic";

const ESTADOS = [
  { value: "nueva", label: "Nuevas", tono: "info" },
  { value: "contactada", label: "Contactadas", tono: "info" },
  { value: "aceptada", label: "Aceptadas", tono: "ok" },
  { value: "lista_espera", label: "Lista de espera", tono: "warning" },
  { value: "descartada", label: "Rechazadas", tono: "neutral" },
] as const;

type Estado = (typeof ESTADOS)[number]["value"];

// Acciones por estado actual. "Rechazar" guarda 'descartada'; rechazar a alguien
// ya aceptado le quita el acceso (se revisa en cada ingreso, ADR 015).
function accionesPara(estado: Estado) {
  const todas = [
    { estado: "aceptada", label: estado === "aceptada" ? "Reenviar invitación" : "Aceptar e invitar", primaria: true },
    { estado: "contactada", label: "Marcar contactada" },
    { estado: "lista_espera", label: "Lista de espera" },
    { estado: "descartada", label: estado === "aceptada" ? "Revocar acceso" : "Rechazar", peligro: true },
  ] as const;
  return todas.filter((a) => a.estado === "aceptada" || a.estado !== estado);
}

// Postulaciones al programa fundador (ADR 011/014). Tabla de plataforma sin
// tenant: el layout de /admin ya restringe a staff, por eso se lee con service role.
// El enlace del postulante se muestra como texto porque viene sin validar.
export default async function AdminPostulacionesPage({ searchParams }: { searchParams: { estado?: string } }) {
  const filtro = ESTADOS.find((e) => e.value === searchParams.estado)?.value;

  let q = supabaseAdmin
    .from("postulaciones")
    .select("id, created_at, nombre, email, descripcion, url, alumnos, estado, invitado_en")
    .order("created_at", { ascending: false })
    .limit(500);
  if (filtro) q = q.eq("estado", filtro);
  const [{ data, error }, { data: todas }] = await Promise.all([q, supabaseAdmin.from("postulaciones").select("estado").limit(5000)]);

  const cuentas = new Map<string, number>();
  for (const p of todas ?? []) cuentas.set(p.estado, (cuentas.get(p.estado) ?? 0) + 1);

  const rango = (v: string | null) => RANGOS_ALUMNOS.find((r) => r.value === v)?.label ?? "—";
  const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" });

  return (
    <>
      <h1 className="ad-h1">Postulaciones</h1>
      <p className="ad-lede">
        Al aceptar, el postulante recibe un correo para crear su cuenta. Solo las personas aceptadas pueden registrarse e ingresar.
      </p>

      <nav className="ad-filters" aria-label="Filtrar por estado">
        <Link href="/admin/postulaciones" className="ad-chip" aria-current={!filtro}>
          Todas ({todas?.length ?? 0})
        </Link>
        {ESTADOS.map((e) => (
          <Link key={e.value} href={`/admin/postulaciones?estado=${e.value}`} className="ad-chip" aria-current={filtro === e.value}>
            {e.label} ({cuentas.get(e.value) ?? 0})
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="ad-msg">No se pudo consultar Supabase: {error.message}</p>
      ) : !data || data.length === 0 ? (
        <p className="ad-empty">No hay postulaciones{filtro ? " en este estado" : " todavía"}.</p>
      ) : (
        <div className="ad-list">
          {data.map((p) => {
            const est = ESTADOS.find((e) => e.value === p.estado);
            return (
              <article key={p.id} className="ad-row">
                <div className="ad-row__head">
                  <div>
                    <div className="ad-row__title">{p.nombre}</div>
                    <a className="ad-row__sub" href={`mailto:${p.email}`}>{p.email}</a>
                  </div>
                  <Badge tono={est?.tono ?? "neutral"}>{est?.label.replace(/s$/, "") ?? p.estado}</Badge>
                </div>
                {p.descripcion && <p className="ad-row__body">{p.descripcion}</p>}
                <div className="ad-meta">
                  <span>Postuló {fecha.format(new Date(p.created_at))}</span>
                  {p.invitado_en && <span>Invitado {fecha.format(new Date(p.invitado_en))}</span>}
                  {p.url && <span>{p.url}</span>}
                  {p.alumnos && <span>{rango(p.alumnos)} alumnos al año</span>}
                </div>
                <div className="ad-actions">
                  {accionesPara(p.estado as Estado).map((a) => (
                    <form key={a.estado} action={cambiarEstadoPostulacionAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="estado" value={a.estado} />
                      <button
                        type="submit"
                        className={`av-btn cr-btn ${"primaria" in a ? "av-btn--primary" : "peligro" in a ? "cr-btn--danger" : "av-btn--secondary"}`}
                      >
                        {a.label}
                      </button>
                    </form>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
