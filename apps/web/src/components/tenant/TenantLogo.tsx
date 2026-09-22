"use client";

import { useTenant } from "../../lib/tenantContext";

export function TenantLogo() {
  const tenant = useTenant();

  if (!tenant.theme.logoUrl) return null;

  // eslint-disable-next-line @next/next/no-img-element -- logo remoto por tenant, sin dominio fijo para next/image
  return <img src={tenant.theme.logoUrl} alt={tenant.nombre} />;
}
