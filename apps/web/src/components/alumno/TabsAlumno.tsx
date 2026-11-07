"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const TABS: { href: string; texto: string; icono: ReactNode; activa: (p: string) => boolean }[] = [
  {
    href: "/mis-cursos",
    texto: "Mis cursos",
    activa: (p) => p.startsWith("/mis-cursos") || p.startsWith("/aprender"),
    icono: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...trazo}>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5v-15zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5v-15z" />
      </svg>
    ),
  },
  {
    href: "/repaso",
    texto: "Repaso",
    activa: (p) => p.startsWith("/repaso"),
    icono: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...trazo}>
        <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5" />
      </svg>
    ),
  },
  {
    href: "/progreso",
    texto: "Mi progreso",
    activa: (p) => p.startsWith("/progreso"),
    icono: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...trazo}>
        <path d="M5 20V12M12 20V5M19 20v-5" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    texto: "Mi perfil",
    activa: (p) => p.startsWith("/perfil"),
    icono: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...trazo}>
        <circle cx="12" cy="8.5" r="3.7" />
        <path d="M5 20c.6-3.7 3.4-5.8 7-5.8s6.4 2.1 7 5.8" />
      </svg>
    ),
  },
];

/** Secciones del alumno: barra inferior en móvil (con íconos), pestañas de texto en escritorio. */
export function TabsAlumno() {
  const ruta = usePathname() ?? "";
  return (
    <nav className="al-tabs" aria-label="Secciones">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.activa(ruta) ? "page" : undefined}>
          {t.icono}
          <span>{t.texto}</span>
        </Link>
      ))}
    </nav>
  );
}
