import Link from "next/link";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { cambiarEstadoPostulacionAction } from "../../../../lib/postulacion/actions";
import { RANGOS_ALUMNOS } from "../../../../lib/postulacion/validacion";
import styles from "../../dashboard.module.css";

export const dynamic = "force-dynamic";

const ACCIONES = [
  { estado: "aceptada", label: "Aceptar e invitar" },
  { estado: "contactada", label: "Contactada" },
  { estado: "lista_espera", label: "Lista de espera" },
  { estado: "descartada", label: "Descartar" },
] as const;

// Postulaciones al programa fundador (ADR 011 y 014). Tabla de plataforma, sin
// tenant: el layout de /admin ya restringe a staff (esStaff) y por eso se lee
// con service role. El enlace del postulante se muestra como texto, no como
// <a>, porque viene sin validar del formulario.
export default async function AdminPostulacionesPage() {
  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .select("id, created_at, nombre, email, descripcion, url, alumnos, estado, invitado_en")
    .order("created_at", { ascending: false })
    .limit(500);

  const rango = (v: string | null) => RANGOS_ALUMNOS.find((r) => r.value === v)?.label ?? "—";
  const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" });

  return (
    <section>
      <h1>Postulaciones</h1>
      <p>
        <Link href="/admin">Volver a academias</Link>
      </p>
      {error ? (
        <p>No se pudo consultar Supabase: {error.message}</p>
      ) : !data || data.length === 0 ? (
        <p>Todavía no hay postulaciones.</p>
      ) : (
        <div className={styles.card} style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>A qué se dedica</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{fecha.format(new Date(p.created_at))}</td>
                  <td>{p.nombre}</td>
                  <td><a href={`mailto:${p.email}`}>{p.email}</a></td>
                  <td style={{ overflowWrap: "anywhere", minWidth: 220 }}>
                    {p.descripcion ?? "—"}
                    {(p.url || p.alumnos) && (
                      <small style={{ display: "block" }}>
                        {p.url ?? ""} {p.alumnos ? `· ${rango(p.alumnos)} alumnos al año` : ""}
                      </small>
                    )}
                  </td>
                  <td>
                    {p.estado}
                    {p.invitado_en && <small style={{ display: "block" }}>Invitado {fecha.format(new Date(p.invitado_en))}</small>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ACCIONES.filter((a) => a.estado !== p.estado || a.estado === "aceptada").map((a) => (
                        <form key={a.estado} action={cambiarEstadoPostulacionAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="estado" value={a.estado} />
                          <button type="submit">{a.estado === "aceptada" && p.estado === "aceptada" ? "Reenviar invitación" : a.label}</button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
