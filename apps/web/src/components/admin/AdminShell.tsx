import type { ReactNode } from "react";
import Link from "next/link";
import { signOutAction } from "../../lib/auth/actions";
import { AdminNav } from "./AdminNav";
import "../creador/creador.css";
import "./admin.css";

/** Marco de la zona de administración de Avantia: distinto del Espacio del Creador. */
export function AdminShell({ email, children }: { email: string | null; children: ReactNode }) {
  return (
    <div className="av-scope ad-shell">
      <header className="ad-top">
        <div className="ad-top__row">
          <span className="ad-brand">
            Avantia<small>Administración</small>
          </span>
          <div className="ad-user">
            <Link href="/inicio" className="ad-link">Mi panel</Link>
            {email && <span className="ad-user__mail">{email}</span>}
            <form action={signOutAction}>
              <button type="submit" className="ad-link">Cerrar sesión</button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="ad-main">{children}</main>
    </div>
  );
}
