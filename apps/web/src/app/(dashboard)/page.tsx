import Link from "next/link";
import { supabaseAdmin } from "../../lib/supabase/admin";
import styles from "./dashboard.module.css";

// Datos cambian por afuera de Next.js (altas de tenants/cursos), así que
// nunca debe quedar prerenderizada de forma estática en el build.
export const dynamic = "force-dynamic";

// Panel interno de Avantia (la empresa), no de una academia puntual: por eso
// es la única pantalla del proyecto que lista tenants sin filtrar por
// tenant_id — es intencional, ver Supuestos_y_Pendientes.md. Mientras no
// haya auth, este mismo host de panel también sirve las páginas de cada
// academia (ej. configuración de dominio), sin distinción de rol todavía.
export default async function HomePage() {
  const { data: tenants, error } = await supabaseAdmin
    .from("tenants")
    .select("id, nombre, subdomain, custom_domain")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <section>
        <h1>Academias</h1>
        <p>No se pudo consultar Supabase: {error.message}</p>
      </section>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <section>
        <h1>Academias</h1>
        <p>
          Todavía no hay academias cargadas. Corré <code>npm run db:seed</code>{" "}
          para tener datos de prueba.
        </p>
      </section>
    );
  }

  const cursosPorTenant = await Promise.all(
    tenants.map(async (tenant) => {
      const { count } = await supabaseAdmin
        .from("cursos")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);
      return count ?? 0;
    })
  );

  return (
    <section>
      <h1>Academias</h1>
      <div className={styles.card}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dominio</th>
              <th>Cursos</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant, i) => (
              <tr key={tenant.id}>
                <td>{tenant.nombre}</td>
                <td>{tenant.custom_domain ?? `${tenant.subdomain}.avantia.app`}</td>
                <td>{cursosPorTenant[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/configuracion/dominio">Configurar dominio</Link>
      </p>
    </section>
  );
}
