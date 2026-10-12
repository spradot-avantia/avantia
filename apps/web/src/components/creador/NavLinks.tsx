"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ItemNav {
  href: string;
  label: string;
  /** true => activo solo con coincidencia exacta (ej. Inicio "/"). */
  exacto?: boolean;
  separador?: boolean;
}

export function NavLinks({ items, etiqueta = "Secciones" }: { items: ItemNav[]; etiqueta?: string }) {
  const pathname = usePathname();
  return (
    <nav className="cr-nav" aria-label={etiqueta}>
      {items.map((it) => {
        const activo = it.exacto ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <span key={it.href} style={{ display: "contents" }}>
            {it.separador && <span className="cr-nav__sep">Avantia</span>}
            <Link href={it.href} aria-current={activo ? "page" : undefined}>
              {it.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
