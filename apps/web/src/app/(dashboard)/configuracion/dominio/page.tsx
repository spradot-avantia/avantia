import { resolveTenantBySlug } from "../../../../lib/tenant/resolve";
import { DomainForm } from "./DomainForm";

// Depende de DEMO_TENANT_SLUG leído en cada request; no debe quedar
// prerenderizada de forma estática en el build.
export const dynamic = "force-dynamic";

export default async function DominioPage() {
  const demoTenantSlug = process.env.DEMO_TENANT_SLUG;

  if (!demoTenantSlug) {
    return (
      <section>
        <h1>Conectar dominio propio</h1>
        <p>
          Falta la variable de entorno <code>DEMO_TENANT_SLUG</code> (mientras
          no hay login, esta página necesita saber sobre qué academia opera).
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
