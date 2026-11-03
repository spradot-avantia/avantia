"use client";

// Diseña tu academia: 5 preguntas que recomiendan un template (diseño 2.1).
// Las respuestas no se guardan; solo el template que el creador elige usar.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { elegirTemplateAction } from "../../../lib/creador/actions";
import {
  CONTENIDO_VACIO,
  ENCUESTA,
  infoTemplate,
  puntajeEncuesta,
  razonesEncuesta,
  TEMPLATES,
  type ClaveTemplate,
  type RespuestasEncuesta,
} from "../../../lib/creador/paginaReglas";
import { construirDatosSitio, type AcademiaSitio, type CursoSitio } from "../../../lib/sitio/tipos";
import { Button, LinkButton } from "../Button";
import { Callout } from "../Callout";
import { MiniTemplate } from "./MiniTemplate";
import { VistaNavegador } from "./VistaNavegador";
import "../creador.css";
import "./pagina.css";

const AVANCE_MS = 650;
const VACIAS: RespuestasEncuesta = [null, null, null, null, null];

interface Props {
  academia: AcademiaSitio;
  cursos: CursoSitio[];
  direccion: string;
}

export function Encuesta({ academia, cursos, direccion }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(-1); // -1 inicio, 0-4 preguntas, 5 resultado
  const [resp, setResp] = useState<RespuestasEncuesta>(VACIAS);
  const [mostrado, setMostrado] = useState<ClaveTemplate | null>(null);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const primero = useRef(true);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const puntaje = puntajeEncuesta(resp);
  const lider = puntaje.orden[0];
  const esPregunta = paso >= 0 && paso < ENCUESTA.length;
  const esResultado = paso === ENCUESTA.length;
  const visible = esResultado ? (mostrado ?? lider) : lider;

  function ir(n: number) {
    clearTimeout(timer.current);
    setAviso("");
    setPaso(n);
  }

  function elegirOpcion(i: number) {
    const nuevas = resp.slice();
    nuevas[paso] = i;
    setResp(nuevas);
    setAviso(`Con esto va ganando ${infoTemplate(puntajeEncuesta(nuevas).orden[0]).nombre}.`);
    clearTimeout(timer.current);
    const actual = paso;
    const reducido = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reducido) timer.current = setTimeout(() => ir(actual + 1), AVANCE_MS);
  }

  function usar(clave: ClaveTemplate) {
    setError(null);
    iniciar(async () => {
      const r = await elegirTemplateAction(clave);
      if (r.ok) router.push("/mi-academia/pagina");
      else setError(r.error);
    });
  }

  const pregunta = esPregunta ? ENCUESTA[paso] : null;
  const segundo = puntaje.orden[1];

  return (
    <div className="pg-enc pg-enc--doble">
      <div className="pg-enc">
        <div className="pg-enc__cab">
          <span className="pg-ov">Diseña tu academia</span>
          <div className="pg-puntos" aria-hidden="true">
            {ENCUESTA.map((_, i) => (
              <i key={i} className={resp[i] != null ? "is-on" : i === paso ? "is-ahora" : undefined} />
            ))}
          </div>
        </div>

        {paso === -1 && (
          <>
            <h1 className="pg-enc__h1" ref={titulo} tabIndex={-1}>
              ¿Qué página le queda mejor a tu academia?
            </h1>
            <p>
              Son 5 preguntas rápidas sobre cómo enseñas y a quién le vendes. Mientras respondes, ves cómo se vería tu
              página. Puedes cambiar de template cuando quieras.
            </p>
            <div className="pg-fila">
              <Button onClick={() => ir(0)}>Empezar</Button>
              <span className="pg-ayuda">Toma menos de un minuto.</span>
            </div>
          </>
        )}

        {pregunta && (
          <>
            <span className="pg-ayuda">
              Pregunta {paso + 1} de {ENCUESTA.length}
            </span>
            <h1 className="pg-enc__h1" ref={titulo} tabIndex={-1} id="pg-preg">
              {pregunta.titulo}
            </h1>
            <div className="pg-opciones" role="group" aria-labelledby="pg-preg">
              {pregunta.opciones.map((o, i) => (
                <button key={o.texto} type="button" className="pg-opcion" aria-pressed={resp[paso] === i} onClick={() => elegirOpcion(i)}>
                  <span className="pg-opcion__n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="pg-opcion__t">
                    <b>{o.texto}</b>
                    {o.detalle && <span className="pg-ayuda">{o.detalle}</span>}
                  </span>
                </button>
              ))}
            </div>
            <p className="pg-feedback" role="status" aria-live="polite">
              {aviso}
            </p>
            <div className="pg-fila">
              <Button variante="ghost" onClick={() => ir(paso - 1)}>
                Atrás
              </Button>
              {resp[paso] != null && (
                <Button variante="secondary" onClick={() => ir(paso + 1)}>
                  {paso === ENCUESTA.length - 1 ? "Ver mi recomendación" : "Siguiente"}
                </Button>
              )}
            </div>
          </>
        )}

        {esResultado && (
          <>
            <span className="pg-ov">Te recomendamos</span>
            <h1 className="pg-enc__h1" ref={titulo} tabIndex={-1}>
              {infoTemplate(lider).nombre}
            </h1>
            <p>{infoTemplate(lider).descripcion}</p>
            <ul className="pg-razones">
              {razonesEncuesta(resp, lider).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="pg-ayuda">
              {puntaje.puntos[segundo] > 0 ? `También podría servirte ${infoTemplate(segundo).nombre}. ` : ""}
              Compara los tres en la vista previa:
            </p>
            <div className="pg-switches" role="group" aria-label="Template en la vista previa">
              {TEMPLATES.map((t) => (
                <button key={t.clave} type="button" className="pg-switch" aria-pressed={visible === t.clave} onClick={() => setMostrado(t.clave)}>
                  {t.nombre}
                  {t.clave === lider ? " (recomendado)" : ""}
                </button>
              ))}
            </div>
            {error && <Callout tono="danger" titulo="No pudimos guardar el template">{error}</Callout>}
            <div className="pg-fila">
              <Button onClick={() => usar(visible)} disabled={guardando}>
                {guardando ? "Guardando…" : `Usar ${infoTemplate(visible).nombre}`}
              </Button>
              <LinkButton href={`/mi-academia/templates/${visible}`} variante="secondary">
                Ver el template {infoTemplate(visible).nombre}
              </LinkButton>
              <Button
                variante="ghost"
                onClick={() => {
                  setResp(VACIAS);
                  setMostrado(null);
                  ir(-1);
                }}
              >
                Empezar de nuevo
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="pg-enc" aria-label="Así va tu página">
        <div className="pg-enc__cab">
          <span className="pg-ayuda">Tu página va tomando forma</span>
          <b>{esResultado ? infoTemplate(visible).nombre : puntaje.total ? `Va ganando ${infoTemplate(lider).nombre}` : "Elige para ver"}</b>
        </div>
        {esResultado ? (
          <VistaNavegador
            direccion={direccion}
            d={construirDatosSitio({ contenido: CONTENIDO_VACIO, template: visible, academia, cursos, modo: "vista" })}
          />
        ) : (
          <VistaNavegador direccion={direccion}>
            <div className="pg-mini-marco">
              <MiniTemplate clave={lider} color={academia.colorPrimario} />
            </div>
          </VistaNavegador>
        )}
        <div className="pg-barras">
          {TEMPLATES.map((t) => {
            const pct = puntaje.total ? Math.round((puntaje.puntos[t.clave] / puntaje.total) * 100) : 0;
            return (
              <div key={t.clave} className={`pg-barra${t.clave === lider && puntaje.total ? " pg-barra--gana" : ""}`}>
                <b>{t.nombre}</b>
                <span className="pg-barra__pista" aria-hidden="true">
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}