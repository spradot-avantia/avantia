"use client";

import { useEffect, useState } from "react";
import { OBJETIVOS_MAX, OBJETIVO_MAX } from "../../../lib/creador/validacion";
import { Button } from "../Button";
import { Field, Input } from "../Field";
import type { EditorCtx } from "./contexto";
import { contador, errorDe } from "./util";

/** Paso 2: de 1 a 3 objetivos de aprendizaje, con guia Evita/Mejor. */
export function PasoObjetivo({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso } = ctx;
  // Siempre al menos una fila visible, aunque el curso aun no tenga objetivos.
  const filas = curso.objetivos.length ? curso.objetivos : [""];
  const [foco, setFoco] = useState<number | null>(null);

  useEffect(() => {
    if (foco === null) return;
    document.getElementById(`ed-obj-${foco}`)?.focus();
    setFoco(null);
  }, [foco]);

  // Las filas vacias son borrador local: solo se guardan las escritas.
  const aplicar = (nuevas: string[]) => {
    setCurso((c) => ({ ...c, objetivos: nuevas }));
    ctx.guardarCampo("objetivos", nuevas.filter((o) => o.trim()));
  };

  const errorLista = errorDe(ctx, "objetivos");

  return (
    <div className="ed-form">
      <p className="ed-lede">
        ¿Qué podrá hacer una persona al terminar? Define entre 1 y {OBJETIVOS_MAX} objetivos concretos.
      </p>

      <div className="ed-guia" aria-label="Guía para escribir objetivos">
        <div className="ed-guia__col ed-guia__col--evita">
          <strong>Evita</strong>
          <ul>
            <li>“Entender los contratos”</li>
            <li>“Conocer la negociación”</li>
          </ul>
        </div>
        <div className="ed-guia__col ed-guia__col--mejor">
          <strong>Mejor</strong>
          <ul>
            <li>“Identificar las tres cláusulas que más riesgo traen”</li>
            <li>“Negociar una cláusula de reajuste sin perder margen”</li>
          </ul>
        </div>
      </div>

      <ul className="ed-lista-campos">
        {filas.map((valor, i) => (
          <li key={i} className="ed-fila-obj">
            <div className="ed-fila-obj__campo">
              <Field
                id={`ed-obj-${i}`}
                label={`Objetivo ${i + 1}`}
                error={valor.length > OBJETIVO_MAX ? `Cada objetivo admite hasta ${OBJETIVO_MAX} caracteres.` : undefined}
                contador={contador(valor.trim().length, OBJETIVO_MAX)}
              >
                <Input
                  id={`ed-obj-${i}`}
                  value={valor}
                  autoComplete="off"
                  placeholder="Empieza con un verbo: identificar, aplicar, negociar…"
                  invalido={valor.length > OBJETIVO_MAX}
                  onChange={(e) => aplicar(filas.map((x, j) => (j === i ? e.target.value : x)))}
                  onBlur={() => ctx.marcarTocado("objetivos")}
                />
              </Field>
            </div>
            {filas.length > 1 && (
              <Button
                variante="ghost"
                aria-label={`Quitar objetivo ${i + 1}`}
                onClick={() => {
                  aplicar(filas.filter((_, j) => j !== i));
                  ctx.anunciar(`Objetivo ${i + 1} quitado`);
                  setFoco(Math.max(0, i - 1));
                }}
              >
                Quitar
              </Button>
            )}
          </li>
        ))}
      </ul>

      {errorLista && (
        <p className="cr-field__error" role="alert">
          {errorLista}
        </p>
      )}

      {filas.length < OBJETIVOS_MAX && (
        <div>
          <Button
            variante="secondary"
            onClick={() => {
              aplicar([...filas, ""]);
              setFoco(filas.length);
            }}
          >
            + Agregar otro objetivo
          </Button>
        </div>
      )}
    </div>
  );
}
