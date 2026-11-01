"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Resumen", exacto: true },
  { href: "/admin/postulaciones", label: "Postulaciones" },
  { href: "/admin/creadores", label: "Creadores" },
  { href: "/admin/academias", label: "Academias" },
  { href: "/admin/equipo", label: "Equipo" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="ad-nav" aria-label="Administración">
      {ITEMS.map((it) => {
        const activo = it.exacto ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <Link key={it.href} href={it.href} aria-current={activo ? "page" : undefined}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
