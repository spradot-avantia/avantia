"use client";

// Marco de las pantallas de aprendizaje (ADR 033, ADR 034): syllabus a la izquierda, contenido al
// centro e índice de la lección a la derecha (opcional). En móvil todo se apila y los paneles se
// pliegan; desde 900 px el syllabus se puede ocultar y la preferencia se recuerda en el navegador.
import { useEffect, useState, type ReactNode } from "react";
import { IconoPanel } from "../ui/Iconos";
import "./shell-curso.css";

const CLAVE = "avantia:syllabus-oculto";

export function ShellCurso({ syllabus, indice, children }: { syllabus: ReactNode; indice?: ReactNode; children: ReactNode }) {
  const [oculto, setOculto] = useState(false);

  // Se lee tras montar (no en el render inicial) para que el HTML del servidor y el cliente coincidan.
  useEffect(() => {
    try {
      setOculto(localStorage.getItem(CLAVE) === "1");
    } catch {
      /* sin almacenamiento: queda visible */
    }
  }, []);

  const alternar = () => {
    setOculto((o) => {
      try {
        localStorage.setItem(CLAVE, o ? "0" : "1");
      } catch {
        /* se aplica igual en esta pantalla */
      }
      return !o;
    });
  };

  return (
    <div className={`al-shell${indice ? " al-shell--con-indice" : ""}`} data-sil={oculto ? "oculto" : undefined}>
      <aside className="al-shell__sil" id="al-shell-sil">
        {syllabus}
      </aside>
      {indice && <aside className="al-shell__toc">{indice}</aside>}
      <div className="al-shell__main">
        <button type="button" className="al-shell__toggle" aria-expanded={!oculto} aria-controls="al-shell-sil" onClick={alternar}>
          <IconoPanel tam={18} />
          {oculto ? "Mostrar contenido del curso" : "Ocultar contenido del curso"}
        </button>
        {children}
      </div>
    </div>
  );
}
