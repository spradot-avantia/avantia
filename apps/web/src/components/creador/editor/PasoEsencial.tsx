"use client";

import {
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
  PUBLICO_MAX,
  TITULO_MAX,
  TITULO_MIN,
} from "../../../lib/creador/validacion";
import { Field, Input, Textarea } from "../Field";
import type { EditorCtx } from "./contexto";
import { contador, errorDe } from "./util";

/** Paso 1: titulo, descripcion y ¿para quien? (opcional). */
export function PasoEsencial({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso } = ctx;
  const titulo = curso.titulo;
  const descripcion = curso.descripcion ?? "";
  const publico = curso.publico ?? "";

  const cambiar = (campo: "titulo" | "descripcion" | "publico", valor: string) => {
    setCurso((c) => ({ ...c, [campo]: valor }));
    ctx.guardarCampo(campo, valor);
  };

  return (
    <div className="ed-form">
      <p className="ed-lede">Lo mínimo para que tus estudiantes entiendan de qué trata el curso. Se guarda solo mientras escribes.</p>

      <Field
        id="ed-titulo"
        label="Título del curso"
        ayuda={`Entre ${TITULO_MIN} y ${TITULO_MAX} caracteres. Di qué se aprende, no cómo se llama el tema.`}
        error={errorDe(ctx, "titulo", titulo.trim().length > TITULO_MAX)}
        contador={contador(titulo.trim().length, TITULO_MAX)}
      >
        <Input
          id="ed-titulo"
          value={titulo}
          autoComplete="off"
          conAyuda
          invalido={!!errorDe(ctx, "titulo", titulo.trim().length > TITULO_MAX)}
          onChange={(e) => cambiar("titulo", e.target.value)}
          onBlur={() => ctx.marcarTocado("titulo")}
        />
      </Field>

      <Field
        id="ed-descripcion"
        label="Descripción"
        ayuda={`Entre ${DESCRIPCION_MIN} y ${DESCRIPCION_MAX} caracteres. Es lo primero que leen antes de entrar.`}
        error={errorDe(ctx, "descripcion", descripcion.trim().length > DESCRIPCION_MAX)}
        contador={contador(descripcion.trim().length, DESCRIPCION_MAX)}
      >
        <Textarea
          id="ed-descripcion"
          value={descripcion}
          rows={5}
          conAyuda
          invalido={!!errorDe(ctx, "descripcion", descripcion.trim().length > DESCRIPCION_MAX)}
          onChange={(e) => cambiar("descripcion", e.target.value)}
          onBlur={() => ctx.marcarTocado("descripcion")}
        />
      </Field>

      <Field
        id="ed-publico"
        label="¿Para quién es?"
        opcional
        ayuda="Ejemplo: administradores de contrato con 2 o más años en faena."
        error={errorDe(ctx, "publico", publico.length > PUBLICO_MAX)}
        contador={contador(publico.length, PUBLICO_MAX)}
      >
        <Input
          id="ed-publico"
          value={publico}
          autoComplete="off"
          conAyuda
          invalido={!!errorDe(ctx, "publico", publico.length > PUBLICO_MAX)}
          onChange={(e) => cambiar("publico", e.target.value)}
          onBlur={() => ctx.marcarTocado("publico")}
        />
      </Field>
    </div>
  );
}
