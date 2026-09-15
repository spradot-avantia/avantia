import { useTenant } from "../../lib/tenantContext.js";

export function TenantLogo() {
  const { tenant } = useTenant();

  if (!tenant?.logo_url) return null;

  return <img src={tenant.logo_url} alt={tenant.nombre} />;
}
