import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveTenantByHostname } from "../../../../../lib/tenant/resolve";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
import { MarcaSitio } from "../../../../../components/sitio/partes";
import "../../../../../components/sitio/sitio.css";

function formatPrecio(centavos: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(centavos / 100);
}

export default async function CursoVentaPage({
  params,
}: {
  params: { domain: string; slug: string };
}) {
  const tenant = await resolveTenantByHostname(params.domain);
  if (!tenant) {
    notFound();
  }

  // Filtro explícito por tenant_id además de RLS (ver docs/arquitectura):
  // nunca alcanza con el slug solo, porque dos academias distintas pueden
  // tener cursos con el mismo slug.
  const { data: curso } = await supabaseAdmin
    .from("cursos")
    .select("titulo, descripcion, precio_centavos")
    .eq("tenant_id", tenant.id)
    .eq("slug", params.slug)
    .maybeSingle();

  if (!curso) {
    notFound();
  }

  return (
    <section>
      {/* El layout ya no pone encabezado (ADR 018): la ficha muestra la marca de la academia. */}
      <div className="st">
        <header className="st-barra">
          <Link href="/" style={{ textDecoration: "none" }}>
            <MarcaSitio
              academia={{ nombre: tenant.nombre, frase: null, colorPrimario: tenant.theme.colorPrimario, logoUrl: tenant.theme.logoUrl, logoModo: "logo_y_nombre" }}
            />
          </Link>
        </header>
      </div>
      <h1 style={{ color: tenant.theme.colorPrimario }}>{curso.titulo}</h1>
      {curso.descripcion && <p>{curso.descripcion}</p>}
      <p>
        <strong>{formatPrecio(curso.precio_centavos)}</strong>
      </p>
    </section>
  );
}