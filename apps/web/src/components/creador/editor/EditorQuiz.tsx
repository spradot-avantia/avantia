"use client";

// Paso 3 > Quiz de repaso del módulo (diseño 3.3, ADR 022). De 3 a 5
// preguntas de opción múltiple o verdadero/falso, con la respuesta correcta y
// una explicación. Se guarda solo (cola de autoguardado del editor).
import { useEffect, useRef, useState } from "react";
import { guardarQuizAction } from "../../../lib/creador/actionsEditor";
import {
  cambiarTipo,
  ETIQUETA_TIPO,
  estadoQuiz,
  EXPLICACION_MAX,
  OPCION_MAX,
  OPCIONES_MAX,
  OPCIONES_MIN,
  PREGUNTA_MAX,
  preguntaNueva,
  problemaPregunta,
  QUIZ_MAX,
  QUIZ_MIN,
  type PreguntaQuiz,
  type TipoPregunta,
} from "../../../lib/creador/quiz";
import type { Modulo } from "../../../lib/creador/types";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input, Textarea } from "../Field";
import { ConfirmDialog } from "./ConfirmDialog";
import type { EditorCtx } from "./contexto";
import "./quiz.css";

const LETRAS = ["A", "B", "C", "D"];

function nuevoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function EditorQuiz({ ctx, modulo, numero, onVolver }: { ctx: EditorCtx; modulo: Modulo; numero: number; onVolver: () => void }) {
  const { auto, setCurso } = ctx;
  const [ps, setPs] = useState<PreguntaQuiz[]>(() => modulo.quiz ?? []);
  const [abierta, setAbierta] = useState<string | null>(() => modulo.quiz?.[0]?.id ?? null);
  const [probar, setProbar] = useState(false);
  const [confirmar, setConfirmar] = useState<{ k: "pregunta"; id: string } | { k: "quiz" } | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const estado = estadoQuiz(ps);

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  /** Aplica el cambio en pantalla, en el curso y agenda el guardado del quiz completo. */
  function aplicar(nuevas: PreguntaQuiz[]) {
    setPs(nuevas);
    setCurso((c) => ({ ...c, modulos: c.modulos.map((m) => (m.id === modulo.id ? { ...m, quiz: nuevas } : m)) }));
    auto.programar(`quiz:${modulo.id}`, () => guardarQuizAction(modulo.id, nuevas));
  }
  const editar = (id: string, fn: (p: PreguntaQuiz) => PreguntaQuiz) => aplicar(ps.map((p) => (p.id === id ? fn(p) : p)));

  function agregar() {
    if (ps.length >= QUIZ_MAX) return;
    const p = preguntaNueva(nuevoId());
    aplicar([...ps, p]);
    setAbierta(p.id);
    ctx.anunciar(`Pregunta ${ps.length + 1} agregada`);
    setTimeout(() => document.getElementById(`qz-texto-${p.id}`)?.focus(), 0);
  }

  function quitar(id: string) {
    aplicar(ps.filter((p) => p.id !== id));
    setAbierta(null);
    setConfirmar(null);
    ctx.anunciar("Pregunta eliminada");
  }

  function quitarQuiz() {
    aplicar([]);
    setConfirmar(null);
    ctx.anunciar("Quiz eliminado");
    onVolver();
  }

  const faltan = QUIZ_MIN - ps.length;

  return (
    <div className="ed-form">
      <div className="qz-cab">
        <button type="button" className="cr-back qz-volver" onClick={onVolver}>
          ← Volver a Estructura y contenido
        </button>
        <span className="qz-ov">
          Paso 3 de 6 · Módulo {numero} · {modulo.titulo || "Sin nombre"}
        </span>
        <h2 className="qz-h" ref={titulo} tabIndex={-1}>
          Quiz de repaso del módulo
        </h2>
        <p className="ed-lede">
          Escribe de {QUIZ_MIN} a {QUIZ_MAX} preguntas sobre lo que ya enseñaste. Se corrigen solas y le muestran a cada estudiante la
          explicación al responder.
        </p>
      </div>

      <div className="qz-grid">
        <div className="qz-col">
          <div className="qz-cuenta">
            <b>{ps.length === 1 ? "1 pregunta" : `${ps.length} preguntas`}</b>
            <span className="qz-ayuda">
              De {QUIZ_MIN} a {QUIZ_MAX} preguntas
            </span>
          </div>

          {probar ? (
            <ProbarQuiz preguntas={ps.filter((p) => !problemaPregunta(p))} onSalir={() => setProbar(false)} />
          ) : (
            <>
              {ps.length === 0 && <p className="ed-vacio">Este módulo aún no tiene quiz. Agrega la primera pregunta.</p>}
              <ol className="qz-lista">
                {ps.map((p, i) => {
                  const abiertaAhora = abierta === p.id;
                  const problema = problemaPregunta(p);
                  return (
                    <li key={p.id} className={`qz-preg${problema && !abiertaAhora ? " qz-preg--falta" : ""}${abiertaAhora ? " qz-preg--abierta" : ""}`}>
                      <button
                        type="button"
                        className="qz-preg__cab"
                        aria-expanded={abiertaAhora}
                        aria-controls={`qz-panel-${p.id}`}
                        onClick={() => setAbierta(abiertaAhora ? null : p.id)}
                      >
                        <span className="qz-num" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span className="qz-preg__t">
                          <b>{p.texto.trim() || "Pregunta sin escribir"}</b>
                          <span className="qz-ayuda">
                            {ETIQUETA_TIPO[p.tipo]} · {problema ? "Falta completar" : p.explicacion.trim() ? "Lista, con explicación" : "Lista"}
                          </span>
                        </span>
                        <span className="qz-preg__btn">{abiertaAhora ? "Cerrar" : "Editar"}</span>
                      </button>

                      {abiertaAhora && (
                        <div className="qz-panel" id={`qz-panel-${p.id}`}>
                          <fieldset className="qz-tipo">
                            <legend className="cr-field__label">Tipo</legend>
                            <div className="qz-seg">
                              {(Object.keys(ETIQUETA_TIPO) as TipoPregunta[]).map((t) => (
                                <button key={t} type="button" aria-pressed={p.tipo === t} onClick={() => editar(p.id, (x) => cambiarTipo(x, t))}>
                                  {ETIQUETA_TIPO[t]}
                                </button>
                              ))}
                            </div>
                          </fieldset>

                          <Field id={`qz-texto-${p.id}`} label="Pregunta" contador={`${p.texto.length}/${PREGUNTA_MAX}`}>
                            <Textarea
                              id={`qz-texto-${p.id}`}
                              rows={2}
                              value={p.texto}
                              maxLength={PREGUNTA_MAX}
                              onChange={(e) => editar(p.id, (x) => ({ ...x, texto: e.target.value }))}
                            />
                          </Field>

                          <fieldset className="qz-resp">
                            <legend className="cr-field__label">
                              Respuestas <span className="cr-field__opt">Marca la correcta</span>
                            </legend>
                            {p.opciones.map((o, j) => (
                              <div key={j} className="qz-op">
                                <input
                                  type="radio"
                                  name={`qz-correcta-${p.id}`}
                                  checked={p.correcta === j}
                                  aria-label={`Marcar como correcta: ${o || `respuesta ${LETRAS[j]}`}`}
                                  onChange={() => editar(p.id, (x) => ({ ...x, correcta: j }))}
                                />
                                {p.tipo === "opcion_multiple" ? (
                                  <>
                                    <Input
                                      id={`qz-op-${p.id}-${j}`}
                                      value={o}
                                      maxLength={OPCION_MAX}
                                      placeholder={`Respuesta ${LETRAS[j]}`}
                                      aria-label={`Respuesta ${LETRAS[j]}`}
                                      onChange={(e) =>
                                        editar(p.id, (x) => ({ ...x, opciones: x.opciones.map((v, k) => (k === j ? e.target.value : v)) }))
                                      }
                                    />
                                    {p.opciones.length > OPCIONES_MIN && (
                                      <button
                                        type="button"
                                        className="ed-icono ed-icono--peligro"
                                        aria-label={`Quitar la respuesta ${LETRAS[j]}`}
                                        onClick={() =>
                                          editar(p.id, (x) => ({
                                            ...x,
                                            opciones: x.opciones.filter((_, k) => k !== j),
                                            correcta: x.correcta === j ? null : x.correcta != null && x.correcta > j ? x.correcta - 1 : x.correcta,
                                          }))
                                        }
                                      >
                                        <span aria-hidden="true">✕</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span className="qz-op__fija">{o}</span>
                                )}
                              </div>
                            ))}
                            {p.tipo === "opcion_multiple" && p.opciones.length < OPCIONES_MAX && (
                              <div>
                                <Button variante="secondary" onClick={() => editar(p.id, (x) => ({ ...x, opciones: [...x.opciones, ""] }))}>
                                  Agregar respuesta
                                </Button>
                              </div>
                            )}
                          </fieldset>

                          <Field
                            id={`qz-expl-${p.id}`}
                            label="Explicación"
                            opcional
                            ayuda="Recomendada: se muestra al responder, acierte o no."
                            contador={`${p.explicacion.length}/${EXPLICACION_MAX}`}
                          >
                            <Textarea
                              id={`qz-expl-${p.id}`}
                              rows={2}
                              value={p.explicacion}
                              maxLength={EXPLICACION_MAX}
                              conAyuda
                              onChange={(e) => editar(p.id, (x) => ({ ...x, explicacion: e.target.value }))}
                            />
                          </Field>

                          {problema && (
                            <p className="qz-falta" role="status">
                              {problema}
                            </p>
                          )}
                          <div className="qz-panel__acc">
                            <Button variante="ghost" onClick={() => setConfirmar({ k: "pregunta", id: p.id })}>
                              Eliminar pregunta
                            </Button>
                            <Button onClick={() => setAbierta(null)}>Listo</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="qz-pie">
                <Button variante="secondary" onClick={agregar} disabled={ps.length >= QUIZ_MAX}>
                  + Agregar pregunta
                </Button>
                <span className="qz-ayuda" role="status">
                  {ps.length >= QUIZ_MAX
                    ? `Llegaste al máximo de ${QUIZ_MAX} preguntas.`
                    : faltan > 0 && ps.length > 0
                      ? `Agrega al menos ${faltan} más para publicar el quiz.`
                      : ""}
                </span>
              </div>

              {estado.problema && ps.length > 0 && (
                <Callout tono="warning" titulo="El quiz aún no está listo">
                  {estado.problema} Mientras tanto, el curso no se puede publicar con este quiz: complétalo o elimínalo.
                </Callout>
              )}

              <div className="qz-fila">
                {estado.listas > 0 && (
                  <Button variante="secondary" onClick={() => setProbar(true)}>
                    Vista previa del quiz
                  </Button>
                )}
                {ps.length > 0 && (
                  <Button variante="danger" onClick={() => setConfirmar({ k: "quiz" })}>
                    Eliminar quiz
                  </Button>
                )}
                {estado.completo && <Badge tono="ok">Quiz listo</Badge>}
              </div>
            </>
          )}
        </div>

        <aside className="qz-lado" aria-label="Lo que hace la plataforma">
          <section className="qz-info">
            <h3 className="qz-info__t">Lo que hace la plataforma</h3>
            <p className="qz-ayuda">No necesitas configurar XP ni insignias: se suman solas. Se aplican igual en todos los cursos.</p>
            <ul className="qz-info__lista">
              <li>
                <b>Experiencia (XP)</b>
                <span>+5 por responder y +5 por cada acierto al primer intento.</span>
              </li>
              <li>
                <b>Insignia «Módulo dominado»</b>
                <span>Con 80 % o más de aciertos en este quiz.</span>
              </li>
              <li>
                <b>Repaso espaciado</b>
                <span>Las preguntas falladas vuelven al día siguiente, a los 3 días y a los 7.</span>
              </li>
              <li>
                <b>Barra de dominio</b>
                <span>Cuenta los aciertos del curso, aparte del avance.</span>
              </li>
            </ul>
          </section>
          <Callout tono="info" titulo="Se activa con la experiencia del estudiante">
            Puedes armar el quiz ahora. La XP y las insignias empiezan a contar cuando tus estudiantes puedan responderlo en el curso.
          </Callout>
        </aside>
      </div>

      <ConfirmDialog
        abierto={!!confirmar}
        peligro
        titulo={confirmar?.k === "quiz" ? "¿Eliminar el quiz de este módulo?" : "¿Eliminar esta pregunta?"}
        confirmar="Eliminar"
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          if (!confirmar) return;
          if (confirmar.k === "quiz") quitarQuiz();
          else quitar(confirmar.id);
        }}
      >
        <p>
          {confirmar?.k === "quiz"
            ? `Se eliminarán sus ${ps.length} ${ps.length === 1 ? "pregunta" : "preguntas"}. `
            : "Se eliminará con sus respuestas y su explicación. "}
          Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}

/** Vista previa: responde el quiz como lo verá el estudiante (no guarda nada). */
function ProbarQuiz({ preguntas, onSalir }: { preguntas: PreguntaQuiz[]; onSalir: () => void }) {
  const [i, setI] = useState(0);
  const [eleccion, setEleccion] = useState<(number | null)[]>(() => preguntas.map(() => null));
  const fin = i >= preguntas.length;
  const aciertos = eleccion.filter((e, k) => e != null && e === preguntas[k]?.correcta).length;
  const p = preguntas[i];
  const elegida = p ? eleccion[i] : null;

  return (
    <section className="qz-probar" aria-label="Vista previa del quiz">
      <div className="qz-fila">
        <Badge tono="info">Vista previa · no se guarda</Badge>
        <Button variante="ghost" onClick={onSalir}>
          Volver a editar
        </Button>
      </div>
      {preguntas.length === 0 ? (
        <p className="ed-vacio">Completa al menos una pregunta para probar el quiz.</p>
      ) : fin ? (
        <div className="qz-probar__fin" role="status">
          <h3 className="qz-info__t">Quiz terminado</h3>
          <p>
            {aciertos} de {preguntas.length} correctas.
          </p>
          <div className="qz-fila">
            <Button
              onClick={() => {
                setI(0);
                setEleccion(preguntas.map(() => null));
              }}
            >
              Responder de nuevo
            </Button>
          </div>
        </div>
      ) : (
        p && (
          <>
            <span className="qz-ayuda">
              Pregunta {i + 1} de {preguntas.length}
            </span>
            <h3 className="qz-probar__p">{p.texto}</h3>
            <div className="qz-probar__ops" role="group" aria-label="Respuestas">
              {p.opciones.map((o, j) => {
                const marcada = elegida != null;
                const cls = marcada ? (j === p.correcta ? " qz-ans--ok" : j === elegida ? " qz-ans--mal" : " qz-ans--off") : "";
                return (
                  <button
                    key={j}
                    type="button"
                    className={`qz-ans${cls}`}
                    aria-pressed={elegida === j}
                    disabled={marcada}
                    onClick={() => setEleccion((e) => e.map((v, k) => (k === i ? j : v)))}
                  >
                    <span className="qz-num" aria-hidden="true">
                      {LETRAS[j]}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>
            {elegida != null && (
              <div className={`qz-fb${elegida === p.correcta ? " qz-fb--ok" : " qz-fb--mal"}`} role="status">
                <b>{elegida === p.correcta ? "Correcto" : `No es esa. La correcta es «${p.opciones[p.correcta ?? 0]}».`}</b>
                {p.explicacion.trim() && <span>{p.explicacion}</span>}
              </div>
            )}
            {elegida != null && (
              <div>
                <Button onClick={() => setI(i + 1)}>{i === preguntas.length - 1 ? "Ver resultado" : "Siguiente pregunta"}</Button>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}