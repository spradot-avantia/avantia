"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { crearCursoAction } from "../../../lib/creador/actions";
import type { ModoCreacionCurso } from "../../../lib/creador/types";
import { Badge } from "../Badge";
import { Callout } from "../Callout";
import "../inicio/inicio.css";

export function ComoEmpezar() {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [modo, setModo] = useState<ModoCreacionCurso | null>(null);
  const [error, setError] = useState<string | null>(null);

  function elegir(m: ModoCreacionCurso) {
    if (pendiente) return;
    setModo(m);
    setError(null);
    start(async () => {
      const r = await crearCursoAction({ modo: m });
      if (r.ok) router.push(`/cursos/${r.data.id}/editar`);
      else {
        setError(r.error);
        setModo(null);
      }
    });
  }

  const opcion = (m: ModoCreacionCurso, titulo: string, texto: string, rec?: boolean) => (
    <button type="button" className={`ci-option${rec ? " ci-option--rec" : ""}`} onClick={() => elegir(m)} disabled={pendiente}>
      {rec && <Badge tono="info">Recomendado</Badge>}
      <span className="ci-card__title">{modo === m ? "Creando tu borrador…" : titulo}</span>
      <span className="ci-muted">{texto}</span>
    </button>
  );

  return (
    <section aria-labelledby="ce-t" className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-busy={pendiente}>
      <h2 className="ci-card__title" id="ce-t">¿Cómo quieres empezar?</h2>
      <div className="ci-options">
        {opcion("estructura_sugerida", "Con una estructura sugerida", "Partes con tres módulos (contexto, casos reales y aplicación) que puedes renombrar, mover o borrar.", true)}
        {opcion("desde_cero", "Desde cero", "Si ya tienes clara la estructura de tu curso.")}
      </div>
      <p className="ci-muted">En ambos casos usas el mismo editor y puedes cambiar todo después.</p>
      <div role="status" aria-live="polite">{pendiente && <span className="ci-muted">Creando tu borrador…</span>}</div>
      {error && <Callout tono="danger" titulo="No pudimos crear el curso">{error}</Callout>}
    </section>
  );
}
