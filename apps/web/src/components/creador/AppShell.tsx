import type { ReactNode } from "react";
import { signOutAction } from "../../lib/auth/actions";
import { textoSobre } from "../../lib/creador/color";
import type { TenantCreador } from "../../lib/creador/types";
import { MobileMenu } from "./MobileMenu";
import { IconoSvg, NavLinks, type ItemNav } from "./NavLinks";
import { TenantMark } from "./TenantMark";
import "./creador.css";
import "./auth/auth.css";

const FIRMA = "Con la tecnología de Avantia";

const ITEMS: ItemNav[] = [
  { href: "/inicio", label: "Inicio", exacto: true, icono: "inicio" },
  { href: "/cursos", label: "Cursos", icono: "cursos" },
  { href: "/estudiantes", label: "Estudiantes", icono: "estudiantes" },
  { href: "/mi-academia", label: "Mi academia", icono: "academia" },
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
  const items = mostrarAdmin ? [...ITEMS, { href: "/admin", label: "Administración", separador: true, icono: "admin" as const }] : ITEMS;
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
      <span className="au-user__mail" title={usuarioEmail}>
        {usuarioEmail}
      </span>
      <form action={signOutAction}>
        <button type="submit" className="cr-nav__salir">
          <IconoSvg>
            <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M15 8l4 4-4 4M19 12H9" />
          </IconoSvg>
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
