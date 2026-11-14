"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type IconoNav = "inicio" | "cursos" | "estudiantes" | "revisiones" | "clases" | "academia" | "admin";

export interface ItemNav {
  href: string;
  label: string;
  /** true => activo solo con coincidencia exacta (ej. Inicio "/"). */
  exacto?: boolean;
  separador?: boolean;
  icono?: IconoNav;
}

const TRAZOS: Record<IconoNav, ReactNode> = {
  inicio: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  cursos: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H20v14H5.5A1.5 1.5 0 0 0 4 19.5v-14Z" />
      <path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3" />
    </>
  ),
  estudiantes: (
    <>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3.25 3.25 0 0 1 0 5.6M18 14.8c1.8.7 3 2.4 3 5.2" />
    </>
  ),
  revisiones: (
    <>
      <path d="M6 3.5h9l3 3V20.5H6V3.5Z" />
      <path d="M14.5 3.5V7H18M9 13l2 2 4-4" />
    </>
  ),
  clases: (
    <>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="m15 10.5 6-3v9l-6-3" />
    </>
  ),
  academia: (
    <>
      <path d="M3.5 9 12 4l8.5 5v1H3.5V9Z" />
      <path d="M6 10v8M10 10v8M14 10v8M18 10v8M3.5 20h17" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3 5 6v5.5c0 4.4 2.9 7.6 7 9.5 4.1-1.9 7-5.1 7-9.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

export function IconoSvg({ children }: { children: ReactNode }) {
  return (
    <svg className="cr-nav__ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function NavLinks({ items, etiqueta = "Secciones" }: { items: ItemNav[]; etiqueta?: string }) {
  const pathname = usePathname();
  return (
    <nav className="cr-nav" aria-label={etiqueta}>
      {items.map((it) => {
        const activo = it.exacto ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <span key={it.href} style={{ display: "contents" }}>
            {it.separador && <span className="cr-nav__sep" aria-hidden="true" />}
            <Link href={it.href} aria-current={activo ? "page" : undefined}>
              {it.icono && <IconoSvg>{TRAZOS[it.icono]}</IconoSvg>}
              {it.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
