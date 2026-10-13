import { resolveTenantBySlug } from "../../../../lib/tenant/resolve";
import { DomainForm } from "./DomainForm";

// Depende de DEMO_TENANT_SLUG leído en cada request; no debe quedar
// prerenderizada de forma estática en el build.
export const dynamic = "force-dynamic";

export default async function DominioPage() {
  // Solo con el demo local habilitado: esta pagina (y /api/tenants/domain) aun no derivan el tenant de la sesion.
  const demoTenantSlug = process.env.ALLOW_DEMO_TENANT === "true" ? process.env.DEMO_TENANT_SLUG : undefined;

  if (!demoTenantSlug) {
    return (
      <section>
        <h1>Conectar dominio propio</h1>
        <p>
          Esta función todavía no está disponible con sesión real (pendiente: derivar la academia de la sesión).
          En desarrollo local, activa <code>ALLOW_DEMO_TENANT=true</code> y define <code>DEMO_TENANT_SLUG</code>.
        </p>
      </section>
    );
  }

  const tenant = await resolveTenantBySlug(demoTenantSlug);

  if (!tenant) {
    return (
      <section>
        <h1>Conectar dominio propio</h1>
        <p>
          No se encontró la academia &quot;{demoTenantSlug}&quot;. Corré{" "}
          <code>npm run db:seed</code> o revisá <code>DEMO_TENANT_SLUG</code>.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Conectar dominio propio — {tenant.nombre}</h1>
      <DomainForm tenantId={tenant.id} initialDomain={tenant.customDomain} />
    </section>
  );
}
