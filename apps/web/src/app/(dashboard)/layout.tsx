import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "../../components/creador";
import { rutaActual } from "../../lib/auth/panel";
import { demoPermitido, getUsuarioActual } from "../../lib/auth/usuario";
import { getCurrentTenant } from "../../lib/creador/tenantActual";
import { tieneAcceso } from "../../lib/postulacion/acceso";
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
  // Sesión sin invitación vigente (cuenta creada por fuera de la app o postulación descartada).
  if (usuario && !(await tieneAcceso(usuario.email))) redirect("/auth/bloqueado");
  const [tenant, staff] = await Promise.all([getCurrentTenant(), esStaff()]);
  // Con sesion pero sin academia: el equipo de Avantia va a su zona /admin; el resto, a crearla.
  if (usuario && !tenant) {
    redirect(staff ? "/admin" : "/onboarding");
  }
  return (
    <AppShell tenant={tenant} mostrarAdmin={staff} usuarioEmail={usuario?.email ?? null}>
      {children}
    </AppShell>
  );
}
