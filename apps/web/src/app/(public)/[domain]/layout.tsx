import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { resolveTenantByHostname } from "../../../lib/tenant/resolve";
import { TenantProvider } from "../../../lib/tenantContext";

// Server Component: corre en runtime Node.js (no edge), así que puede
// resolver el tenant contra Supabase sin las restricciones del middleware.
// Es la pieza que reemplaza el fetch en el cliente que hacía tenantContext.tsx
// en la versión SPA: acá el HTML ya sale con el tenant resuelto, sin delay
// ni loading state — esa es la ganancia de SEO frente a Node + React puro.
// El encabezado de la academia lo pone cada página: la página de inicio usa
// el del template elegido (ADR 021).
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { domain: string };
}) {
  const tenant = await resolveTenantByHostname(params.domain);

  if (!tenant) {
    notFound();
  }

  return (
    <TenantProvider tenant={tenant}>
      <div style={{ ["--color-primario" as string]: tenant.theme.colorPrimario }}>
        <main>{children}</main>
      </div>
    </TenantProvider>
  );
}