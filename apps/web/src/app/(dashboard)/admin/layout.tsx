import type { ReactNode } from "react";
import { EmptyState } from "../../../components/creador";
import { esStaff } from "../../../lib/staff";

// Esta zona usa supabaseAdmin (todas las academias): SOLO staff de Avantia.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await esStaff())) {
    return (
      <EmptyState
        titulo="Acceso restringido"
        descripcion="Esta sección es para el equipo de Avantia."
      />
    );
  }
  return <>{children}</>;
}
