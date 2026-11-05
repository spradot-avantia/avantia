"use client";

// Pantalla de UN módulo (ADR 029, F1): presentación, lecciones y quiz de repaso.
// Mismo patrón de autoguardado que el editor de curso: cada cambio se valida en el
// cliente, se programa con debounce y se serializa en una sola cola.
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { actualizarModuloAction, obtenerCursoAction } from "../../../lib/creador/actionsEditor";
import type { CursoCompleto, Modulo } from "../../../lib/creador/types";
import {
  DESCRIPCION_MODULO_MAX,
  DURACION_MAX_MIN,
  OBJETIVOS_MODULO_MAX,
  OBJETIVO_MODULO_MAX,
  descripcionModulo,
  duracionMin,
  tituloModulo,
} from "../../../lib/creador/validacion";
import { Button } from "../Button";
import { Field, Input, Textarea } from "../Field";
import { FilaQuiz } from "./AccionesFila";
import { EditorLecciones } from "./EditorLecciones";
import { EditorQuiz } from "./EditorQuiz";
import type { EditorCtx } from "./contexto";
import { resumenModulo } from "./PasoEstructura";
import { useAutosave } from "./useAutosave";
import "../creador.css";
import "./editor.css";
import "./modulo.css";

interface Props {
  cursoInicial: CursoCompleto;
  moduloId: string;
  urlPublica: string;
}

export function EditorModulo({ cursoInicial, moduloId, urlPublica }: Props) {
  const router = useRouter();
  const auto = useAutosave();
  const [curso, setCurso] = useState<CursoCompleto>(cursoInicial);
  const [anuncio, setAnuncio] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [quizAbierto, setQuizAbierto] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const indice = curso.modulos.findIndex((m) => m.id === moduloId);
  const modulo: Modulo | undefined = curso.modulos[indice];

  const anunciar = useCallback((m: string) => setAnuncio((prev) => (prev === m ? `${m}​` : m)), []);
  const resincronizar = useCallback(async () => {
    await auto.flush();
    const r = await obtenerCursoAction(cursoInicial.id);
    if (r.ok) setCurso(r.data);
  }, [auto, cursoInicial.id]);
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
    erroresCampo: {},
    guardarCampo: () => undefined,
    tocado: {},
    marcarTocado: () => undefined,
    anunciar,
    avisar: setAviso,
    irAPaso: (p) => void salir(`/cursos/${cursoInicial.id}/editar?paso=${p}`),
    resincronizar,
    salir,
    urlPublica,
  };

  if (!modulo) return null;

  const volver = () => void salir(`/cursos/${curso.id}/editar?paso=estructura`);
  const mapa = (fn: (m: Modulo) => Modulo) =>
    setCurso((c) => ({ ...c, modulos: c.modulos.map((m) => (m.id === moduloId ? fn(m) : m)) }));

  let indicador = "";
  if (auto.estado === "guardando") indicador = "Guardando…";
  else if (auto.estado === "error") indicador = auto.error ?? "No se pudo guardar.";
  else if (auto.estado === "guardado") indicador = "Cambios guardados";

  if (quizAbierto) {
    return (
      <div className="av-scope ed">
        <EditorQuiz ctx={ctx} modulo={modulo} numero={indice + 1} onVolver={() => setQuizAbierto(false)} />
        <div className="av-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {anuncio}
        </div>
      </div>
    );
  }

  // ---- Presentación ---------------------------------------------------------
  const eTitulo = tituloModulo.safeParse(modulo.titulo);
  const dsc = descripcionModulo.safeParse(modulo.descripcion ?? "");
  const eDesc = dsc.success ? undefined : dsc.error.issues[0].message;
  const dur = duracionMin.safeParse(modulo.duracionMin);
  const eDur = dur.success ? undefined : dur.error.issues[0].message;
  const objetivos = modulo.objetivos;
  const eObjetivos = objetivos.map((o) => (o.length > OBJETIVO_MODULO_MAX ? `Cada punto admite hasta ${OBJETIVO_MODULO_MAX} caracteres.` : undefined));

  const cambiarTitulo = (v: string) => {
    mapa((m) => ({ ...m, titulo: v }));
    if (!tituloModulo.safeParse(v).success) return auto.cancelar(`mod:${moduloId}:titulo`);
    auto.programar(`mod:${moduloId}:titulo`, () => actualizarModuloAction(moduloId, { titulo: v }));
  };
  const cambiarDescripcion = (v: string) => {
    mapa((m) => ({ ...m, descripcion: v }));
    if (!descripcionModulo.safeParse(v).success) return auto.cancelar(`mod:${moduloId}:desc`);
    auto.programar(`mod:${moduloId}:desc`, () => actualizarModuloAction(moduloId, { descripcion: v }));
  };
  const cambiarDuracion = (v: string) => {
    const n = v.trim() === "" ? null : Number(v);
    mapa((m) => ({ ...m, duracionMin: n !== null && Number.isFinite(n) ? n : null }));
    if (!duracionMin.safeParse(n).success) return auto.cancelar(`mod:${moduloId}:dur`);
    auto.programar(`mod:${moduloId}:dur`, () => actualizarModuloAction(moduloId, { duracionMin: n }));
  };
  /** Guarda la lista sin filas vacías ni pasadas de largo (se pueden dejar filas en blanco mientras se escribe). */
  const guardarObjetivos = (lista: string[]) => {
    const limpia = lista.map((o) => o.trim()).filter(Boolean);
    if (limpia.some((o) => o.length > OBJETIVO_MODULO_MAX)) return auto.cancelar(`mod:${moduloId}:obj`);
    auto.programar(`mod:${moduloId}:obj`, () => actualizarModuloAction(moduloId, { objetivos: limpia }));
  };
  const cambiarObjetivo = (i: number, v: string) => {
    const lista = objetivos.map((o, k) => (k === i ? v : o));
    mapa((m) => ({ ...m, objetivos: lista }));
    guardarObjetivos(lista);
  };
  const agregarObjetivo = () => {
    if (objetivos.length >= OBJETIVOS_MODULO_MAX) return;
    mapa((m) => ({ ...m, objetivos: [...m.objetivos, ""] }));
    anunciar("Punto agregado");
    setTimeout(() => document.getElementById(`mod-obj-${objetivos.length}`)?.focus(), 0);
  };
  const quitarObjetivo = (i: number) => {
    const lista = objetivos.filter((_, k) => k !== i);
    mapa((m) => ({ ...m, objetivos: lista }));
    guardarObjetivos(lista);
    anunciar("Punto quitado");
    setTimeout(() => document.getElementById("mod-add-obj")?.focus(), 0);
  };

  const anterior = curso.modulos[indice - 1];
  const siguiente = curso.modulos[indice + 1];
  const ir = (m: Modulo) => void salir(`/cursos/${curso.id}/modulos/${m.id}`);

  return (
    <div className="av-scope ed md">
      <nav aria-label="Ruta" className="md-migas">
        <ol>
          <li>
            <a
              href="/cursos"
              onClick={(e) => {
                e.preventDefault();
                void salir("/cursos");
              }}
            >
              Cursos
            </a>
          </li>
          <li>
            <a
              href={`/cursos/${curso.id}/editar?paso=estructura`}
              onClick={(e) => {
                e.preventDefault();
                volver();
              }}
            >
              {curso.titulo.trim() || "Curso sin título"}
            </a>
          </li>
          <li aria-current="page">{modulo.titulo.trim() || "Módulo sin nombre"}</li>
        </ol>
      </nav>

      <header className="ed-head">
        <div className="ed-head__body">
          <h1 className="ed-head__title" tabIndex={-1} ref={tituloRef}>
            Módulo {indice + 1}: {modulo.titulo.trim() || "sin nombre"}
          </h1>
          <div className="ed-head__meta">
            <span className="md-resumen">{resumenModulo(modulo)}</span>
            <span role="status" aria-live="polite" className={`ed-save ed-save--${auto.estado}`}>
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
          <Button variante="secondary" onClick={volver}>
            ← Volver a los módulos
          </Button>
        </div>
      </header>

      {aviso && (
        <div className="ed-aviso" role="alert">
          <span>{aviso}</span>
          <Button variante="ghost" className="ed-btn-sm" onClick={() => setAviso(null)}>
            Cerrar
          </Button>
        </div>
      )}

      <section className="ed-card" aria-labelledby="md-pres-t">
        <h2 id="md-pres-t" className="ed-card__title">
          Presentación
        </h2>
        <div className="ed-form">
          <Field id="mod-titulo" label="Nombre del módulo" error={eTitulo.success ? undefined : eTitulo.error.issues[0].message}>
            <Input id="mod-titulo" value={modulo.titulo} autoComplete="off" invalido={!eTitulo.success} onChange={(e) => cambiarTitulo(e.target.value)} />
          </Field>

          <Field
            id="mod-desc"
            label="Descripción"
            opcional
            ayuda="Cuenta de qué trata el módulo y por qué importa. Es lo primero que lee el estudiante al llegar."
            contador={`${(modulo.descripcion ?? "").length}/${DESCRIPCION_MODULO_MAX}`}
            error={eDesc}
          >
            <Textarea
              id="mod-desc"
              value={modulo.descripcion ?? ""}
              rows={4}
              maxLength={DESCRIPCION_MODULO_MAX}
              conAyuda
              invalido={!!eDesc}
              onChange={(e) => cambiarDescripcion(e.target.value)}
            />
          </Field>

          <fieldset className="md-objetivos">
            <legend className="cr-field__label">
              Qué aprenderás <span className="cr-field__opt">(opcional, hasta {OBJETIVOS_MODULO_MAX} puntos)</span>
            </legend>
            <p className="cr-field__hint" id="mod-obj-ayuda">
              Escribe lo que la persona podrá hacer al terminar el módulo. Un punto por casilla.
            </p>
            <ul className="md-objetivos__lista">
              {objetivos.map((o, i) => (
                <li key={i} className="md-objetivo">
                  <div className="md-objetivo__campo">
                    <label className="av-sr-only" htmlFor={`mod-obj-${i}`}>
                      Punto {i + 1}
                    </label>
                    <Input
                      id={`mod-obj-${i}`}
                      value={o}
                      autoComplete="off"
                      placeholder={`Punto ${i + 1}, por ejemplo: “Limpiar una tabla de datos”`}
                      maxLength={OBJETIVO_MODULO_MAX + 20}
                      invalido={!!eObjetivos[i]}
                      onChange={(e) => cambiarObjetivo(i, e.target.value)}
                    />
                    {eObjetivos[i] && (
                      <span className="cr-field__error" role="alert">
                        {eObjetivos[i]}
                      </span>
                    )}
                  </div>
                  <button type="button" className="ed-icono ed-icono--peligro" aria-label={`Quitar punto ${i + 1}`} onClick={() => quitarObjetivo(i)}>
                    <span aria-hidden="true">✕</span>
                  </button>
                </li>
              ))}
            </ul>
            <Button id="mod-add-obj" variante="secondary" onClick={agregarObjetivo} disabled={objetivos.length >= OBJETIVOS_MODULO_MAX}>
              + Agregar punto
            </Button>
          </fieldset>

          <Field id="mod-dur" label="Duración estimada (minutos)" opcional ayuda="Cuánto demora, en total, completar el módulo." error={eDur}>
            <Input
              id="mod-dur"
              type="number"
              inputMode="numeric"
              min={1}
              max={DURACION_MAX_MIN}
              className="md-dur"
              value={modulo.duracionMin ?? ""}
              conAyuda
              invalido={!!eDur}
              onChange={(e) => cambiarDuracion(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="ed-card" aria-labelledby="md-lec-t">
        <h2 id="md-lec-t" className="ed-card__title">
          Lecciones
        </h2>
        <EditorLecciones ctx={ctx} modulo={modulo} />
      </section>

      <section className="ed-card" aria-labelledby="md-quiz-t">
        <h2 id="md-quiz-t" className="ed-card__title">
          Quiz de repaso
        </h2>
        <FilaQuiz moduloId={modulo.id} preguntas={modulo.quiz} onAbrir={() => setQuizAbierto(true)} />
      </section>

      <div className="ed-pie md-pie">
        {anterior ? (
          <Button variante="secondary" onClick={() => ir(anterior)}>
            ← Módulo anterior
          </Button>
        ) : (
          <span />
        )}
        {siguiente ? (
          <Button onClick={() => ir(siguiente)}>Módulo siguiente →</Button>
        ) : (
          <Button onClick={volver}>Volver a los módulos</Button>
        )}
      </div>

      <div className="av-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {anuncio}
      </div>
    </div>
  );
}
