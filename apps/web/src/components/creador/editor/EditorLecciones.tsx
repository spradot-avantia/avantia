"use client";

// Editor de las lecciones de UN módulo: lista, alta, orden, formato y contenido.
// Lo usa la pantalla de cada módulo (ADR 029). Autoguardado con la cola del editor.
import { useEffect, useState } from "react";
import {
  actualizarLeccionAction,
  crearLeccionAction,
  eliminarLeccionAction,
  moverLeccionAction,
} from "../../../lib/creador/actions";
import {
  confirmarSubidaLeccionAction,
  prepararSubidaLeccionAction,
  quitarArchivoLeccionAction,
  urlDeDescargaLeccionAction,
} from "../../../lib/creador/actionsEditor";
import { ACCEPT_ARCHIVOS, ARCHIVO_MAX_BYTES, EXTENSIONES_LEGIBLES, formatearBytes } from "../../../lib/creador/archivosReglas";
import { leccionLista } from "../../../lib/creador/reglasPublicacion";
import { subirArchivoAlBucket } from "../../../lib/creador/subidaCliente";
import type { Leccion, Modulo, TipoLeccion } from "../../../lib/creador/types";
import {
  AVISO_ENLACE_DOCUMENTO,
  DESCRIPCION_LECCION_MAX,
  DURACION_MAX_MIN,
  descripcionLeccion,
  duracionMin,
  tituloLeccion,
  validarUrlLeccion,
} from "../../../lib/creador/validacion";
import { MarkdownMinimo } from "../../tenant/MarkdownMinimo";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input, Textarea } from "../Field";
import { Acciones } from "./AccionesFila";
import { ConfirmDialog } from "./ConfirmDialog";
import { EditorMateriales } from "./EditorMateriales";
import type { EditorCtx } from "./contexto";
import "./materiales.css";

const TIPOS: ReadonlyArray<{ id: TipoLeccion; label: string }> = [
  { id: "video", label: "Video" },
  { id: "texto", label: "Texto" },
  { id: "documento", label: "Documento" },
];
const TEXTO_MAX = 20000;

type Pendiente = { k: "leccion"; l: Leccion } | { k: "tipo"; l: Leccion; tipo: TipoLeccion };

/** Cambio de formato aún no guardado: el contenido original sigue intacto hasta «Guardar cambios». */
type Borrador = { tipo: TipoLeccion; url: string; texto: string };

function tieneContenido(l: Leccion) {
  return !!(l.contenidoUrl?.trim() || l.contenidoTexto?.trim() || l.archivoNombre);
}

export function EditorLecciones({ ctx, modulo }: { ctx: EditorCtx; modulo: Modulo }) {
  const { curso, setCurso, auto } = ctx;
  const [abierta, setAbierta] = useState<string | null>(null);
  const [foco, setFoco] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [tocUrl, setTocUrl] = useState<Record<string, boolean>>({});
  const [verTexto, setVerTexto] = useState<Record<string, boolean>>({});
  const [borrador, setBorrador] = useState<Record<string, Borrador>>({});
  // Archivo propio en lecciones de tipo documento (ADR 030).
  const [verArchivo, setVerArchivo] = useState<Record<string, boolean>>({});
  const [subida, setSubida] = useState<Record<string, { msg: string; error?: boolean }>>({});
  const [quitarLec, setQuitarLec] = useState<Leccion | null>(null);

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

  // ---- Lecciones ----------------------------------------------------------------
  const agregarLeccion = async () => {
    const m = modulo;
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
    setAbierta(id);
    ctx.anunciar("Lección agregada");
    setFoco(`ed-lec-titulo-${id}`);
  };

  const renombrarLeccion = (l: Leccion, valor: string) => {
    mapLec(l.id, (x) => ({ ...x, titulo: valor }));
    if (!tituloLeccion.safeParse(valor).success) return auto.cancelar(`lec:${l.id}:titulo`);
    auto.programar(`lec:${l.id}:titulo`, () => actualizarLeccionAction(l.id, { titulo: valor }));
  };

  const quitarBorrador = (id: string) =>
    setBorrador((b) => {
      const { [id]: _omitido, ...resto } = b;
      return resto;
    });

  /** Aplica el cambio de formato y recién ahí descarta el contenido anterior (guardado explícito). */
  const guardarFormato = (l: Leccion, b: Borrador) => {
    auto.cancelar(`lec:${l.id}:url`);
    auto.cancelar(`lec:${l.id}:texto`);
    const url = b.tipo === "texto" ? "" : b.url.trim();
    const texto = b.tipo === "texto" ? b.texto : "";
    mapLec(l.id, (x) => ({ ...x, tipo: b.tipo, contenidoUrl: url || null, contenidoTexto: texto.trim() ? texto : null }));
    quitarBorrador(l.id);
    setTocUrl((t) => ({ ...t, [l.id]: false }));
    void auto.encolar(`lec:${l.id}:tipo`, async () => {
      const r = await actualizarLeccionAction(l.id, { tipo: b.tipo });
      if (!r.ok) return r;
      if (url) return actualizarLeccionAction(l.id, { contenidoUrl: url });
      if (texto.trim()) return actualizarLeccionAction(l.id, { contenidoTexto: texto });
      return r;
    });
    ctx.anunciar("Formato de la lección guardado");
  };

  const cambiarTipo = (l: Leccion, tipo: TipoLeccion) => {
    if (tipo === l.tipo) return quitarBorrador(l.id); // volver al formato original no pierde nada
    setBorrador((b) => ({ ...b, [l.id]: b[l.id]?.tipo === tipo ? b[l.id] : { tipo, url: "", texto: "" } }));
    setTocUrl((t) => ({ ...t, [l.id]: false }));
  };

  const cambiarUrl = (l: Leccion, valor: string) => {
    if (borrador[l.id]) return setBorrador((b) => ({ ...b, [l.id]: { ...b[l.id], url: valor } }));
    mapLec(l.id, (x) => ({ ...x, contenidoUrl: valor }));
    if (!valor.trim()) return auto.programar(`lec:${l.id}:url`, () => actualizarLeccionAction(l.id, { contenidoUrl: null }));
    if (!validarUrlLeccion(l.tipo, valor).ok) return auto.cancelar(`lec:${l.id}:url`);
    auto.programar(`lec:${l.id}:url`, () => actualizarLeccionAction(l.id, { contenidoUrl: valor }));
  };

  const cambiarTexto = (l: Leccion, valor: string) => {
    if (borrador[l.id]) return setBorrador((b) => ({ ...b, [l.id]: { ...b[l.id], texto: valor } }));
    mapLec(l.id, (x) => ({ ...x, contenidoTexto: valor }));
    auto.programar(`lec:${l.id}:texto`, () => actualizarLeccionAction(l.id, { contenidoTexto: valor }));
  };

  const moverLeccion = async (l: Leccion, dir: "subir" | "bajar") => {
    const m = modulo;
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

  const estadoSubida = (id: string, v: { msg: string; error?: boolean } | null) =>
    setSubida((st) => {
      const { [id]: _previo, ...resto } = st;
      return v ? { ...resto, [id]: v } : resto;
    });

  /** Copia a la lección solo lo del archivo: no pisa lo que el creador esté escribiendo. */
  const aplicarArchivo = (id: string, nueva: Leccion) =>
    mapLec(id, (x) => ({
      ...x,
      contenidoUrl: nueva.contenidoUrl,
      storagePath: nueva.storagePath,
      archivoNombre: nueva.archivoNombre,
      bytes: nueva.bytes,
      contenidoTipo: nueva.contenidoTipo,
    }));

  const subirArchivoLec = async (l: Leccion, elegido: File) => {
    auto.cancelar(`lec:${l.id}:url`); // un enlace a medio guardar no debe llegar después del archivo
    const r = await subirArchivoAlBucket(elegido, {
      estado: (msg) => estadoSubida(l.id, { msg }),
      preparar: (archivo) => auto.encolar(null, () => prepararSubidaLeccionAction(l.id, archivo)),
      confirmar: (ruta, nombre) => auto.encolar(null, () => confirmarSubidaLeccionAction(l.id, ruta, nombre)),
    });
    if (!r.ok) return estadoSubida(l.id, { msg: r.error, error: true });
    aplicarArchivo(l.id, r.data.leccion);
    estadoSubida(l.id, null);
    ctx.anunciar(r.anuncio);
  };

  const quitarArchivoLec = async (l: Leccion) => {
    setQuitarLec(null);
    setTrabajando(true);
    const r = await auto.encolar(null, () => quitarArchivoLeccionAction(l.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    aplicarArchivo(l.id, r.data.leccion);
    setVerArchivo((v) => ({ ...v, [l.id]: false }));
    ctx.anunciar("Archivo quitado");
  };

  const abrirArchivoLec = async (l: Leccion) => {
    const r = await urlDeDescargaLeccionAction(l.id);
    if (!r.ok) return ctx.avisar(r.error);
    window.open(r.data.url, "_blank", "noopener,noreferrer");
  };

  const cambiarDescripcion = (l: Leccion, valor: string) => {
    mapLec(l.id, (x) => ({ ...x, descripcion: valor }));
    if (!descripcionLeccion.safeParse(valor).success) return auto.cancelar(`lec:${l.id}:desc`);
    auto.programar(`lec:${l.id}:desc`, () => actualizarLeccionAction(l.id, { descripcion: valor }));
  };

  const cambiarDuracion = (l: Leccion, valor: string) => {
    const n = valor.trim() === "" ? null : Number(valor);
    mapLec(l.id, (x) => ({ ...x, duracionMin: n !== null && Number.isFinite(n) ? n : null }));
    if (!duracionMin.safeParse(n).success) return auto.cancelar(`lec:${l.id}:dur`);
    auto.programar(`lec:${l.id}:dur`, () => actualizarLeccionAction(l.id, { duracionMin: n }));
  };

  return (
    <div className="ed-form">
      {modulo.lecciones.length === 0 && <p className="ed-vacio">Este módulo aún no tiene lecciones.</p>}
      <ul className="ed-lecs">
        {modulo.lecciones.map((lGuardada, j) => {
          const b = borrador[lGuardada.id];
          const l: Leccion = b
            ? { ...lGuardada, tipo: b.tipo, contenidoUrl: b.url, contenidoTexto: b.texto }
            : lGuardada;
          const lista = leccionLista(lGuardada);
          // El archivo solo se sube con el formato Documento YA guardado (no en un borrador de formato).
          const puedeArchivo = l.tipo === "documento" && !b;
          const modoArchivo = puedeArchivo && (!!lGuardada.archivoNombre || !!verArchivo[l.id]);
          const sub = subida[l.id];
          const abiertaAhora = abierta === l.id;
          const panelId = `ed-lec-panel-${l.id}`;
          const eTitulo = tituloLeccion.safeParse(l.titulo);
          const dsc = descripcionLeccion.safeParse(l.descripcion ?? "");
          const eDesc = dsc.success ? undefined : dsc.error.issues[0].message;
          const dur = duracionMin.safeParse(l.duracionMin);
          const eDur = dur.success ? undefined : dur.error.issues[0].message;
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
                    <Badge tono="neutral">{TIPOS.find((t) => t.id === lGuardada.tipo)?.label}</Badge>
                    <Badge tono={lista ? "ok" : "warning"}>{lista ? "Listo" : "Falta contenido"}</Badge>
                  </span>
                </button>
                <Acciones
                  nombre={`lección ${l.titulo || j + 1}`}
                  primero={j === 0}
                  ultimo={j === modulo.lecciones.length - 1}
                  onSubir={() => moverLeccion(l, "subir")}
                  onBajar={() => moverLeccion(l, "bajar")}
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
                  {b && (
                    <Callout tono="warning">
                      <p>
                        Cambiaste el formato a <strong>{TIPOS.find((t) => t.id === b.tipo)?.label}</strong>. El contenido anterior se
                        conserva hasta que guardes los cambios.
                      </p>
                      <div className="ed-lec__borrador">
                        <Button
                          disabled={l.tipo !== "texto" && !!l.contenidoUrl?.trim() && !validarUrlLeccion(l.tipo, l.contenidoUrl).ok}
                          onClick={() => (tieneContenido(lGuardada) ? setPendiente({ k: "tipo", l: lGuardada, tipo: b.tipo }) : guardarFormato(lGuardada, b))}
                        >
                          Guardar cambios
                        </Button>
                        <Button variante="secondary" onClick={() => quitarBorrador(l.id)}>
                          Descartar
                        </Button>
                      </div>
                    </Callout>
                  )}

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
                    <>
                      {puedeArchivo && (
                        <fieldset className="ed-formato">
                          <legend className="cr-field__label">Origen del documento</legend>
                          <div className="ed-formato__opts">
                            {[
                              { id: "enlace", label: "Enlace" },
                              { id: "archivo", label: "Subir archivo" },
                            ].map((o) => (
                              <label key={o.id} className={`ed-opt${(o.id === "archivo") === modoArchivo ? " ed-opt--sel" : ""}`}>
                                <input
                                  type="radio"
                                  name={`ed-origen-${l.id}`}
                                  checked={(o.id === "archivo") === modoArchivo}
                                  onChange={() => {
                                    if (o.id === "archivo") return setVerArchivo((v) => ({ ...v, [l.id]: true }));
                                    if (lGuardada.archivoNombre) return setQuitarLec(lGuardada); // quitar el archivo exige confirmar
                                    setVerArchivo((v) => ({ ...v, [l.id]: false }));
                                  }}
                                />
                                <span>{o.label}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      )}

                      {modoArchivo ? (
                        <div className="mt-archivo">
                          {lGuardada.archivoNombre && (
                            <p className="mt-archivo__info">
                              <strong>{lGuardada.archivoNombre}</strong>
                              <span> · {formatearBytes(lGuardada.bytes ?? 0)}</span>
                            </p>
                          )}
                          <div className="mt-archivo__acciones">
                            <label className={`av-btn cr-btn av-btn--secondary mt-archivo__elegir${sub && !sub.error ? " is-disabled" : ""}`}>
                              {lGuardada.archivoNombre ? "Reemplazar archivo" : "Elegir archivo"}
                              <input
                                type="file"
                                className="av-sr-only"
                                accept={ACCEPT_ARCHIVOS}
                                disabled={!!sub && !sub.error}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (f) void subirArchivoLec(lGuardada, f);
                                }}
                              />
                            </label>
                            {lGuardada.archivoNombre && (
                              <>
                                <Button variante="ghost" onClick={() => void abrirArchivoLec(lGuardada)}>
                                  Abrir
                                </Button>
                                <Button variante="ghost" onClick={() => setQuitarLec(lGuardada)}>
                                  Quitar archivo
                                </Button>
                              </>
                            )}
                          </div>
                          <p className="cr-field__hint">
                            {EXTENSIONES_LEGIBLES}. Máximo {formatearBytes(ARCHIVO_MAX_BYTES)} por archivo. Las imágenes se reducen
                            automáticamente para ahorrar espacio.
                          </p>
                          {sub && (
                            <p className={sub.error ? "cr-field__error" : "mt-archivo__estado"} role={sub.error ? "alert" : "status"}>
                              {sub.msg}
                            </p>
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
                      {l.tipo === "documento" && !modoArchivo && (
                        <Callout tono="warning">
                          {AVISO_ENLACE_DOCUMENTO} Si el documento es privado, tus estudiantes verán un error al abrirlo.
                        </Callout>
                      )}
                      {l.tipo === "documento" && b && (
                        <p className="cr-field__hint">Guarda el cambio de formato para poder subir un archivo.</p>
                      )}
                    </>
                  )}

                  <Field
                    id={`ed-lec-desc-${l.id}`}
                    label="Descripción breve"
                    opcional
                    ayuda="Una o dos frases que cuenten qué se aprende en esta lección."
                    contador={`${(l.descripcion ?? "").length}/${DESCRIPCION_LECCION_MAX}`}
                    error={eDesc}
                  >
                    <Textarea
                      id={`ed-lec-desc-${l.id}`}
                      value={l.descripcion ?? ""}
                      rows={2}
                      maxLength={DESCRIPCION_LECCION_MAX}
                      conAyuda
                      invalido={!!eDesc}
                      onChange={(e) => cambiarDescripcion(l, e.target.value)}
                    />
                  </Field>
                  <Field
                    id={`ed-lec-dur-${l.id}`}
                    label="Duración estimada (minutos)"
                    opcional
                    ayuda="Cuánto demora, en promedio, completar esta lección."
                    error={eDur}
                  >
                    <Input
                      id={`ed-lec-dur-${l.id}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={DURACION_MAX_MIN}
                      value={l.duracionMin ?? ""}
                      conAyuda
                      invalido={!!eDur}
                      onChange={(e) => cambiarDuracion(l, e.target.value)}
                    />
                  </Field>
                  <section className="ed-lec__mats" aria-labelledby={`ed-lec-mats-${l.id}`}>
                    <h3 id={`ed-lec-mats-${l.id}`} className="ed-lec__mats-t">
                      Materiales de esta lección
                    </h3>
                    <EditorMateriales ctx={ctx} modulo={modulo} leccionId={l.id} nombreGrupo="esta lección" />
                  </section>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div>
        <Button id={`ed-add-leccion-${modulo.id}`} variante="secondary" onClick={agregarLeccion} disabled={trabajando}>
          + Agregar lección
        </Button>
      </div>

      <ConfirmDialog
        abierto={!!pendiente}
        peligro={pendiente?.k !== "tipo"}
        titulo={
          pendiente?.k === "leccion"
            ? `¿Eliminar la lección “${pendiente.l.titulo}”?`
            : pendiente?.k === "tipo"
              ? "¿Cambiar el formato de la lección?"
              : ""
        }
        confirmar={pendiente?.k === "tipo" ? "Guardar y descartar" : "Eliminar"}
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => {
          const p = pendiente;
          if (!p) return;
          if (p.k === "leccion") void eliminarLeccion(p.l);
          else {
            setPendiente(null);
            const bp = borrador[p.l.id];
            if (bp) guardarFormato(p.l, bp);
          }
        }}
      >
        {pendiente?.k === "leccion" && <p>Se eliminará con su contenido. Esta acción no se puede deshacer.</p>}
        {pendiente?.k === "tipo" && <p>Al guardar, el enlace, texto o archivo del formato anterior se borrará. Esta acción no se puede deshacer.</p>}
      </ConfirmDialog>

      <ConfirmDialog
        abierto={!!quitarLec}
        peligro
        titulo={quitarLec ? `¿Quitar el archivo de “${quitarLec.titulo}”?` : ""}
        confirmar="Quitar archivo"
        onCancelar={() => setQuitarLec(null)}
        onConfirmar={() => quitarLec && void quitarArchivoLec(quitarLec)}
      >
        <p>El archivo se eliminará de la academia y tus estudiantes dejarán de verlo. Esta acción no se puede deshacer.</p>
      </ConfirmDialog>
    </div>
  );
}
