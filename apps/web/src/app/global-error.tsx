"use client";

import "./globals.css";
import "./estado.css";

export default function ErrorGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <main className="es av-scope" role="alert">
          <div className="es__caja">
            <p className="es__codigo">Algo salió mal</p>
            <h1 className="es__titulo">No pudimos cargar la página</h1>
            <p className="es__texto">Intenta de nuevo en unos segundos.</p>
            <div className="es__acciones">
              <button type="button" className="av-btn av-btn--primary" onClick={reset}>Reintentar</button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
