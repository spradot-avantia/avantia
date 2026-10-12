"use client";

import { useEffect, useState } from "react";
import {
  actualizarLeccionAction,
  crearLeccionAction,
  crearModuloAction,
  eliminarLeccionAction,
  eliminarModuloAction,
  moverLeccionAction,
  moverModuloAction,
  renombrarModuloAction,
} from "../../../lib/creador/actions";
import { aplicarEstructuraSugeridaAction } from "../../../lib/creador/actionsEditor";
import { leccionLista } from "../../../lib/creador/reglasPublicacion";
import type { Leccion, Modulo, TipoLeccion } from "../../../lib/creador/types";
import {
  AVISO_ENLACE_DOCUMENTO,
  tituloLeccion,
  tituloModulo,
  validarUrlLeccion,
} from "../../../lib/creador/validacion";
import { MarkdownMinimo } from "../../tenant/MarkdownMinimo";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input, Textarea } from "../Field";
import { ConfirmDialog } from "./ConfirmDialog";
import type { EditorCtx } from "./contexto";

const TIPOS: ReadonlyArray<{ id: TipoLeccion; label: string }> = [
  { id: "video", label: "Video" },
  { id: "texto", label: "Texto" },
  { id: "documento", label: "Documento" },
];
const TEXTO_MAX = 20000;

type Pendiente =
  | { k: "modulo"; m: Modulo }
  | { k: "leccion"; l: Leccion }
  | { k: "tipo"; l: Leccion; tipo: TipoLeccion };

function tieneContenido(l: Leccion) {
  return !!(l.contenidoUrl?.trim() || l.contenidoTexto?.trim());
}

/** Paso 3: modulos -> lecciones. Reordenar con botones; eliminar con confirmacion. */
export function PasoEstructura({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso, auto } = ctx;
  const [abierta, setAbierta] = useState<string | null>(null);
  const [foco, setFoco] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [tocUrl, setTocUrl] = useState<Record<string, boolean>>({});
  const [verTexto, setVerTexto] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!foco) return;
    const el = document.getElementById(foco) as HTMLInputElement | HTMLButtonElement | null;
    el?.focus();
    if (el instanceof HTMLInputElement) el.select();
    setFoco(null);
  }, [foco, curso.modulos]);

  const mapMod = (id: string, fn: (m: Modulo) => Modulo) =>
    setCurso((c) => ({ ...c, modulos: c.modulos.map((m) => (m.id === id ? fn(m) : m)) }));
  const mapLec = (id: string, fn: (l: Leccion) => Leccion) =>
    setCurso((c) => ({
      ...c,
      modulos: c.modulos.map((m) => ({ ...m, lecciones: m.lecciones.map((l) => (l.id === id ? fn(l) : l)) })),
    }));

  // ---- Modulos ----------------------------------------------------------------
  const agregarModulo = async () => {
    setTrabajando(true);
    const titulo = `Módulo ${curso.modulos.length + 1}`;
    const r = await auto.encolar(null, () => crearModuloAction(curso.id, titulo));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    const id = r.data.id;
    setCurso((c) => ({
      ...c,
      modulos: [...c.modulos, { id, cursoId: c.id, titulo, orden: c.modulos.length, lecciones: [] }],
    }));
    ctx.anunciar(`${titulo} agregado`);
    setFoco(`ed-mod-${id}`);
  };

  const usarSugerida = async () => {
    setTrabajando(true);
    const r = await auto.encolar(null, () => aplicarEstructuraSugeridaAction(curso.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    setCurso((c) => ({ ...c, modulos: r.data.modulos }));
    ctx.anunciar("Estructura sugerida agregada: 3 módulos");
  };

  const renombrarModulo = (m: Modulo, valor: string) => {
    mapMod(m.id, (x) => ({ ...x, titulo: valor }));
    if (!tituloModulo.safeParse(valor).success) return auto.cancelar(`mod:${m.id}`);
    auto.programar(`mod:${m.id}`, () => renombrarModuloAction(m.id, valor));
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

  // ---- Lecciones ----------------------------------------------------------------
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
          orden: x.lecciones.length,
        },
      ],
    }));
    setAbierta(id);
    ctx.anunciar("Lección agregada");
    setFoco(`ed-lec-titulo-${id}`);
  };

  const renombrarLeccion = (l: Leccion, valor: string) => {
    mapLec(l.id, (x) => ({ ...x, titulo: valor }));
    if (!tituloLeccion.safeParse(valor).success) return auto.cancelar(`lec:${l.id}:titulo`);
    auto.programar(`lec:${l.id}:titulo`, () => actualizarLeccionAction(l.id, { titulo: valor }));
  };

  const aplicarTipo = (l: Leccion, tipo: TipoLeccion) => {
    auto.cancelar(`lec:${l.id}:`); // el contenido anterior se descarta
    mapLec(l.id, (x) => ({ ...x, tipo, contenidoUrl: null, contenidoTexto: null }));
    setTocUrl((t) => ({ ...t, [l.id]: false }));
    void auto.encolar(`lec:${l.id}:tipo`, () => actualizarLeccionAction(l.id, { tipo }));
  };

  const cambiarTipo = (l: Leccion, tipo: TipoLeccion) => {
    if (tipo === l.tipo) return;
    if (tieneContenido(l)) setPendiente({ k: "tipo", l, tipo });
    else aplicarTipo(l, tipo);
  };

  const cambiarUrl = (l: Leccion, valor: string) => {
    mapLec(l.id, (x) => ({ ...x, contenidoUrl: valor }));
    if (!valor.trim()) return auto.programar(`lec:${l.id}:url`, () => actualizarLeccionAction(l.id, { contenidoUrl: null }));
    if (!validarUrlLeccion(l.tipo, valor).ok) return auto.cancelar(`lec:${l.id}:url`);
    auto.programar(`lec:${l.id}:url`, () => actualizarLeccionAction(l.id, { contenidoUrl: valor }));
  };

  const cambiarTexto = (l: Leccion, valor: string) => {
    mapLec(l.id, (x) => ({ ...x, contenidoTexto: valor }));
    auto.programar(`lec:${l.id}:texto`, () => actualizarLeccionAction(l.id, { contenidoTexto: valor }));
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
    setFoco(`ed-add-leccion-${l.moduloId}`);
  };

  const vacio = curso.modulos.length === 0;

  return (
    <div className="ed-form">
      <p className="ed-lede">
        Organiza el curso en módulos y cada módulo en lecciones. Cada lección es un video (enlace), un texto o un documento (enlace).
      </p>

      <div className="ed-solo-movil">
        <Callout tono="info">Para editar la estructura es más cómodo en escritorio. Desde el móvil puedes revisar y hacer cambios sencillos.</Callout>
      </div>

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

      <ol className="ed-mods">
        {curso.modulos.map((m, i) => {
          const eMod = tituloModulo.safeParse(m.titulo);
          return (
            <li key={m.id} className="ed-mod">
              <div className="ed-mod__cab">
                <div className="ed-mod__campo">
                  <Field id={`ed-mod-${m.id}`} label={`Módulo ${i + 1}`} error={eMod.success ? undefined : eMod.error.issues[0].message}>
                    <Input
                      id={`ed-mod-${m.id}`}
                      value={m.titulo}
                      autoComplete="off"
                      invalido={!eMod.success}
                      onChange={(e) => renombrarModulo(m, e.target.value)}
                    />
                  </Field>
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

              {m.lecciones.length === 0 && <p className="ed-vacio">Este módulo aún no tiene lecciones.</p>}
              <ul className="ed-lecs">
                {m.lecciones.map((l, j) => {
                  const lista = leccionLista(l);
                  const abiertaAhora = abierta === l.id;
                  const panelId = `ed-lec-panel-${l.id}`;
                  const eTitulo = tituloLeccion.safeParse(l.titulo);
                  const vUrl = l.tipo !== "texto" && l.contenidoUrl?.trim() ? validarUrlLeccion(l.tipo, l.contenidoUrl) : null;
                  const eUrl = tocUrl[l.id] && vUrl && !vUrl.ok ? vUrl.error : undefined;
                  const texto = l.contenidoTexto ?? "";
                  return (
                    <li key={l.id} className={`ed-lec${abiertaAhora ? " ed-lec--abierta" : ""}`}>
                      <div className="ed-lec__cab">
                        <button
                          type="button"
                          className="ed-lec__toggle"
                          aria-expanded={abiertaAhora}
                          aria-controls={panelId}
                          onClick={() => setAbierta(abiertaAhora ? null : l.id)}
                        >
                          <span className="ed-lec__titulo">{l.titulo.trim() || "Lección sin título"}</span>
                          <span className="ed-lec__chips">
                            <Badge tono="neutral">{TIPOS.find((t) => t.id === l.tipo)?.label}</Badge>
                            <Badge tono={lista ? "ok" : "warning"}>{lista ? "Listo" : "Falta contenido"}</Badge>
                          </span>
                        </button>
                        <Acciones
                          nombre={`lección ${l.titulo || j + 1}`}
                          primero={j === 0}
                          ultimo={j === m.lecciones.length - 1}
                          onSubir={() => moverLeccion(m, l, "subir")}
                          onBajar={() => moverLeccion(m, l, "bajar")}
                          onEliminar={() => setPendiente({ k: "leccion", l })}
                        />
                      </div>

                      {abiertaAhora && (
                        <div id={panelId} className="ed-lec__panel">
                          <Field
                            id={`ed-lec-titulo-${l.id}`}
                            label="Título de la lección"
                            error={eTitulo.success ? undefined : eTitulo.error.issues[0].message}
                          >
                            <Input
                              id={`ed-lec-titulo-${l.id}`}
                              value={l.titulo}
                              autoComplete="off"
                              invalido={!eTitulo.success}
                              onChange={(e) => renombrarLeccion(l, e.target.value)}
                            />
                          </Field>

                          <fieldset className="ed-formato">
                            <legend className="cr-field__label">Formato</legend>
                            <div className="ed-formato__opts">
                              {TIPOS.map((t) => (
                                <label key={t.id} className={`ed-opt${l.tipo === t.id ? " ed-opt--sel" : ""}`}>
                                  <input
                                    type="radio"
                                    name={`ed-formato-${l.id}`}
                                    checked={l.tipo === t.id}
                                    onChange={() => cambiarTipo(l, t.id)}
                                  />
                                  <span>{t.label}</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>

                          {l.tipo === "texto" ? (
                            <div className="ed-texto">
                              <Field
                                id={`ed-lec-texto-${l.id}`}
                                label="Texto de la lección"
                                ayuda="Admite **negrita**, *cursiva*, títulos con #, listas con - o 1. y enlaces [texto](https://…)."
                                contador={`${texto.length}/${TEXTO_MAX}`}
                              >
                                <Textarea
                                  id={`ed-lec-texto-${l.id}`}
                                  value={texto}
                                  rows={8}
                                  maxLength={TEXTO_MAX}
                                  conAyuda
                                  onChange={(e) => cambiarTexto(l, e.target.value)}
                                />
                              </Field>
                              <Button
                                variante="ghost"
                                aria-pressed={!!verTexto[l.id]}
                                onClick={() => setVerTexto((v) => ({ ...v, [l.id]: !v[l.id] }))}
                              >
                                {verTexto[l.id] ? "Ocultar cómo se ve" : "Ver cómo se ve"}
                              </Button>
                              {verTexto[l.id] && (
                                <div className="ed-md-prev" aria-label="Así se verá el texto">
                                  {texto.trim() ? <MarkdownMinimo texto={texto} /> : <p className="ed-vacio">Aún no escribes nada.</p>}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Field
                              id={`ed-lec-url-${l.id}`}
                              label={l.tipo === "video" ? "Enlace del video" : "Enlace del documento"}
                              ayuda={
                                l.tipo === "video"
                                  ? "Pega el enlace de YouTube, Vimeo o Google Drive (archivo de video)."
                                  : "Pega cualquier enlace https: Google Drive, Dropbox, OneDrive, Notion, Canva…"
                              }
                              error={eUrl}
                            >
                              <Input
                                id={`ed-lec-url-${l.id}`}
                                type="url"
                                inputMode="url"
                                value={l.contenidoUrl ?? ""}
                                placeholder="https://"
                                autoComplete="off"
                                conAyuda
                                invalido={!!eUrl}
                                onChange={(e) => cambiarUrl(l, e.target.value)}
                                onBlur={() => setTocUrl((t) => ({ ...t, [l.id]: true }))}
                              />
                            </Field>
                          )}
                          {l.tipo === "documento" && (
                            <Callout tono="warning">
                              {AVISO_ENLACE_DOCUMENTO} Si el documento es privado, tus estudiantes verán un error al abrirlo.
                            </Callout>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <Button id={`ed-add-leccion-${m.id}`} variante="secondary" onClick={() => agregarLeccion(m)} disabled={trabajando}>
                + Agregar lección
              </Button>
            </li>
          );
        })}
      </ol>

      {!vacio && (
        <div>
          <Button id="ed-add-modulo" variante="secondary" onClick={agregarModulo} disabled={trabajando}>
            + Agregar módulo
          </Button>
        </div>
      )}

      <ConfirmDialog
        abierto={!!pendiente}
        peligro={pendiente?.k !== "tipo"}
        titulo={
          pendiente?.k === "modulo"
            ? `¿Eliminar el módulo “${pendiente.m.titulo}”?`
            : pendiente?.k === "leccion"
              ? `¿Eliminar la lección “${pendiente.l.titulo}”?`
              : pendiente?.k === "tipo"
                ? "¿Cambiar el formato de la lección?"
                : ""
        }
        confirmar={pendiente?.k === "tipo" ? "Cambiar formato" : "Eliminar"}
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => {
          const p = pendiente;
          if (!p) return;
          if (p.k === "modulo") void eliminarModulo(p.m);
          else if (p.k === "leccion") void eliminarLeccion(p.l);
          else {
            setPendiente(null);
            aplicarTipo(p.l, p.tipo);
          }
        }}
      >
        {pendiente?.k === "modulo" && (
          <p>
            {pendiente.m.lecciones.length > 0
              ? `Se eliminarán también sus ${pendiente.m.lecciones.length} lecciones. `
              : ""}
            Esta acción no se puede deshacer.
          </p>
        )}
        {pendiente?.k === "leccion" && <p>Se eliminará con su contenido. Esta acción no se puede deshacer.</p>}
        {pendiente?.k === "tipo" && <p>El enlace o texto que escribiste en el formato anterior se descartará.</p>}
      </ConfirmDialog>
    </div>
  );
}

function Acciones({
  nombre,
  primero,
  ultimo,
  onSubir,
  onBajar,
  onEliminar,
}: {
  nombre: string;
  primero: boolean;
  ultimo: boolean;
  onSubir: () => void;
  onBajar: () => void;
  onEliminar: () => void;
}) {
  // aria-disabled (no disabled): el foco no se pierde al llegar al extremo.
  return (
    <div className="ed-acc" role="group" aria-label={`Acciones de ${nombre}`}>
      <button
        type="button"
        className="ed-icono"
        aria-label={`Subir ${nombre}`}
        aria-disabled={primero}
        onClick={() => !primero && onSubir()}
      >
        <span aria-hidden="true">↑</span>
      </button>
      <button
        type="button"
        className="ed-icono"
        aria-label={`Bajar ${nombre}`}
        aria-disabled={ultimo}
        onClick={() => !ultimo && onBajar()}
      >
        <span aria-hidden="true">↓</span>
      </button>
      <button type="button" className="ed-icono ed-icono--peligro" aria-label={`Eliminar ${nombre}`} onClick={onEliminar}>
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
