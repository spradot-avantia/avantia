import type { Metadata } from "next";
import Link from "next/link";
import "./estado.css";

// Título neutro: dentro de la academia de un tenant no debe aparecer el eslogan de Avantia.
export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

// 404 neutro: sin marca (también se muestra dentro de la academia de un tenant).
export default function NoEncontrada() {
  return (
    <main className="es av-scope">
      <div className="es__caja">
        <p className="es__codigo">Error 404</p>
        <h1 className="es__titulo">No encontramos esta página</h1>
        <p className="es__texto">El enlace puede estar mal escrito o la página ya no existe.</p>
        <div className="es__acciones">
          <Link href="/" className="av-btn av-btn--primary">Ir al inicio</Link>
        </div>
      </div>
    </main>
  );
}
