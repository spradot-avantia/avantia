"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { responderQuizAction } from "../../lib/alumno/actions";
import type { PreguntaParaAlumno } from "../../lib/alumno/quiz";
import "./alumno.css";

interface Props {
  cursoId: string;
  moduloId: string;
  moduloTitulo: string;
  preguntas: PreguntaParaAlumno[];
  /** Ruta a la que vuelve al terminar (siguiente lección o cierre). */
  volverA: string;
  umbral: number;
}

interface Corregida {
  acierto: boolean;
  correcta: number;
  explicacion: string;
  elegida: number;
  xp: number;
}

/** Quiz de repaso: una pregunta por vez; se corrige en el servidor al responder. */
export function QuizPlayer({ cursoId, moduloId, moduloTitulo, preguntas, volverA, umbral }: Props) {
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [res, setRes] = useState<Corregida | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [pendiente, start] = useTransition();
  const [intento, setIntento] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);

  const p = preguntas[i];
  const fin = i >= preguntas.length;

  function responder() {
    if (elegida === null || !p) return;
    setError(null);
    start(async () => {
      const r = await responderQuizAction(cursoId, moduloId, p.id, elegida);
      if (!r.ok) return setError(r.error);
      setRes({ acierto: r.acierto, correcta: r.correcta, explicacion: r.explicacion, elegida, xp: r.xpGanada });
      if (r.acierto) setAciertos((a) => a + 1);
      setXpTotal((x) => x + r.xpGanada);
    });
  }

  function siguiente() {
    setI((n) => n + 1);
    setElegida(null);
    setRes(null);
    setTimeout(() => titulo.current?.focus(), 0);
  }

  function repetir() {
    setI(0);
    setElegida(null);
    setRes(null);
    setAciertos(0);
    setXpTotal(0);
    setIntento((n) => n + 1);
  }

  if (fin) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    const dominado = intento === 0 && aciertos / preguntas.length >= umbral;
    return (
      <div className="al-quiz" role="status">
        <p className="al-muted">Quiz de repaso · {moduloTitulo}</p>
        <h1 ref={titulo} tabIndex={-1}>
          {aciertos} de {preguntas.length} correctas
        </h1>
        <div className="al-bar" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
        {dominado ? (
          <p className="al-badge al-badge--ok">🏅 Módulo dominado</p>
        ) : (
          <p className="al-muted">
            {intento === 0
              ? "Para dominar el módulo necesitas 80 % de aciertos al primer intento. Puedes repasar y volver a intentarlo."
              : "Repasar sirve: el XP y la insignia cuentan solo desde el primer intento."}
          </p>
        )}
        {xpTotal > 0 && <p className="al-toast">+{xpTotal} XP</p>}
        <div className="al-pager">
          <button type="button" className="al-btn al-btn--sec" onClick={repetir}>
            Repetir quiz
          </button>
          <Link href={volverA} className="al-btn">
            Continuar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="al-quiz">
      <p className="al-muted">
        Quiz de repaso · {moduloTitulo} · Pregunta {i + 1} de {preguntas.length}
      </p>
      <div className="al-bar" aria-hidden="true">
        <span style={{ width: `${(i / preguntas.length) * 100}%` }} />
      </div>
      <h1 ref={titulo} tabIndex={-1} className="al-quiz__q">
        {p.texto}
      </h1>
      <fieldset className="al-quiz__ops" disabled={!!res || pendiente}>
        <legend className="av-sr-only">Elige una respuesta</legend>
        {p.opciones.map((o, k) => {
          const estado = res ? (k === res.correcta ? "ok" : k === res.elegida ? "mal" : "") : "";
          return (
            <label key={k} className={`al-quiz__op${elegida === k ? " is-sel" : ""}${estado ? ` al-quiz__op--${estado}` : ""}`}>
              <input type="radio" name={`q-${p.id}`} checked={elegida === k} onChange={() => setElegida(k)} />
              <span>{o}</span>
              {estado === "ok" && <span aria-hidden="true">✓</span>}
              {estado === "mal" && <span aria-hidden="true">✕</span>}
              {estado && <span className="av-sr-only">{estado === "ok" ? " (respuesta correcta)" : " (tu respuesta)"}</span>}
            </label>
          );
        })}
      </fieldset>
      {error && (
        <p className="al-alert al-alert--error" role="alert">
          {error}
        </p>
      )}
      {res ? (
        <div role="status" className={`al-quiz__fb ${res.acierto ? "is-ok" : "is-mal"}`}>
          <strong>{res.acierto ? "¡Correcto!" : "Esta vez no."}</strong>
          {res.explicacion && <p>{res.explicacion}</p>}
          {res.xp > 0 && <p className="al-muted">+{res.xp} XP</p>}
        </div>
      ) : null}
      <div className="al-pager">
        {res ? (
          <button type="button" className="al-btn" onClick={siguiente}>
            {i + 1 < preguntas.length ? "Siguiente pregunta →" : "Ver mi resultado"}
          </button>
        ) : (
          <button type="button" className="al-btn" onClick={responder} disabled={elegida === null || pendiente}>
            {pendiente ? "Revisando…" : "Responder"}
          </button>
        )}
      </div>
    </div>
  );
}
