import Link from "next/link";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { RANGOS_ALUMNOS } from "../../../../lib/postulacion/validacion";
import styles from "../../dashboard.module.css";

export const dynamic = "force-dynamic";

// Postulaciones al programa fundador (ADR 011). Tabla de plataforma, sin
// tenant: el layout de /admin ya restringe a staff (esStaff) y por eso se lee
// con service role. El enlace del postulante se muestra como texto, no como
// <a>, porque viene sin validar del formulario.
export default async function AdminPostulacionesPage() {
  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .select("id, created_at, nombre, email, url, alumnos, estado")
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
                <th>LinkedIn o web</th>
                <th>Alumnos al año</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{fecha.format(new Date(p.created_at))}</td>
                  <td>{p.nombre}</td>
                  <td><a href={`mailto:${p.email}`}>{p.email}</a></td>
                  <td style={{ overflowWrap: "anywhere" }}>{p.url ?? "—"}</td>
                  <td>{rango(p.alumnos)}</td>
                  <td>{p.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
