import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "../../components/creador";
import { rutaActual } from "../../lib/auth/panel";
import { demoPermitido, getUsuarioActual } from "../../lib/auth/usuario";
import { getCurrentTenant } from "../../lib/creador/tenantActual";
import { esStaff } from "../../lib/staff";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const usuario = await getUsuarioActual();
  const ruta = rutaActual();
  // Sin sesion: al login (el demo sin sesion solo existe con ALLOW_DEMO_TENANT=true).
  if (!usuario && !demoPermitido()) {
    redirect(`/login?next=${encodeURIComponent(ruta)}`);
  }
  const [tenant, staff] = await Promise.all([getCurrentTenant(), esStaff()]);
  // Con sesion pero sin academia: a crearla (el staff puede entrar a /admin sin academia propia).
  if (usuario && !tenant && !(staff && ruta.startsWith("/admin"))) {
    redirect("/onboarding");
  }
  return (
    <AppShell tenant={tenant} mostrarAdmin={staff} usuarioEmail={usuario?.email ?? null}>
      {children}
    </AppShell>
  );
}
