import Link from "next/link";
import type { ReactNode } from "react";
import "./creador.css";

interface Props {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  volver?: { href: string; label: string };
}

export function PageHeader({ titulo, descripcion, acciones, volver }: Props) {
  return (
    <div>
      {volver && (
        <Link href={volver.href} className="cr-back">
          ← {volver.label}
        </Link>
      )}
      <header className="cr-header">
        <div className="cr-header__body">
          <h1 className="cr-header__title">{titulo}</h1>
          {descripcion && <p className="cr-header__desc">{descripcion}</p>}
        </div>
        {acciones && <div className="cr-header__actions">{acciones}</div>}
      </header>
    </div>
  );
}
