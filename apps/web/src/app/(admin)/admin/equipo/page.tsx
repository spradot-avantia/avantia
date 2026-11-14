import { BotonConfirmar } from "../../../../components/admin/BotonConfirmar";
import { Badge } from "../../../../components/creador";
import { agregarStaffAction, quitarStaffAction } from "../../../../lib/admin/actions";
import { getUsuarioActual } from "../../../../lib/auth/usuario";
import { staffDeEnv } from "../../../../lib/staff";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

const AVISOS: Record<string, string> = {
  agregado: "Listo: esa persona ya es del equipo. Entra con ese correo (cuenta nueva o existente).",
  ya_era: "Esa persona ya estaba en el equipo; no cambió nada.",
  quitado: "Persona quitada del equipo.",
  correo_invalido: "Escribe un correo válido.",
  no_a_ti: "No puedes quitarte a ti mismo del equipo.",
  ultimo: "Debe quedar al menos una persona en el equipo.",
  error: "No pudimos completar la acción. Inténtalo de nuevo.",
};

// Equipo de Avantia (rol staff, ADR 016). Los correos de STAFF_EMAILS son el arranque:
// se vuelven a sembrar al ingresar, por eso se quitan editando la variable de entorno.
export default async function AdminEquipoPage({ searchParams }: { searchParams: { aviso?: string } }) {
  const [{ data, error }, yo] = await Promise.all([
    supabaseAdmin.from("staff").select("email, created_at, created_by").order("created_at", { ascending: true }),
    getUsuarioActual(),
  ]);
  const env = new Set(staffDeEnv());
  const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
  const aviso = searchParams.aviso ? AVISOS[searchParams.aviso] : undefined;

  return (
    <>
      <h1 className="ad-h1">Equipo</h1>
      <p className="ad-lede">Quienes administran Avantia: entran a esta zona y pueden crear academias sin postulación.</p>
      {aviso && <p className="ad-msg" role="status">{aviso}</p>}

      <form action={agregarStaffAction} className="ad-form">
        <label htmlFor="staff-email" className="sr-only" style={{ position: "absolute", left: -9999 }}>
          Correo de la persona
        </label>
        <input id="staff-email" name="email" type="email" required maxLength={200} placeholder="correo@goavantia.com" className="cr-input" autoComplete="off" />
        <button type="submit" className="av-btn av-btn--primary cr-btn">Agregar al equipo</button>
      </form>

      {error ? (
        <p className="ad-msg">No se pudo consultar Supabase: {error.message}</p>
      ) : !data || data.length === 0 ? (
        <p className="ad-empty">Aún no hay personas registradas en la tabla (se siembran al ingresar quienes figuran en STAFF_EMAILS).</p>
      ) : (
        <div className="ad-list">
          {data.map((s) => {
            const fijo = env.has(s.email);
            const soyYo = yo?.email?.toLowerCase() === s.email;
            return (
              <article key={s.email} className="ad-row">
                <div className="ad-row__head">
                  <div>
                    <div className="ad-row__title">{s.email}</div>
                    <div className="ad-row__sub">
                      Desde {fecha.format(new Date(s.created_at))}
                      {s.created_by ? ` · agregado por ${s.created_by}` : ""}
                    </div>
                  </div>
                  <div className="ad-actions">
                    {soyYo && <Badge tono="info">Tú</Badge>}
                    {fijo && <Badge tono="neutral">En STAFF_EMAILS</Badge>}
                  </div>
                </div>
                {!soyYo && !fijo && (
                  <div className="ad-actions">
                    <form action={quitarStaffAction}>
                      <input type="hidden" name="email" value={s.email} />
                      <BotonConfirmar className="av-btn cr-btn cr-btn--danger" mensaje={`¿Quitar a ${s.email} del equipo? Perderá el acceso a /admin.`}>
                        Quitar del equipo
                      </BotonConfirmar>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
