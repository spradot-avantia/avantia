import { Badge } from "../../../../components/creador";
import { cambiarSuspensionCreadorAction } from "../../../../lib/admin/actions";
import { getUsuarioActual } from "../../../../lib/auth/usuario";
import { staffDeEnv } from "../../../../lib/staff";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

const AVISOS: Record<string, string> = {
  suspendido: "Cuenta suspendida: no podrá ingresar.",
  reactivado: "Cuenta reactivada.",
  no_a_ti: "No puedes suspender tu propia cuenta.",
  es_equipo: "No se puede suspender a alguien del equipo. Quítalo primero en Equipo.",
  error: "No pudimos completar la acción. Inténtalo de nuevo.",
};

const POR_PAGINA = 200;

// Cuentas de creadores (Supabase Auth) con su academia y el estado de su postulación.
// Solo staff (layout). Las cuentas del equipo se muestran pero no se pueden suspender.
export default async function AdminCreadoresPage({ searchParams }: { searchParams: { aviso?: string } }) {
  const [{ data: lista, error }, { data: membresias }, { data: tenants }, { data: postulaciones }, { data: staff }, yo] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: POR_PAGINA }),
    supabaseAdmin.from("membresias").select("user_id, tenant_id"),
    supabaseAdmin.from("tenants").select("id, nombre, subdomain"),
    supabaseAdmin.from("postulaciones").select("email, estado"),
    supabaseAdmin.from("staff").select("email"),
    getUsuarioActual(),
  ]);

  const academiaDe = new Map<string, { nombre: string; subdomain: string }>();
  const tenantPorId = new Map((tenants ?? []).map((t) => [t.id, t]));
  for (const m of membresias ?? []) {
    const t = tenantPorId.get(m.tenant_id);
    if (t) academiaDe.set(m.user_id, t);
  }
  const estadoPost = new Map((postulaciones ?? []).map((p) => [p.email.toLowerCase(), p.estado]));
  const equipo = new Set([...(staff ?? []).map((s) => s.email), ...staffDeEnv()]);

  const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
  const usuarios = lista?.users ?? [];
  const aviso = searchParams.aviso ? AVISOS[searchParams.aviso] : undefined;

  return (
    <>
      <h1 className="ad-h1">Creadores</h1>
      <p className="ad-lede">Cuentas registradas en la plataforma. Suspender impide el ingreso sin borrar la academia ni sus datos.</p>
      {aviso && <p className="ad-msg" role="status">{aviso}</p>}

      {error ? (
        <p className="ad-msg">No se pudo consultar Supabase Auth: {error.message}</p>
      ) : usuarios.length === 0 ? (
        <p className="ad-empty">Todavía no hay cuentas.</p>
      ) : (
        <div className="ad-list">
          {usuarios.map((u) => {
            const email = (u.email ?? "").toLowerCase();
            const esEquipo = equipo.has(email);
            const suspendido = !!u.banned_until && new Date(u.banned_until) > new Date();
            const academia = academiaDe.get(u.id);
            const post = estadoPost.get(email);
            const nombre = (u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.user_metadata?.nombre) as string | undefined;
            return (
              <article key={u.id} className="ad-row">
                <div className="ad-row__head">
                  <div>
                    <div className="ad-row__title">{nombre || u.email}</div>
                    {nombre && <div className="ad-row__sub">{u.email}</div>}
                  </div>
                  <div className="ad-actions">
                    {esEquipo && <Badge tono="info">Equipo</Badge>}
                    {suspendido ? <Badge tono="warning">Suspendido</Badge> : <Badge tono="ok">Activo</Badge>}
                  </div>
                </div>
                <div className="ad-meta">
                  <span>Academia: {academia ? `${academia.nombre} (${academia.subdomain})` : "aún sin academia"}</span>
                  <span>Postulación: {esEquipo ? "—" : (post ?? "sin postulación")}</span>
                  <span>Alta {fecha.format(new Date(u.created_at))}</span>
                  <span>Último ingreso {u.last_sign_in_at ? fecha.format(new Date(u.last_sign_in_at)) : "nunca"}</span>
                </div>
                {!esEquipo && u.id !== yo?.id && (
                  <div className="ad-actions">
                    <form action={cambiarSuspensionCreadorAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="accion" value={suspendido ? "reactivar" : "suspender"} />
                      <button type="submit" className={`av-btn cr-btn ${suspendido ? "av-btn--secondary" : "cr-btn--danger"}`}>
                        {suspendido ? "Reactivar cuenta" : "Suspender cuenta"}
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {usuarios.length >= POR_PAGINA && <p className="ad-row__sub">Se muestran las primeras {POR_PAGINA} cuentas.</p>}
    </>
  );
}
