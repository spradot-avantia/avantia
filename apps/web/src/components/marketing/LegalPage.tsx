// Plantilla de las páginas legales (/terminos y /privacidad). "Volver" usa /landing
// porque estas páginas también se abren desde /postular, en el host del panel.
// Borradores de la landing V3 pendientes de revisión legal: los datos
// faltantes van con <Todo>.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import "./landing.css";
import "./legal.css";

export function Todo({ children }: { children: ReactNode }) {
  return <span className="av-todo">{children}</span>;
}

export interface SeccionLegal {
  id: string;
  titulo: string;
  cuerpo: ReactNode;
}

export function LegalPage({
  titulo,
  actual,
  resumen,
  secciones,
}: {
  titulo: string;
  actual: "terminos" | "privacidad";
  resumen: string[];
  secciones: SeccionLegal[];
}) {
  return (
    <div className="av-scope lp lg">
      <div className="lp-draft" role="note">
        <b>Borrador para revisión legal.</b> Este texto no está vigente. Los datos con línea punteada están pendientes.
      </div>
      <header className="lp-top">
        <div className="lp-wrap lp-top__in">
          <Link className="lp-logo" href="/landing" aria-label="avantia, volver a la landing">
            <Image src="/brand/avantia-mark.png" alt="" width={581} height={364} style={{ height: 32, width: "auto" }} priority />
            <Image src="/brand/avantia-wordmark.png" alt="avantia" width={739} height={159} style={{ height: 16, width: "auto" }} priority />
          </Link>
          <Link className="lg-back" href="/landing">
            <span className="lg-back__ico"><Icon name="arrow" size={16} /></span>Volver
          </Link>
        </div>
      </header>

      <main className="lp-wrap lg-doc">
        <nav className="lg-toc" aria-label="Contenido">
          <b>Contenido</b>
          <ol>
            {secciones.map((s) => (
              <li key={s.id}><a href={`#${s.id}`}>{s.titulo}</a></li>
            ))}
          </ol>
        </nav>
        <article className="lg-body">
          <div className="lg-head">
            <p className="av-overline">Legal</p>
            <h1>{titulo}</h1>
            <p className="lg-meta">Versión borrador · Última actualización: <Todo>[fecha]</Todo></p>
          </div>
          <div className="lg-sum">
            <b>En resumen</b>
            <ul>{resumen.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          {secciones.map((s) => (
            <section key={s.id} id={s.id}>
              <h2>{s.titulo}</h2>
              {s.cuerpo}
            </section>
          ))}
        </article>
      </main>

      <footer className="lp-foot lg-foot">
        <div className="lp-wrap">
          <span>© Avantia</span>
          <nav aria-label="Legal">
            <Link href="/terminos" aria-current={actual === "terminos" ? "page" : undefined}>Términos y condiciones</Link>
            <Link href="/privacidad" aria-current={actual === "privacidad" ? "page" : undefined}>Política de privacidad</Link>
            <Link href="/landing">Volver</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
