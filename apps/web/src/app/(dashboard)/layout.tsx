import type { ReactNode } from "react";
import { AppShell } from "../../components/creador";
import { getCurrentTenant } from "../../lib/creador/tenantActual";
import { esStaff } from "../../lib/staff";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [tenant, staff] = await Promise.all([getCurrentTenant(), esStaff()]);
  return (
    <AppShell tenant={tenant} mostrarAdmin={staff}>
      {children}
    </AppShell>
  );
}
