import { Outlet } from "react-router-dom";
import { TenantProvider, useTenant } from "../lib/tenantContext.js";

function PublicShell() {
  const { tenant, loading, error } = useTenant();

  if (loading) return <div>Cargando...</div>;
  if (error || !tenant) return <div>Academia no encontrada</div>;

  return (
    <div style={{ ["--color-primario" as string]: tenant.color_primario ?? undefined }}>
      <header>
        {tenant.logo_url && <img src={tenant.logo_url} alt={tenant.nombre} />}
        <span>{tenant.nombre}</span>
      </header>
      <main>
        <Outlet context={{ tenant }} />
      </main>
    </div>
  );
}

export function PublicLayout() {
  return (
    <TenantProvider>
      <PublicShell />
    </TenantProvider>
  );
}
