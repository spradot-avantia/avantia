import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "../../components/admin/AdminShell";
import { EmptyState } from "../../components/creador";
import { rutaActual } from "../../lib/auth/panel";
import { getUsuarioActual } from "../../lib/auth/usuario";
import { esStaff } from "../../lib/staff";

// Zona de administración de Avantia (ADR 017): usa supabaseAdmin sobre todas las
// academias, así que SOLO entra el equipo. Separada del panel del creador.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect(`/login?next=${encodeURIComponent(rutaActual())}`);
  if (!(await esStaff())) {
    return (
      <main className="av-scope" style={{ padding: "var(--av-space-6) var(--av-space-4)" }}>
        <EmptyState titulo="Acceso restringido" descripcion="Esta sección es para el equipo de Avantia." />
      </main>
    );
  }
  return <AdminShell email={usuario.email}>{children}</AdminShell>;
}
