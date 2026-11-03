"use client";

// Editor de la página de la academia (diseño 2.2): portada, acción principal,
// cursos, sobre ti y testimonios, con vista previa en vivo. El borrador se
// guarda solo; "Publicar" copia el borrador al sitio público (ADR 018).
import Link from "next/link";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import {
  agregarTestimonioAction,
  guardarPaginaAction,
  publicarPaginaAction,
  quitarFotoPortadaAction,
  quitarTestimonioAction,
  subirFotoPortadaAction,
} from "../../../lib/creador/actions";
import {
  BAJADA_MAX,
  BIO_NOMBRE_MAX,
  BIO_TEXTO_MAX,
  EJEMPLOS,
  estadoPagina,
  infoTemplate,
  muestraTestimoniosEjemplo,
  pendientesPagina,
  TESTIMONIO_NOMBRE_MAX,
  TESTIMONIO_TEXTO_MAX,
  TESTIMONIOS_MAX,
  TITULO_PAGINA_MAX,
  type CambiosContenido,
  type CampoPendiente,
  type ClaveTemplate,
  type ContenidoPagina,
  type PaginaAcademia,
} from "../../../lib/creador/paginaReglas";
import type { CursoEditorPagina } from "../../../lib/creador/paginaData";
import { construirDatosSitio, type AcademiaSitio } from "../../../lib/sitio/tipos";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Input, Textarea } from "../Field";
import { useAutosave } from "../editor/useAutosave";
import { VistaNavegador } from "./VistaNavegador";
import "../creador.css";
import "./pagina.css";

interface Props {
  paginaInicial: PaginaAcademia;
  template: ClaveTemplate;
  academia: AcademiaSitio;
  cursos: CursoEditorPagina[];
  direccion: string;
}

/** id del control de cada pendiente (para "Corregir"). */
const ANCLA: Record<CampoPendiente, string> = {
  template: "pg-ed-h",
  titulo: "pg-titulo",
  bajada: "pg-bajada",
  bioNombre: "pg-bio-nombre",
  bioTexto: "pg-bio-texto",
  testimonios: "pg-testis-h",
};

type CampoTexto = "titulo" | "bajada" | "bioNombre" | "bioTexto";

export function EditorPagina({ paginaInicial, template, academia, cursos, direccion }: Props) {
  const auto = useAutosave();
  const [c, setC] = useState<ContenidoPagina>(paginaInicial.contenido);
  const [publicado, setPublicado] = useState(paginaInicial.publicado);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [intento, setIntento] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "success" | "danger"; titulo: string; texto?: string } | null>(null);
  const [publicando, iniciarPublicar] = useTransition();
  const [subiendo, iniciarFoto] = useTransition();
  const [testi, setTesti] = useState<{ abierto: boolean; nombre: string; texto: string; ok: boolean; error: string | null }>({
    abierto: false,
    nombre: "",
    texto: "",
    ok: false,
    error: null,
  });
  const archivo = useRef<HTMLInputElement>(null);

  const ej = EJEMPLOS[template];
  const pendientes = pendientesPagina({ ...c, template });
  const estado = estadoPagina({ contenido: { ...c, template }, publicado });
  const vista = construirDatosSitio({
    contenido: c,
    template,
    academia,
    cursos: cursos.filter((x) => x.estado === "publicado"),
    modo: "vista",
  });

  /** Cambia el borrador en pantalla y agenda su guardado. */
  function cambiar(cambios: CambiosContenido & Partial<ContenidoPagina>, clave: string) {
    setC((prev) => ({ ...prev, ...cambios }) as ContenidoPagina);
    setAviso(null);
    auto.programar(clave, async () => {
      const r = await guardarPaginaAction(cambios as CambiosContenido);
      if (!r.ok && r.campos) setErrores((e) => ({ ...e, ...r.campos }));
      if (r.ok) setErrores((e) => {
        const n = { ...e };
        for (const k of Object.keys(cambios)) delete n[k];
        return n;
      });
      return r;
    });
  }

  function texto(campo: CampoTexto, v: string) {
    cambiar({ [campo]: v.trim() ? v : null } as CambiosContenido, campo);
  }

  function publicar() {
    setIntento(true);
    setAviso(null);
    if (pendientes.length) return;
    iniciarPublicar(async () => {
      await auto.flush();
      const r = await publicarPaginaAction();
      if (!r.ok) {
        setAviso({ tono: "danger", titulo: "No pudimos publicar la página", texto: r.error });
        return;
      }
      setPublicado(r.data.publicado);
      setIntento(false);
      setAviso({ tono: "success", titulo: "Tu página está publicada", texto: `Ya se ve en ${direccion}.` });
    });
  }

  function elegirFoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const fd = new FormData();
    fd.set("foto", f);
    setErrores((x) => ({ ...x, foto: "" }));
    iniciarFoto(async () => {
      const r = await subirFotoPortadaAction(fd);
      if (r.ok) setC((prev) => ({ ...prev, fotoUrl: r.data.contenido.fotoUrl }));
      else setErrores((x) => ({ ...x, foto: r.error }));
    });
  }

  function quitarFoto() {
    iniciarFoto(async () => {
      const r = await quitarFotoPortadaAction();
      if (r.ok) setC((prev) => ({ ...prev, fotoUrl: null }));
      else setErrores((x) => ({ ...x, foto: r.error }));
    });
  }

  async function guardarTestimonio() {
    const r = await auto.encolar(null, () => agregarTestimonioAction({ nombre: testi.nombre, texto: testi.texto, autorizado: testi.ok }));
    if (!r.ok) {
      setTesti((t) => ({ ...t, error: r.error }));
      return;
    }
    setC((prev) => ({ ...prev, testimonios: r.data.contenido.testimonios, ejemploTestimoniosQuitado: true }));
    setTesti({ abierto: false, nombre: "", texto: "", ok: false, error: null });
  }

  async function quitarTestimonio(i: number) {
    const r = await auto.encolar(null, () => quitarTestimonioAction(i));
    if (r.ok) setC((prev) => ({ ...prev, testimonios: r.data.contenido.testimonios }));
  }

  const etiquetaEstado =
    auto.estado === "guardando" ? "Guardando…" : auto.estado === "error" ? "No se guardó" : auto.estado === "guardado" ? "Borrador guardado" : null;

  const campoTexto = (campo: CampoTexto, id: string, label: string, max: number, ejemplo: string, multilinea?: boolean) => {
    const valor = c[campo] ?? "";
    const esEj = !valor;
    const props = {
      id,
      value: valor,
      maxLength: max,
      placeholder: ejemplo,
      invalido: !!errores[campo] || (intento && esEj),
      className: esEj ? "pg-input--ej" : undefined,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => texto(campo, e.target.value),
    };
    return (
      <div className="pg-campo">
        <label className="pg-label" htmlFor={id}>
          {label}
          {esEj && <span className="pg-chip pg-chip--ej">Ejemplo</span>}
        </label>
        {multilinea ? <Textarea rows={3} {...props} /> : <Input {...props} />}
        <div className="pg-campo__pie">
          <span>{esEj ? "Lo de arriba es un ejemplo: escribe el tuyo." : ""}</span>
          <span>
            {valor.length}/{max}
          </span>
        </div>
        {errores[campo] && (
          <span className="pg-error" id={`${id}-error`} role="alert">
            {errores[campo]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="pg-ed-barra">
        <div className="pg-fila">
          <Link className="pg-enlace" href="/mi-academia#pagina">
            ← Mi academia
          </Link>
          <div className="pg-ed-barra__titulo">
            <b id="pg-ed-h">Página de tu academia · template {infoTemplate(template).nombre}</b>
            <span className="pg-fila pg-fila--sm">
              <Badge tono={estado === "publicada" ? "ok" : "warning"}>
                {estado === "publicada" ? "Publicada" : estado === "cambios_sin_publicar" ? "Cambios sin publicar" : "Borrador"}
              </Badge>
              <span className="pg-ayuda" role="status" aria-live="polite">
                {etiquetaEstado ?? (publicado ? `Visible en ${direccion}` : "Aún no es visible")}
              </span>
            </span>
          </div>
        </div>
        <div className="pg-fila">
          <Link className="pg-enlace" href={`/mi-academia/templates/${template}`}>
            Ver template original
          </Link>
          <Button onClick={publicar} disabled={publicando || estado === "publicada"} aria-busy={publicando}>
            {publicando ? "Publicando…" : publicado ? "Publicar cambios" : "Publicar página"}
          </Button>
        </div>
      </div>

      {auto.estado === "error" && (
        <Callout tono="danger" titulo="No pudimos guardar tus últimos cambios">
          {auto.error}{" "}
          <button type="button" className="pg-enlace pg-boton-enlace" onClick={auto.reintentar}>
            Reintentar
          </button>
        </Callout>
      )}
      {aviso && (
        <Callout tono={aviso.tono} titulo={aviso.titulo}>
          {aviso.texto}
        </Callout>
      )}

      <div className="pg-ed-grid pg-mt">
        <div className="pg-ed-form">
          {intento && pendientes.length > 0 ? (
            <Callout tono="danger" titulo="Reemplaza el contenido de ejemplo antes de publicar">
              Quedan {pendientes.length} {pendientes.length === 1 ? "parte" : "partes"} con datos de ejemplo del template:
              <ul className="pg-pendientes">
                {pendientes.map((p) => (
                  <li key={p.campo}>
                    <a href={`#${ANCLA[p.campo]}`}>{p.mensaje}</a>
                  </li>
                ))}
              </ul>
            </Callout>
          ) : (
            pendientes.length > 0 && (
              <Callout tono="warning">
                El template trae contenido de ejemplo. Escribe el tuyo: no se puede publicar con datos inventados.{" "}
                <b>
                  {pendientes.length} {pendientes.length === 1 ? "pendiente" : "pendientes"}.
                </b>
              </Callout>
            )
          )}

          <section className="pg-card" aria-labelledby="pg-portada">
            <h2 className="pg-h3" id="pg-portada">
              Portada
            </h2>
            {campoTexto("titulo", "pg-titulo", "Título", TITULO_PAGINA_MAX, ej.titulo)}
            {campoTexto("bajada", "pg-bajada", "Bajada", BAJADA_MAX, ej.bajada, true)}
            <div className="pg-campo">
              <span className="pg-label" id="pg-foto-l">
                Foto de portada <span className="cr-field__opt">(opcional)</span>
              </span>
              <div className="pg-foto">
                {c.fotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- foto remota por tenant
                  <img src={c.fotoUrl} alt="Foto de portada actual" />
                )}
                <label className="av-btn av-btn--secondary cr-btn" aria-describedby="pg-foto-ayuda">
                  <input ref={archivo} className="pg-vh" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirFoto} disabled={subiendo} />
                  {subiendo ? "Subiendo…" : c.fotoUrl ? "Cambiar foto" : "Subir foto"}
                </label>
                {c.fotoUrl && (
                  <Button variante="ghost" onClick={quitarFoto} disabled={subiendo}>
                    Quitar foto
                  </Button>
                )}
              </div>
              <span className="pg-ayuda" id="pg-foto-ayuda">
                JPG, PNG o WebP, horizontal, mínimo 1.200 px de ancho y hasta 2 MB. Sin foto se usa el color de tu academia.
              </span>
              {errores.foto && (
                <span className="pg-error" role="alert">
                  {errores.foto}
                </span>
              )}
            </div>
          </section>

          <section className="pg-card" aria-labelledby="pg-accion">
            <div className="pg-bloque__cab">
              <h2 className="pg-h3" id="pg-accion">
                Acción principal
              </h2>
              <p className="pg-ayuda">El botón destacado de tu página. Siempre crean su cuenta primero. El pago en línea se sumará después sin cambiar este botón.</p>
            </div>
            <div className="pg-eleccion" role="radiogroup" aria-labelledby="pg-accion">
              <label>
                <input type="radio" name="pg-accion" checked={c.accion === "inscribirme"} onChange={() => cambiar({ accion: "inscribirme" }, "accion")} />
                <span className="pg-eleccion__t">
                  <b>Inscribirme</b>
                  <span className="pg-ayuda">
                    Crean su cuenta y su inscripción queda pendiente. La activas en Estudiantes; con la pasarela, se activará al pagar.
                  </span>
                </span>
              </label>
              <label>
                <input type="radio" name="pg-accion" disabled checked={c.accion === "conversacion"} onChange={() => undefined} />
                <span className="pg-eleccion__t">
                  <b>
                    Agendar una conversación <Badge tono="info">Próximamente</Badge>
                  </b>
                  <span className="pg-ayuda">Para empresas. Te llegará como solicitud en Estudiantes y respondes tú.</span>
                </span>
              </label>
            </div>
          </section>

          <section className="pg-card" aria-labelledby="pg-cursos">
            <h2 className="pg-h3" id="pg-cursos">
              Cursos que se muestran
            </h2>
            {cursos.length === 0 ? (
              <p className="pg-ayuda">
                Aún no tienes cursos. <Link className="pg-enlace" href="/cursos/nuevo">Crea tu primer curso</Link> y publícalo para mostrarlo aquí.
              </p>
            ) : (
              <div className="pg-cursos">
                {cursos.map((x) => {
                  const publicadoCurso = x.estado === "publicado";
                  const visible = publicadoCurso && !c.cursosOcultos.includes(x.id);
                  return (
                    <label key={x.id}>
                      <input
                        type="checkbox"
                        checked={visible}
                        disabled={!publicadoCurso}
                        onChange={() =>
                          cambiar(
                            { cursosOcultos: visible ? [...c.cursosOcultos, x.id] : c.cursosOcultos.filter((id) => id !== x.id) },
                            "cursosOcultos",
                          )
                        }
                      />
                      <span className="pg-eleccion__t">
                        <b>{x.titulo}</b>
                        <span className="pg-ayuda">{publicadoCurso ? "Publicado" : "Borrador · publícalo para mostrarlo"}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="pg-card" aria-labelledby="pg-sobre">
            <h2 className="pg-h3" id="pg-sobre">
              Sobre ti
            </h2>
            {campoTexto("bioNombre", "pg-bio-nombre", "Tu nombre", BIO_NOMBRE_MAX, ej.bioNombre)}
            {campoTexto("bioTexto", "pg-bio-texto", "Trayectoria", BIO_TEXTO_MAX, ej.bioTexto, true)}
          </section>

          <section className="pg-card" aria-labelledby="pg-testis-h">
            <h2 className="pg-h3" id="pg-testis-h" tabIndex={-1}>
              Testimonios y cifras
            </h2>
            {muestraTestimoniosEjemplo(c) && (
              <div className="pg-ejemplo">
                <span className="pg-chip pg-chip--ej pg-inicio">
                  Ejemplo
                </span>
                <b>
                  {ej.testimonios.length} {ej.testimonios.length === 1 ? "testimonio" : "testimonios"} y «{ej.cifra}»
                </b>
                <p className="pg-ayuda">Son del template. Quítalos o reemplázalos por testimonios y cifras reales que puedas respaldar.</p>
                <div>
                  <Button variante="secondary" onClick={() => cambiar({ ejemploTestimoniosQuitado: true }, "ejemploTestimoniosQuitado")}>
                    Quitar contenido de ejemplo
                  </Button>
                </div>
              </div>
            )}

            {c.testimonios.length > 0 && (
              <ul className="pg-testis">
                {c.testimonios.map((t, i) => (
                  <li key={`${t.nombre}-${i}`} className="pg-testi">
                    <div>
                      <b>{t.nombre}</b>
                      <p>«{t.texto}»</p>
                    </div>
                    <Button variante="ghost" onClick={() => quitarTestimonio(i)} aria-label={`Quitar el testimonio de ${t.nombre}`}>
                      Quitar
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {testi.abierto ? (
              <div className="pg-grid">
                <div className="pg-campo">
                  <label className="pg-label" htmlFor="pg-t-nombre">
                    Nombre y cargo
                  </label>
                  <Input
                    id="pg-t-nombre"
                    value={testi.nombre}
                    maxLength={TESTIMONIO_NOMBRE_MAX}
                    placeholder="Ej.: Ana Pérez · Jefa de mantención"
                    onChange={(e) => setTesti((t) => ({ ...t, nombre: e.target.value, error: null }))}
                  />
                </div>
                <div className="pg-campo">
                  <label className="pg-label" htmlFor="pg-t-texto">
                    Testimonio
                  </label>
                  <Textarea
                    id="pg-t-texto"
                    rows={3}
                    value={testi.texto}
                    maxLength={TESTIMONIO_TEXTO_MAX}
                    onChange={(e) => setTesti((t) => ({ ...t, texto: e.target.value, error: null }))}
                  />
                </div>
                <label className="pg-check">
                  <input type="checkbox" checked={testi.ok} onChange={(e) => setTesti((t) => ({ ...t, ok: e.target.checked, error: null }))} />
                  <span>Tengo autorización de esta persona para publicar su nombre y testimonio.</span>
                </label>
                {testi.error && (
                  <span className="pg-error" role="alert">
                    {testi.error}
                  </span>
                )}
                <div className="pg-fila">
                  <Button onClick={guardarTestimonio} disabled={!(testi.nombre.trim() && testi.texto.trim() && testi.ok)}>
                    Agregar
                  </Button>
                  <Button variante="ghost" onClick={() => setTesti({ abierto: false, nombre: "", texto: "", ok: false, error: null })}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              c.testimonios.length < TESTIMONIOS_MAX && (
                <div>
                  <Button variante="secondary" onClick={() => setTesti((t) => ({ ...t, abierto: true }))}>
                    Agregar testimonio real
                  </Button>
                </div>
              )
            )}
          </section>
        </div>

        <div className="pg-ed-vista">
          <div className="pg-ed-vista__cab">
            <b>Vista previa</b>
            <span className="pg-ayuda">Lo marcado en naranjo es contenido de ejemplo</span>
          </div>
          <VistaNavegador d={vista} direccion={direccion} />
        </div>
      </div>
    </div>
  );
}