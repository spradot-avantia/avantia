"use client";

import { useState, useTransition } from "react";
import { registrarEstudiantesAction } from "../../../lib/creador/actions";
import type { ResumenRegistro } from "../../../lib/creador/estudiantes";
import type { AccesoCurso, EstadoCurso } from "../../../lib/creador/types";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Select, Textarea } from "../Field";
import { CopiarEnlace } from "../inicio/CopiarEnlace";
import { ETIQUETA_ACCESO } from "../cursos/utils";
import "../inicio/inicio.css";

export interface CursoOpcion {
  id: string;
  titulo: string;
  estado: EstadoCurso;
  acceso: AccesoCurso;
  url: string;
}

export function RegistrarEstudiantes({ cursos, cursoInicial }: { cursos: CursoOpcion[]; cursoInicial: string }) {
  const [cursoId, setCursoId] = useState(cursoInicial);
  const [texto, setTexto] = useState("");
  const [pendiente, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<ResumenRegistro | null>(null);
  const curso = cursos.find((c) => c.id === cursoId) ?? cursos[0];

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRes(null);
    start(async () => {
      const r = await registrarEstudiantesAction(curso.id, texto);
      if (r.ok) {
        setRes(r.data);
        setTexto("");
      } else setError(r.error);
    });
  }

  return (
    <div className="ci-stack">
      <form className="ci-card ci-form" onSubmit={enviar} noValidate aria-busy={pendiente}>
        <h2 className="ci-card__title">Registrar estudiantes</h2>
        <Field id="est-curso" label="Curso">
          <Select
            id="est-curso"
            value={curso.id}
            onChange={(e) => {
              setCursoId(e.target.value);
              setRes(null);
              setError(null);
            }}
          >
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
                {c.estado === "borrador" ? " (borrador)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <p className="ci-muted">
          Acceso de este curso: <strong>{ETIQUETA_ACCESO[curso.acceso]}</strong>. Lo cambias en el editor, paso Acceso.
        </p>
        <Field
          id="est-correos"
          label="Correos de los estudiantes"
          ayuda="Pega uno o varios correos, separados por coma, espacio o salto de línea. Hasta 500 por vez."
          error={error}
        >
          <Textarea
            id="est-correos"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={"ana@empresa.com\nluis@empresa.com"}
            invalido={!!error}
            conAyuda
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <div className="ci-actions">
          <Button type="submit" disabled={pendiente || !texto.trim()}>
            {pendiente ? "Registrando…" : "Registrar estudiantes"}
          </Button>
        </div>
        <div role="status" aria-live="polite">
          {res && (
            <Callout
              tono={res.agregados.length ? "success" : "info"}
              titulo={
                res.agregados.length
                  ? `Registramos ${res.agregados.length} ${res.agregados.length === 1 ? "estudiante" : "estudiantes"}`
                  : "No había correos nuevos"
              }
            >
              <ul className="ci-result">
                {res.yaRegistrados.length > 0 && <li>{res.yaRegistrados.length} ya estaban registrados en este curso.</li>}
                {res.invalidos.length > 0 && (
                  <li>
                    {res.invalidos.length} sin formato válido: {res.invalidos.slice(0, 5).join(", ")}
                    {res.invalidos.length > 5 ? "…" : ""}
                  </li>
                )}
                {!res.yaRegistrados.length && !res.invalidos.length && <li>Todos los correos eran nuevos y válidos.</li>}
              </ul>
            </Callout>
          )}
        </div>
      </form>

      <Callout tono="info" titulo="Avantia todavía no envía invitaciones por correo">
        Registrar un correo sirve para llevar el seguimiento de tu piloto. Tú compartes el enlace del curso con tus estudiantes (por
        correo, WhatsApp o donde prefieras).
        {curso.estado === "borrador" && " Este curso está en borrador: el enlace funcionará cuando lo publiques."}
        <div className="ci-link">{curso.url}</div>
        <div className="ci-actions" style={{ marginTop: "var(--av-space-3)" }}>
          <CopiarEnlace url={curso.url} />
        </div>
      </Callout>
    </div>
  );
}
