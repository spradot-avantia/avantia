"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guardarCampoCursoAction } from "../../../lib/creador/actions";
import { obtenerCursoAction } from "../../../lib/creador/actionsEditor";
import { validarPublicacion } from "../../../lib/creador/reglasPublicacion";
import { PASOS_EDITOR, type CampoCurso, type CursoCompleto, type PasoEditor } from "../../../lib/creador/types";
import { validarCampoCurso } from "../../../lib/creador/validacion";
import { BadgeEstadoCurso } from "../Badge";
import { Button } from "../Button";
import type { EditorCtx } from "./contexto";
import { PasoAcceso } from "./PasoAcceso";
import { PasoEsencial } from "./PasoEsencial";
import { PasoEstructura } from "./PasoEstructura";
import { PasoModalidad } from "./PasoModalidad";
import { PasoObjetivo } from "./PasoObjetivo";
import { PasoRevisar } from "./PasoRevisar";
import { useAutosave } from "./useAutosave";
import "../creador.css";
import "./editor.css";

interface Props {
  cursoInicial: CursoCompleto;
  pasoInicial: PasoEditor;
  urlPublica: string;
}

const IDS = PASOS_EDITOR.map((p) => p.id);

function limpiar(c: CursoCompleto): CursoCompleto {
  return { ...c, objetivos: c.objetivos.filter((o) => o.trim()) };
}

/** Editor de curso de 6 pasos con autoguardado. Todo el estado vive aqui. */
export function EditorCurso({ cursoInicial, pasoInicial, urlPublica }: Props) {
  const router = useRouter();
  const auto = useAutosave();
  const { programar, cancelar } = auto;
  const [curso, setCurso] = useState<CursoCompleto>(cursoInicial);
  const [paso, setPaso] = useState<PasoEditor>(pasoInicial);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [anuncio, setAnuncio] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const tituloPaso = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);

  const cursoId = cursoInicial.id;
  const idx = Math.max(0, IDS.indexOf(paso));
  const meta = PASOS_EDITOR[idx];

  const validacion = useMemo(() => validarPublicacion(limpiar(curso)), [curso]);

  // ---- Navegacion entre pasos (?paso=) ------------------------------------
  const irAPaso = useCallback((p: PasoEditor) => {
    setPaso(p);
    window.history.pushState(null, "", `?paso=${p}`);
  }, []);

  useEffect(() => {
    const alVolver = () => {
      const p = new URLSearchParams(window.location.search).get("paso") as PasoEditor | null;
      setPaso(p && IDS.includes(p) ? p : "esencial");
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    tituloPaso.current?.focus();
    window.scrollTo({ top: 0 });
  }, [paso]);

  // ---- Anuncios ----------------------------------------------------------
  const anunciar = useCallback((m: string) => {
    setAnuncio((prev) => (prev === m ? `${m}​` : m));
  }, []);

  // ---- Campos del curso ---------------------------------------------------
  const guardarCampo = useCallback(
    (campo: CampoCurso, valor: unknown) => {
      const clave = `campo:${campo}`;
      const v = validarCampoCurso(campo, valor);
      if (!v.ok) {
        cancelar(clave);
        setErroresCampo((e) => ({ ...e, [campo]: v.error }));
        return;
      }
      setErroresCampo((e) => {
        if (!(campo in e)) return e;
        const resto = { ...e };
        delete resto[campo];
        return resto;
      });
      programar(clave, async () => {
        const r = await guardarCampoCursoAction(cursoId, campo, v.valor);
        if (!r.ok) {
          setErroresCampo((e) => ({ ...e, [campo]: r.campos?.[campo] ?? r.error }));
          setTocado((t) => ({ ...t, [campo]: true }));
        }
        return r;
      });
    },
    [cursoId, programar, cancelar],
  );

  const marcarTocado = useCallback((campo: string) => setTocado((t) => (t[campo] ? t : { ...t, [campo]: true })), []);

  const resincronizar = useCallback(async () => {
    await auto.flush();
    const r = await obtenerCursoAction(cursoId);
    if (r.ok) setCurso(r.data);
  }, [auto, cursoId]);

  const salir = useCallback(
    async (href: string) => {
      await auto.flush();
      router.push(href);
    },
    [auto, router],
  );

  const ctx: EditorCtx = {
    curso,
    setCurso,
    auto,
    erroresCampo,
    guardarCampo,
    tocado,
    marcarTocado,
    anunciar,
    avisar: setAviso,
    irAPaso,
    resincronizar,
    salir,
    urlPublica,
  };

  const hayCamposInvalidos = Object.keys(erroresCampo).length > 0;
  const publicado = curso.estado === "publicado";

  let indicador = "";
  let tono = auto.estado as string;
  if (auto.estado === "guardando") indicador = "Guardando…";
  else if (auto.estado === "error") indicador = auto.error ?? "No se pudo guardar.";
  else if (hayCamposInvalidos) {
    indicador = "Corrige los campos marcados para guardar";
    tono = "aviso";
  } else if (auto.estado === "guardado") indicador = publicado ? "Cambios guardados" : "Borrador guardado";

  const pasoEl = (() => {
    switch (paso) {
      case "esencial":
        return <PasoEsencial ctx={ctx} />;
      case "objetivo":
        return <PasoObjetivo ctx={ctx} />;
      case "estructura":
        return <PasoEstructura ctx={ctx} />;
      case "modalidad":
        return <PasoModalidad ctx={ctx} />;
      case "acceso":
        return <PasoAcceso ctx={ctx} />;
      default:
        return <PasoRevisar ctx={ctx} validacion={validacion} />;
    }
  })();

  const hecho = (id: PasoEditor) =>
    id === "revisar" ? publicado : !validacion.bloqueos.some((b) => b.paso === id);

  return (
    <div className="av-scope ed">
      <button type="button" className="cr-back ed-back" onClick={() => void salir("/cursos")}>
        ← Cursos
      </button>

      <header className="ed-head">
        <div className="ed-head__body">
          <p className="ed-kicker">Editar curso</p>
          <h1 className="ed-head__title">{curso.titulo.trim() || "Curso sin título"}</h1>
          <div className="ed-head__meta">
            <BadgeEstadoCurso estado={curso.estado} />
            <span role="status" aria-live="polite" className={`ed-save ed-save--${tono}`}>
              {indicador}
            </span>
            {auto.estado === "error" && (
              <Button variante="secondary" className="ed-btn-sm" onClick={auto.reintentar}>
                Reintentar
              </Button>
            )}
          </div>
        </div>
        <div className="ed-head__acciones">
          <Button variante="secondary" onClick={() => void salir(`/cursos/${cursoId}/vista-previa`)}>
            Vista previa
          </Button>
          <Button variante="secondary" onClick={() => void salir("/cursos")}>
            Guardar y salir
          </Button>
        </div>
      </header>

      {/* Pasos: escritorio = fila de botones; movil = progreso + selector */}
      <nav aria-label="Pasos del editor" className="ed-pasos">
        <div className="ed-pasos__movil">
          <span className="cr-stepper__compact-label">
            Paso {meta.numero} de {PASOS_EDITOR.length} · <strong>{meta.titulo}</strong>
          </span>
          <div className="cr-stepper__bar" aria-hidden="true">
            <i style={{ width: `${((idx + 1) / PASOS_EDITOR.length) * 100}%` }} />
          </div>
          <label className="av-sr-only" htmlFor="ed-ir-paso">
            Ir al paso
          </label>
          <select id="ed-ir-paso" className="av-input cr-input" value={paso} onChange={(e) => irAPaso(e.target.value as PasoEditor)}>
            {PASOS_EDITOR.map((p) => (
              <option key={p.id} value={p.id}>
                {p.numero}. {p.titulo}
              </option>
            ))}
          </select>
        </div>
        <ol className="ed-pasos__lista">
          {PASOS_EDITOR.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`cr-step ed-step${hecho(p.id) && p.id !== paso ? " cr-step--hecho" : ""}`}
                aria-current={p.id === paso ? "step" : undefined}
                onClick={() => irAPaso(p.id)}
              >
                <span className="cr-step__n">{hecho(p.id) && p.id !== paso ? "✓" : p.numero}</span>
                {p.titulo}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {aviso && (
        <div className="ed-aviso" role="alert">
          <span>{aviso}</span>
          <Button variante="ghost" className="ed-btn-sm" onClick={() => setAviso(null)}>
            Cerrar
          </Button>
        </div>
      )}

      <section className="ed-card" aria-labelledby="ed-paso-titulo">
        <h2 id="ed-paso-titulo" className="ed-card__title" tabIndex={-1} ref={tituloPaso}>
          {meta.numero}. {meta.titulo}
        </h2>
        {pasoEl}
      </section>

      <div className="ed-pie">
        {idx > 0 ? (
          <Button variante="secondary" onClick={() => irAPaso(IDS[idx - 1])}>
            ← Atrás
          </Button>
        ) : (
          <span />
        )}
        {idx < IDS.length - 1 && <Button onClick={() => irAPaso(IDS[idx + 1])}>Siguiente →</Button>}
      </div>

      <div className="av-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {anuncio}
      </div>
    </div>
  );
}
