"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { responderQuizAction } from "../../lib/alumno/actions";
import type { PreguntaParaAlumno } from "../../lib/alumno/quiz";
import { IconoCheck, IconoEquis, IconoFlecha, IconoMedalla } from "../ui/Iconos";
import "./alumno.css";

type PreguntaPlayer = PreguntaParaAlumno & { cursoId?: string; moduloId?: string };

interface Props {
  /** Por defecto, los de cada pregunta (el repaso mezcla cursos y módulos). */
  cursoId?: string;
  moduloId?: string;
  moduloTitulo: string;
  /** "repaso": preguntas falladas que vuelven (sin XP ni insignia). */
  modo?: "quiz" | "repaso";
  preguntas: PreguntaPlayer[];
  /** Ruta a la que vuelve al terminar (siguiente lección o cierre). */
  volverA: string;
  /** Ya no se usa: el veredicto de «dominado» lo da el servidor (quizReglas.estadoDeModulo). */
  umbral?: number;
}

interface Corregida {
  acierto: boolean;
  correcta: number;
  explicacion: string;
  elegida: number;
  xp: number;
}

/** Quiz de repaso: una pregunta por vez; se corrige en el servidor al responder. */
export function QuizPlayer({ cursoId, moduloId, moduloTitulo, modo = "quiz", preguntas, volverA }: Props) {
  const repaso = modo === "repaso";
  const rotulo = repaso ? "Repaso de hoy" : `Quiz de repaso · ${moduloTitulo}`;
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [res, setRes] = useState<Corregida | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);
  // Veredicto del servidor (todas las respuestas guardadas, no solo esta pasada): coincide con /progreso.
  const [dominadoServidor, setDominadoServidor] = useState(false);
  const [xpTotal, setXpTotal] = useState(0);
  const [pendiente, start] = useTransition();
  const [intento, setIntento] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  // Al responder, el fieldset se deshabilita y el foco se perdería: pasa al resultado para que se lea.
  useEffect(() => {
    if (res) feedback.current?.focus();
  }, [res]);

  const p = preguntas[i];
  const fin = i >= preguntas.length;

  function responder() {
    if (elegida === null || !p) return;
    setError(null);
    start(async () => {
      const r = await responderQuizAction(p.cursoId ?? cursoId ?? "", p.moduloId ?? moduloId ?? "", p.id, elegida);
      if (!r.ok) return setError(r.error);
      setRes({ acierto: r.acierto, correcta: r.correcta, explicacion: r.explicacion, elegida, xp: r.xpGanada });
      if (r.acierto) setAciertos((a) => a + 1);
      setDominadoServidor(r.dominado);
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
    setDominadoServidor(false);
    setXpTotal(0);
    setIntento((n) => n + 1);
  }

  if (fin) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    const dominado = !repaso && dominadoServidor;
    return (
      <div className="al-quiz" role="status">
        <p className="al-muted">{rotulo}</p>
        <h1 ref={titulo} tabIndex={-1}>
          {aciertos} de {preguntas.length} correctas
        </h1>
        <div className="al-bar" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
        {repaso ? (
          <p className="al-muted">Las que fallaste vuelven en unos días: repasar poco y seguido es lo que hace que se recuerde. Esto no suma XP.</p>
        ) : dominado ? (
          <p className="al-badge al-badge--ok">
            <IconoMedalla tam={16} /> Módulo dominado
          </p>
        ) : (
          <p className="al-muted">
            {intento === 0
              ? "Para dominar el módulo necesitas 80 % de aciertos al primer intento. Puedes repasar y volver a intentarlo."
              : "Repasar sirve: el XP y la insignia cuentan solo desde el primer intento."}
          </p>
        )}
        {xpTotal > 0 && <p className="al-toast">+{xpTotal} XP</p>}
        <div className="al-pager">
          {!repaso && (
            <button type="button" className="al-btn al-btn--sec" onClick={repetir}>
              Repetir quiz
            </button>
          )}
          <Link href={volverA} className="al-btn">
            {repaso ? "Listo" : "Continuar"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="al-quiz">
      <p className="al-muted">
        {rotulo} · Pregunta {i + 1} de {preguntas.length}
      </p>
      <div className="al-bar" aria-hidden="true">
        <span style={{ width: `${(i / preguntas.length) * 100}%` }} />
      </div>
      <h1 ref={titulo} tabIndex={-1} className="al-quiz__q">
        {p.texto}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!res && elegida !== null && !pendiente) responder();
        }}
      >
      <fieldset className="al-quiz__ops" disabled={!!res || pendiente}>
        <legend className="av-sr-only">Elige una respuesta</legend>
        {p.opciones.map((o, k) => {
          const estado = res ? (k === res.correcta ? "ok" : k === res.elegida ? "mal" : "") : "";
          return (
            <label key={k} className={`al-quiz__op${elegida === k ? " is-sel" : ""}${estado ? ` al-quiz__op--${estado}` : ""}`}>
              <input type="radio" name={`q-${p.id}`} checked={elegida === k} onChange={() => setElegida(k)} />
              <span>{o}</span>
              {estado === "ok" && <IconoCheck tam={18} className="al-quiz__ico" />}
              {estado === "mal" && <IconoEquis tam={18} className="al-quiz__ico" />}
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
        <div ref={feedback} tabIndex={-1} role="status" className={`al-quiz__fb ${res.acierto ? "is-ok" : "is-mal"}`}>
          <strong>{res.acierto ? "¡Correcto!" : "Esta vez no."}</strong>
          {res.explicacion && <p>{res.explicacion}</p>}
          {res.xp > 0 && <p className="al-muted">+{res.xp} XP</p>}
        </div>
      ) : null}
      <div className="al-pager">
        {res ? (
          <button type="button" className="al-btn" onClick={siguiente}>
            {i + 1 < preguntas.length ? (
              <>
                Siguiente pregunta <IconoFlecha tam={18} />
              </>
            ) : (
              "Ver mi resultado"
            )}
          </button>
        ) : (
          <button type="submit" className="al-btn" disabled={elegida === null || pendiente}>
            {pendiente ? "Revisando…" : "Responder"}
          </button>
        )}
      </div>
      </form>
    </div>
  );
}
