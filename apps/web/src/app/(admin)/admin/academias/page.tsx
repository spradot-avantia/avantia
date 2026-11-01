import Link from "next/link";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

// Academias (tenants) de la plataforma. Única pantalla que lista tenants sin filtrar
// por tenant_id: es intencional, la usa el equipo de Avantia (ADR 017).
export default async function AdminAcademiasPage() {
  const [{ data: tenants, error }, { data: cursos }, { data: membresias }, { data: lista }] = await Promise.all([
    supabaseAdmin.from("tenants").select("id, nombre, subdomain, custom_domain, created_at").order("created_at", { ascending: false }),
    supabaseAdmin.from("cursos").select("tenant_id").limit(20000),
    supabaseAdmin.from("membresias").select("user_id, tenant_id").eq("rol", "dueno"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const cursosPor = new Map<string, number>();
  for (const c of cursos ?? []) cursosPor.set(c.tenant_id, (cursosPor.get(c.tenant_id) ?? 0) + 1);
  const correoPorUsuario = new Map((lista?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const duenoPor = new Map((membresias ?? []).map((m) => [m.tenant_id, correoPorUsuario.get(m.user_id) ?? "—"]));
  const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
  const raiz = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "avantia.app";

  return (
    <>
      <h1 className="ad-h1">Academias</h1>
      <p className="ad-lede">Todas las academias creadas en la plataforma.</p>
      {error ? (
        <p className="ad-msg">No se pudo consultar Supabase: {error.message}</p>
      ) : !tenants || tenants.length === 0 ? (
        <p className="ad-empty">Todavía no hay academias.</p>
      ) : (
        <div className="ad-list">
          {tenants.map((t) => (
            <article key={t.id} className="ad-row">
              <div className="ad-row__head">
                <div>
                  <div className="ad-row__title">{t.nombre}</div>
                  <div className="ad-row__sub">{t.custom_domain ?? `${t.subdomain}.${raiz}`}</div>
                </div>
                <strong>{cursosPor.get(t.id) ?? 0} curso{(cursosPor.get(t.id) ?? 0) === 1 ? "" : "s"}</strong>
              </div>
              <div className="ad-meta">
                <span>Dueño: {duenoPor.get(t.id) ?? "—"}</span>
                <span>Creada {fecha.format(new Date(t.created_at))}</span>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="ad-row__sub" style={{ marginTop: "var(--av-space-4)" }}>
        <Link href="/configuracion/dominio">Configurar dominio de una academia</Link>
      </p>
    </>
  );
}
