import type { ReactNode } from "react";
import { signOutAction } from "../../lib/auth/actions";
import { textoSobre } from "../../lib/creador/color";
import type { TenantCreador } from "../../lib/creador/types";
import { MobileMenu } from "./MobileMenu";
import { NavLinks, type ItemNav } from "./NavLinks";
import { TenantMark } from "./TenantMark";
import "./creador.css";
import "./auth/auth.css";

const FIRMA = "Con la tecnología de Avantia";

const ITEMS: ItemNav[] = [
  { href: "/", label: "Inicio", exacto: true },
  { href: "/cursos", label: "Cursos" },
  { href: "/estudiantes", label: "Estudiantes" },
  { href: "/mi-academia", label: "Mi academia" },
];

interface Props {
  /** null => sin academia activa: marca neutra. */
  tenant: TenantCreador | null;
  /** Muestra el enlace /admin (solo staff de Avantia). */
  mostrarAdmin?: boolean;
  /** Correo del usuario con sesion (null en modo demo local). */
  usuarioEmail?: string | null;
  children: ReactNode;
}

/**
 * Espacio del Creador: menu lateral en escritorio (>= 900px); barra superior
 * + menu desplegable en movil. La firma de Avantia vive SOLO aqui (panel del
 * creador), nunca en el sitio publico de la academia.
 */
export function AppShell({ tenant, mostrarAdmin, usuarioEmail, children }: Props) {
  const color = tenant?.colorPrimario ?? "#2563eb";
  const items = mostrarAdmin ? [...ITEMS, { href: "/admin", label: "Academias (staff)", separador: true }] : ITEMS;
  const marca = (
    <TenantMark
      nombre={tenant?.nombre ?? "Mi academia"}
      logoUrl={tenant?.logoUrl}
      logoModo={tenant?.logoModo}
      color={color}
    />
  );
  const sesion = usuarioEmail ? (
    <div className="au-user">
      <span className="au-user__mail">{usuarioEmail}</span>
      <form action={signOutAction}>
        <button type="submit" className="av-btn cr-btn cr-btn--ghost cr-btn--block">
          Cerrar sesión
        </button>
      </form>
    </div>
  ) : null;
  return (
    <div
      className="av-scope cr-shell"
      style={{ ["--cr-brand" as string]: color, ["--cr-on-brand" as string]: textoSobre(color) }}
    >
      <aside className="cr-side" aria-label="Navegación principal">
        <div className="cr-side__brand">{marca}</div>
        <NavLinks items={items} />
        {sesion}
        <p className="cr-side__foot">{FIRMA}</p>
      </aside>

      <header className="cr-topbar">
        {marca}
        <MobileMenu>
          <NavLinks items={items} etiqueta="Secciones (móvil)" />
          {sesion}
        </MobileMenu>
      </header>

      <main className="cr-main" id="contenido">
        <div className="cr-main__inner">{children}</div>
        <p className="cr-foot-mobile">{FIRMA}</p>
      </main>
    </div>
  );
}
