"use client";

import { useEffect } from "react";
import "./estado.css";

export default function ErrorApp({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="es av-scope" role="alert">
      <div className="es__caja">
        <p className="es__codigo">Algo salió mal</p>
        <h1 className="es__titulo">No pudimos cargar esta página</h1>
        <p className="es__texto">Fue un problema nuestro, no tuyo. Tu avance está guardado. Intenta de nuevo en unos segundos.</p>
        <div className="es__acciones">
          <button type="button" className="av-btn av-btn--primary" onClick={reset}>Reintentar</button>
          <a href="/" className="av-btn av-btn--secondary">Ir al inicio</a>
        </div>
      </div>
    </main>
  );
}
