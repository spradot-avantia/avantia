"use client";

// Paso 3: ESQUEMA DEL CURSO (ADR 032, F2). Cada módulo es un bloque plegable que muestra sus
// lecciones; desde aquí se renombra, reordena, agrega y elimina sin abrir el módulo. La
// presentación («Qué aprenderás», duración), los materiales, el quiz y el contenido de cada
// lección se editan en la pantalla del módulo (ADR 029).
import { useEffect, useState } from "react";
import {
  actualizarLeccionAction,
  crearLeccionAction,
  crearModuloAction,
  eliminarLeccionAction,
  eliminarModuloAction,
  moverLeccionAction,
  moverModuloAction,
} from "../../../lib/creador/actions";
import { actualizarModuloAction, aplicarEstructuraSugeridaAction, aplicarPlantillaModuloAction } from "../../../lib/creador/actionsEditor";
import { PLANTILLA_MODULO } from "../../../lib/creador/plantillaModulo";
import { estadoQuiz } from "../../../lib/creador/quiz";
import { leccionLista } from "../../../lib/creador/reglasPublicacion";
import type { Leccion, Modulo, TipoLeccion } from "../../../lib/creador/types";
import { tituloLeccion, tituloModulo } from "../../../lib/creador/validacion";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Input } from "../Field";
import { Acciones } from "./AccionesFila";
import { ConfirmDialog } from "./ConfirmDialog";
import type { EditorCtx } from "./contexto";
import "./modulo.css";

const TIPO: Record<TipoLeccion, string> = { video: "Video", texto: "Texto", documento: "Documento" };

/** Texto «3 lecciones · 25 min» de un módulo. */
export function resumenModulo(m: Modulo): string {
  const partes = [`${m.lecciones.length} ${m.lecciones.length === 1 ? "lección" : "lecciones"}`];
  if (m.duracionMin) partes.push(`${m.duracionMin} min`);
  return partes.join(" · ");
}

/** Estado de contenido de un módulo: sin lecciones, con lecciones incompletas o listo. */
export function estadoModulo(m: Modulo): "vacio" | "falta" | "listo" {
  if (m.lecciones.length === 0) return "vacio";
  return m.lecciones.every(leccionLista) ? "listo" : "falta";
}

type Pendiente = { k: "modulo"; m: Modulo } | { k: "leccion"; l: Leccion };

export function PasoEstructura({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso, auto } = ctx;
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [foco, setFoco] = useState<string | null>(null);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  // Escritorio: el esquema parte desplegado. Móvil: plegado, para no hacer una pantalla de miles de px.
  useEffect(() => {
    if (window.matchMedia("(min-width: 700px)").matches) setAbiertos(new Set(curso.modulos.map((m) => m.id)));
    // Solo al montar: después manda lo que el creador despliegue o pliegue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!foco) return;
    document.getElementById(foco)?.focus();
    setFoco(null);
  }, [foco, curso.modulos, abiertos]);

  const abrirModulo = (id: string) => setAbiertos((s) => new Set(s).add(id));
  const alternar = (id: string) =>
    setAbiertos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const irAlModulo = (m: Modulo, leccionId?: string) =>
    void ctx.salir(`/cursos/${curso.id}/modulos/${m.id}${leccionId ? `?leccion=${leccionId}` : ""}`);

  const mapMod = (id: string, fn: (m: Modulo) => Modulo) =>
    setCurso((c) => ({ ...c, modulos: c.modulos.map((m) => (m.id === id ? fn(m) : m)) }));

  // ---- Módulos --------------------------------------------------------------
  const agregarModulo = async () => {
    setTrabajando(true);
    const titulo = `Módulo ${curso.modulos.length + 1}`;
    const r = await auto.encolar(null, () => crearModuloAction(curso.id, titulo));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    const id = r.data.id;
    setCurso((c) => ({
      ...c,
      modulos: [
        ...c.modulos,
        { id, cursoId: c.id, titulo, orden: c.modulos.length, descripcion: null, objetivos: [], duracionMin: null, lecciones: [], materiales: [] },
      ],
    }));
    abrirModulo(id);
    ctx.anunciar(`${titulo} agregado`);
    setFoco(`esq-mod-titulo-${id}`);
  };

  const usarSugerida = async () => {
    setTrabajando(true);
    const r = await auto.encolar(null, () => aplicarEstructuraSugeridaAction(curso.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    setCurso((c) => ({ ...c, modulos: r.data.modulos }));
    setAbiertos(new Set(r.data.modulos.map((m) => m.id)));
    ctx.anunciar("Estructura sugerida agregada: 3 módulos");
  };

  const renombrarModulo = (m: Modulo, valor: string) => {
    mapMod(m.id, (x) => ({ ...x, titulo: valor }));
    if (!tituloModulo.safeParse(valor).success) return auto.cancelar(`mod:${m.id}:titulo`);
    auto.programar(`mod:${m.id}:titulo`, () => actualizarModuloAction(m.id, { titulo: valor }));
  };

  const moverModulo = async (m: Modulo, dir: "subir" | "bajar") => {
    const i = curso.modulos.findIndex((x) => x.id === m.id);
    const j = dir === "subir" ? i - 1 : i + 1;
    if (j < 0 || j >= curso.modulos.length) return;
    setCurso((c) => {
      const mods = [...c.modulos];
      [mods[i], mods[j]] = [mods[j], mods[i]];
      return { ...c, modulos: mods };
    });
    ctx.anunciar(`${m.titulo || "Módulo"} movido a la posición ${j + 1} de ${curso.modulos.length}`);
    const r = await auto.encolar(null, () => moverModuloAction(m.id, dir));
    if (!r.ok) {
      ctx.avisar(r.error);
      await ctx.resincronizar();
    }
  };

  const eliminarModulo = async (m: Modulo) => {
    setPendiente(null);
    setTrabajando(true);
    const r = await auto.encolar(null, () => eliminarModuloAction(m.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    auto.cancelar(`mod:${m.id}`);
    m.lecciones.forEach((l) => auto.cancelar(`lec:${l.id}:`));
    setCurso((c) => ({ ...c, modulos: c.modulos.filter((x) => x.id !== m.id) }));
    ctx.anunciar(`Módulo ${m.titulo} eliminado`);
    setFoco("ed-add-modulo");
  };

  // ---- Lecciones ------------------------------------------------------------
  const agregarLeccion = async (m: Modulo) => {
    setTrabajando(true);
    const titulo = "Nueva lección";
    const r = await auto.encolar(null, () => crearLeccionAction(m.id, { titulo, tipo: "video" }));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    const id = r.data.id;
    mapMod(m.id, (x) => ({
      ...x,
      lecciones: [
        ...x.lecciones,
        {
          id,
          moduloId: m.id,
          cursoId: curso.id,
          titulo,
          tipo: "video",
          contenidoUrl: null,
          contenidoTexto: null,
          storagePath: null,
          contenidoTipo: null,
          archivoNombre: null,
          bytes: null,
          descripcion: null,
          duracionMin: null,
          orden: x.lecciones.length,
        },
      ],
    }));
    abrirModulo(m.id);
    ctx.anunciar("Lección agregada");
    setFoco(`esq-lec-titulo-${id}`);
  };

  /** Agrega las lecciones de la plantilla a un módulo vacío; solo se reemplazan las lecciones de ese módulo. */
  const usarPlantilla = async (m: Modulo) => {
    setTrabajando(true);
    const r = await auto.encolar(null, () => aplicarPlantillaModuloAction(curso.id, m.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    const lecciones = r.data.modulos.find((x) => x.id === m.id)?.lecciones ?? [];
    mapMod(m.id, (x) => ({ ...x, lecciones }));
    ctx.anunciar(`Plantilla aplicada: ${lecciones.length} lecciones`);
    setFoco(`esq-lec-titulo-${lecciones[0]?.id}`);
  };

  const renombrarLeccion = (l: Leccion, valor: string) => {
    mapMod(l.moduloId, (m) => ({ ...m, lecciones: m.lecciones.map((x) => (x.id === l.id ? { ...x, titulo: valor } : x)) }));
    if (!tituloLeccion.safeParse(valor).success) return auto.cancelar(`lec:${l.id}:titulo`);
    auto.programar(`lec:${l.id}:titulo`, () => actualizarLeccionAction(l.id, { titulo: valor }));
  };

  const moverLeccion = async (m: Modulo, l: Leccion, dir: "subir" | "bajar") => {
    const i = m.lecciones.findIndex((x) => x.id === l.id);
    const j = dir === "subir" ? i - 1 : i + 1;
    if (j < 0 || j >= m.lecciones.length) return;
    mapMod(m.id, (x) => {
      const ls = [...x.lecciones];
      [ls[i], ls[j]] = [ls[j], ls[i]];
      return { ...x, lecciones: ls };
    });
    ctx.anunciar(`${l.titulo || "Lección"} movida a la posición ${j + 1} de ${m.lecciones.length}`);
    const r = await auto.encolar(null, () => moverLeccionAction(l.id, dir));
    if (!r.ok) {
      ctx.avisar(r.error);
      await ctx.resincronizar();
    }
  };

  const eliminarLeccion = async (l: Leccion) => {
    setPendiente(null);
    setTrabajando(true);
    const r = await auto.encolar(null, () => eliminarLeccionAction(l.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    auto.cancelar(`lec:${l.id}:`);
    mapMod(l.moduloId, (m) => ({ ...m, lecciones: m.lecciones.filter((x) => x.id !== l.id) }));
    ctx.anunciar(`Lección ${l.titulo} eliminada`);
    setFoco(`esq-add-leccion-${l.moduloId}`);
  };

  const vacio = curso.modulos.length === 0;
  const todosAbiertos = !vacio && curso.modulos.every((m) => abiertos.has(m.id));

  return (
    <div className="ed-form">
      <p className="ed-lede">
        Arma aquí el esquema del curso: módulos y lecciones. Para escribir el contenido de una lección, presiona «Editar». La
        presentación del módulo («Qué aprenderás»), sus materiales y el quiz están en «Presentación y quiz».
      </p>

      {vacio && (
        <div className="ed-sugerida">
          <h3 className="ed-sugerida__t">¿Cómo quieres empezar?</h3>
          <p className="ed-sugerida__d">
            La estructura sugerida crea 3 módulos vacíos: <strong>Contexto</strong>, <strong>Casos reales</strong> y <strong>Aplicación</strong>.
            Puedes renombrarlos, moverlos o eliminarlos.
          </p>
          <div className="ed-sugerida__acc">
            <Button onClick={usarSugerida} disabled={trabajando}>
              Usar estructura sugerida
            </Button>
            <Button variante="secondary" onClick={agregarModulo} disabled={trabajando}>
              Empezar desde cero
            </Button>
          </div>
        </div>
      )}

      {curso.modulos.length > 1 && (
        <div>
          <Button
            variante="ghost"
            onClick={() => setAbiertos(todosAbiertos ? new Set() : new Set(curso.modulos.map((m) => m.id)))}
          >
            {todosAbiertos ? "Plegar todos los módulos" : "Desplegar todos los módulos"}
          </Button>
        </div>
      )}

      {!vacio && (
        <ol className="md-lista">
          {curso.modulos.map((m, i) => {
            const estado = estadoModulo(m);
            const q = estadoQuiz(m.quiz);
            const abierto = abiertos.has(m.id);
            const panelId = `esq-panel-${m.id}`;
            const eTitulo = tituloModulo.safeParse(m.titulo);
            return (
              <li key={m.id} className="md-card md-card--esq">
                <div className="esq-cab">
                  <button
                    type="button"
                    className="esq-toggle"
                    aria-expanded={abierto}
                    aria-controls={panelId}
                    aria-label={`${abierto ? "Plegar" : "Desplegar"} el módulo ${i + 1}`}
                    onClick={() => alternar(m.id)}
                  >
                    <span className="md-card__n" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="esq-chev" aria-hidden="true">
                      {abierto ? "▾" : "▸"}
                    </span>
                  </button>
                  <div className="esq-titulo">
                    <label className="av-sr-only" htmlFor={`esq-mod-titulo-${m.id}`}>
                      Nombre del módulo {i + 1}
                    </label>
                    <Input
                      id={`esq-mod-titulo-${m.id}`}
                      value={m.titulo}
                      autoComplete="off"
                      invalido={!eTitulo.success}
                      onChange={(e) => renombrarModulo(m, e.target.value)}
                    />
                    {!eTitulo.success && (
                      <span className="cr-field__error" role="alert">
                        {eTitulo.error.issues[0].message}
                      </span>
                    )}
                  </div>
                  <Acciones
                    nombre={`módulo ${m.titulo || i + 1}`}
                    primero={i === 0}
                    ultimo={i === curso.modulos.length - 1}
                    onSubir={() => moverModulo(m, "subir")}
                    onBajar={() => moverModulo(m, "bajar")}
                    onEliminar={() => setPendiente({ k: "modulo", m })}
                  />
                </div>

                <div className="md-card__chips">
                  <span className="md-card__meta">{resumenModulo(m)}</span>
                  <Badge tono={estado === "listo" ? "ok" : "warning"}>
                    {estado === "listo" ? "Listo" : estado === "vacio" ? "Sin lecciones" : "Falta contenido"}
                  </Badge>
                  <Badge tono="neutral">{q.total ? `Quiz · ${q.total} ${q.total === 1 ? "pregunta" : "preguntas"}` : "Sin quiz"}</Badge>
                  {m.descripcion && <Badge tono="neutral">Con presentación</Badge>}
                </div>

                {abierto && (
                  <div id={panelId} className="esq-panel">
                    {m.lecciones.length === 0 ? (
                      <div className="esq-vacio">
                        <p className="ed-vacio">Este módulo aún no tiene lecciones.</p>
                        <p className="cr-field__hint">
                          ¿Quieres partir con una estructura? La plantilla crea {PLANTILLA_MODULO.map((l) => l.titulo).join(", ")}: puedes
                          renombrarlas, moverlas o borrarlas.
                        </p>
                        <div>
                          <Button variante="secondary" onClick={() => usarPlantilla(m)} disabled={trabajando}>
                            Usar plantilla de lecciones
                            <span className="av-sr-only"> en el módulo {m.titulo || i + 1}</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ol className="esq-lecs">
                        {m.lecciones.map((l, j) => {
                          const eLec = tituloLeccion.safeParse(l.titulo);
                          const lista = leccionLista(l);
                          return (
                            <li key={l.id} className="esq-lec">
                              <div className="esq-lec__titulo">
                                <label className="av-sr-only" htmlFor={`esq-lec-titulo-${l.id}`}>
                                  Título de la lección {j + 1} del módulo {i + 1}
                                </label>
                                <Input
                                  id={`esq-lec-titulo-${l.id}`}
                                  value={l.titulo}
                                  autoComplete="off"
                                  invalido={!eLec.success}
                                  onChange={(e) => renombrarLeccion(l, e.target.value)}
                                />
                                {!eLec.success && (
                                  <span className="cr-field__error" role="alert">
                                    {eLec.error.issues[0].message}
                                  </span>
                                )}
                              </div>
                              <div className="esq-lec__meta">
                                <Badge tono="neutral">{TIPO[l.tipo]}</Badge>
                                {l.duracionMin ? <span className="md-card__meta">{l.duracionMin} min</span> : null}
                                <Badge tono={lista ? "ok" : "warning"}>{lista ? "Listo" : "Falta contenido"}</Badge>
                              </div>
                              <div className="esq-lec__acc">
                                <Button variante="secondary" onClick={() => irAlModulo(m, l.id)}>
                                  Editar
                                  <span className="av-sr-only"> la lección {l.titulo || j + 1}</span>
                                </Button>
                                <Acciones
                                  nombre={`lección ${l.titulo || j + 1}`}
                                  primero={j === 0}
                                  ultimo={j === m.lecciones.length - 1}
                                  onSubir={() => moverLeccion(m, l, "subir")}
                                  onBajar={() => moverLeccion(m, l, "bajar")}
                                  onEliminar={() => setPendiente({ k: "leccion", l })}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                    <div className="esq-pie">
                      <Button id={`esq-add-leccion-${m.id}`} variante="secondary" onClick={() => agregarLeccion(m)} disabled={trabajando}>
                        + Agregar lección
                      </Button>
                      <Button id={`ed-abrir-${m.id}`} variante="ghost" onClick={() => irAlModulo(m)}>
                        Presentación y quiz
                        <span className="av-sr-only"> del módulo {m.titulo || i + 1}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {!vacio && (
        <div>
          <Button id="ed-add-modulo" variante="secondary" onClick={agregarModulo} disabled={trabajando}>
            + Agregar módulo
          </Button>
        </div>
      )}

      <ConfirmDialog
        abierto={!!pendiente}
        peligro
        titulo={
          pendiente?.k === "modulo"
            ? `¿Eliminar el módulo “${pendiente.m.titulo}”?`
            : pendiente?.k === "leccion"
              ? `¿Eliminar la lección “${pendiente.l.titulo}”?`
              : ""
        }
        confirmar="Eliminar"
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => {
          if (pendiente?.k === "modulo") void eliminarModulo(pendiente.m);
          else if (pendiente?.k === "leccion") void eliminarLeccion(pendiente.l);
        }}
      >
        {pendiente?.k === "modulo" && (
          <p>
            {pendiente.m.lecciones.length > 0 ? `Se eliminarán también sus ${pendiente.m.lecciones.length} lecciones. ` : ""}
            Esta acción no se puede deshacer.
          </p>
        )}
        {pendiente?.k === "leccion" && <p>Se eliminará con su contenido. Esta acción no se puede deshacer.</p>}
      </ConfirmDialog>
    </div>
  );
}
