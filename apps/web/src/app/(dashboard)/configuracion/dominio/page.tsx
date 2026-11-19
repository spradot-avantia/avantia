import { SinAcademia } from "../../../../components/creador";
import { getCurrentTenant } from "../../../../lib/creador/tenantActual";
import { DomainForm } from "./DomainForm";

// La academia sale de la sesión (membresía) en cada request.
export const dynamic = "force-dynamic";

export default async function DominioPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) return <SinAcademia />;

  return (
    <section>
      <h1>Conectar dominio propio — {tenant.nombre}</h1>
      <DomainForm initialDomain={tenant.customDomain} />
    </section>
  );
}
