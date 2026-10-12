"use client";

import { useRef, useState, type ReactNode } from "react";
import { despublicarCursoAction, publicarCursoAction } from "../../../lib/creador/actions";
import { leccionLista } from "../../../lib/creador/reglasPublicacion";
import { PASOS_EDITOR, type PasoEditor, type ResultadoValidacionPublicacion } from "../../../lib/creador/types";
import { Button, LinkButton } from "../Button";
import { Callout } from "../Callout";
import { ConfirmDialog } from "./ConfirmDialog";
import type { EditorCtx } from "./contexto";

const tituloPaso = (id: PasoEditor) => PASOS_EDITOR.find((p) => p.id === id)?.titulo ?? id;

function fechaLarga(f: string | null): string {
  if (!f) return "";
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${f}T00:00:00Z`),
  );
}

type Fase = "reposo" | "publicando" | "error";

/** Paso 6: necesario para publicar, recomendaciones, resumen, vista previa y publicacion. */
export function PasoRevisar({ ctx, validacion }: { ctx: EditorCtx; validacion: ResultadoValidacionPublicacion }) {
  const { curso, setCurso } = ctx;
  const publicado = curso.estado === "publicado";
  const [fase, setFase] = useState<Fase>("reposo");
  const [detalleError, setDetalleError] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [despublicando, setDespublicando] = useState(false);
  const [url, setUrl] = useState(ctx.urlPublica);
  const [copiado, setCopiado] = useState<"" | "ok" | "manual">("");
  const exitoRef = useRef<HTMLHeadingElement>(null);
  const inputUrl = useRef<HTMLInputElement>(null);

  const { bloqueos, recomendaciones, puedePublicar } = validacion;
  const modulos = curso.modulos.length;
  const lecciones = curso.modulos.reduce((n, m) => n + m.lecciones.length, 0);
  const listas = curso.modulos.reduce((n, m) => n + m.lecciones.filter(leccionLista).length, 0);

  const publicar = async () => {
    setConfirmando(false);
    setFase("publicando");
    ctx.anunciar("Publicando…");
    try {
      await ctx.auto.flush();
      const r = await publicarCursoAction(curso.id);
      if (r.ok) {
        setUrl(r.data.url);
        setCurso((c) => ({ ...c, estado: "publicado", publishedAt: c.publishedAt ?? new Date().toISOString() }));
        setFase("reposo");
        ctx.anunciar("Curso publicado");
        setTimeout(() => exitoRef.current?.focus(), 0);
        return;
      }
      setDetalleError(r.error);
    } catch {
      setDetalleError("No pudimos conectarnos. Revisa tu conexión.");
    }
    setFase("error");
  };

  const despublicar = async () => {
    setDespublicando(false);
    const r = await ctx.auto.encolar(null, () => despublicarCursoAction(curso.id));
    if (!r.ok) return ctx.avisar(r.error);
    setCurso((c) => ({ ...c, estado: "borrador" }));
    ctx.anunciar("El curso volvió a borrador");
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado("ok");
      ctx.anunciar("Enlace copiado");
    } catch {
      inputUrl.current?.select();
      setCopiado("manual");
    }
  };

  const filas: ReadonlyArray<{ k: string; paso: PasoEditor; v: ReactNode }> = [
    { k: "Título", paso: "esencial", v: curso.titulo || "—" },
    { k: "Descripción", paso: "esencial", v: curso.descripcion || "—" },
    {
      k: "Objetivos",
      paso: "objetivo",
      v: curso.objetivos.filter((o) => o.trim()).length ? (
        <ul className="ed-res__ul">
          {curso.objetivos
            .filter((o) => o.trim())
            .map((o, i) => (
              <li key={i}>{o}</li>
            ))}
        </ul>
      ) : (
        "—"
      ),
    },
    {
      k: "Contenido",
      paso: "estructura",
      v: `${modulos} ${modulos === 1 ? "módulo" : "módulos"} · ${lecciones} ${lecciones === 1 ? "lección" : "lecciones"} (${listas} ${listas === 1 ? "lista" : "listas"})`,
    },
    {
      k: "Modalidad",
      paso: "modalidad",
      v:
        curso.modalidad === "a_su_ritmo"
          ? "A su ritmo"
          : curso.fechaInicio && curso.fechaTermino
            ? `Del ${fechaLarga(curso.fechaInicio)} al ${fechaLarga(curso.fechaTermino)}`
            : "Con fechas (faltan fechas)",
    },
    {
      k: "Acceso",
      paso: "acceso",
      v: curso.acceso === "invitados" ? "Solo personas que yo invite" : "Cualquiera con el enlace",
    },
  ];

  return (
    <div className="ed-form">
      <p className="ed-lede">
        Revisa el resumen, mira tu curso como lo verán tus estudiantes y publícalo. Después de publicar puedes seguir editando.
      </p>

      {publicado && (
        <section className="ed-exito" aria-labelledby="ed-exito-t">
          <h3 id="ed-exito-t" className="ed-exito__t" tabIndex={-1} ref={exitoRef}>
            Tu curso está publicado
          </h3>
          <p>
            “{curso.titulo}” ya aparece como publicado en tus cursos. Puedes seguir editándolo cuando quieras; los cambios se guardan solos.
          </p>
          <div className="ed-field-url">
            <label htmlFor="ed-url" className="cr-field__label">
              Enlace del curso
            </label>
            <p className="cr-field__hint">
              {curso.acceso === "invitados"
                ? "Compártelo con las personas que invitaste. Solo podrán inscribirse quienes registres."
                : "Cualquiera con este enlace puede inscribirse."}
            </p>
            <div className="ed-url-fila">
              <input id="ed-url" ref={inputUrl} className="av-input cr-input" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
              <Button variante="secondary" onClick={copiar}>
                {copiado === "ok" ? "Enlace copiado" : "Copiar enlace"}
              </Button>
            </div>
            {copiado === "manual" && <p className="cr-field__hint">No pudimos copiarlo automáticamente: el enlace quedó seleccionado, cópialo con Ctrl+C.</p>}
          </div>

          <h4 className="ed-exito__sub">Lo que sigue</h4>
          <ol className="ed-sigue">
            {curso.acceso === "invitados" && (
              <li>
                <div>
                  <strong>Registra a los estudiantes del piloto</strong>
                  <span>Así llevas su seguimiento desde Estudiantes.</span>
                </div>
                <LinkButton href="/estudiantes" variante="secondary">
                  Registrar estudiantes
                </LinkButton>
              </li>
            )}
            <li>
              <div>
                <strong>Comparte el enlace</strong>
                <span>Envíaselo por correo o mensaje a quienes quieras que entren.</span>
              </div>
              <Button variante="secondary" onClick={copiar}>
                Copiar enlace
              </Button>
            </li>
            <li>
              <div>
                <strong>Vuelve a Inicio</strong>
                <span>Ahí ves el estado de tu academia y tus próximos pasos.</span>
              </div>
              <LinkButton href="/" variante="secondary">
                Ir a Inicio
              </LinkButton>
            </li>
          </ol>
          <div>
            <Button variante="ghost" onClick={() => setDespublicando(true)}>
              Pasar a borrador
            </Button>
          </div>
        </section>
      )}

      {!publicado && (
        <section aria-labelledby="ed-nec-t" className="ed-bloque">
          <h3 id="ed-nec-t" className="ed-bloque__t">
            Necesario para publicar
          </h3>
          {puedePublicar ? (
            <Callout tono="success" titulo="Tu curso cumple todo lo necesario para publicarse." />
          ) : (
            <>
              <p className="ed-bloque__d">
                Faltan {bloqueos.length} {bloqueos.length === 1 ? "cosa" : "cosas"} para publicar.
              </p>
              <ul className="ed-pend">
                {bloqueos.map((b, i) => (
                  <li key={i}>
                    <span>{b.mensaje}</span>
                    <Button variante="secondary" onClick={() => ctx.irAPaso(b.paso)}>
                      Corregir en {tituloPaso(b.paso)}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="ed-rec-t" className="ed-bloque">
        <h3 id="ed-rec-t" className="ed-bloque__t">
          Recomendaciones <span className="ed-bloque__sub">No impiden publicar</span>
        </h3>
        <ul className="ed-pend">
          {recomendaciones.map((r, i) => (
            <li key={i}>
              <span>{r.mensaje}</span>
              <Button variante="ghost" onClick={() => ctx.irAPaso(r.paso)}>
                Ir a {tituloPaso(r.paso)}
              </Button>
            </li>
          ))}
          <li>
            <span>Revisa la vista previa antes de publicar: así detectas lo que falta o se ve raro.</span>
            <Button variante="ghost" onClick={() => void ctx.salir(`/cursos/${curso.id}/vista-previa`)}>
              Ver
            </Button>
          </li>
        </ul>
      </section>

      <section aria-labelledby="ed-prev-t" className="ed-bloque">
        <h3 id="ed-prev-t" className="ed-bloque__t">
          Vista previa
        </h3>
        <p className="ed-bloque__d">Mira tu curso como lo verá un estudiante. Los botones están desactivados.</p>
        <div className="ed-prev-acc">
          <Button variante="secondary" onClick={() => void ctx.salir(`/cursos/${curso.id}/vista-previa?modo=escritorio`)}>
            Ver en escritorio
          </Button>
          <Button variante="secondary" onClick={() => void ctx.salir(`/cursos/${curso.id}/vista-previa?modo=movil`)}>
            Ver en móvil
          </Button>
        </div>
      </section>

      <section aria-labelledby="ed-res-t" className="ed-bloque">
        <h3 id="ed-res-t" className="ed-bloque__t">
          Resumen
        </h3>
        <dl className="ed-res">
          {filas.map((f) => (
            <div key={f.k} className="ed-res__fila">
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
              <Button variante="ghost" aria-label={`Editar ${f.k.toLowerCase()}`} onClick={() => ctx.irAPaso(f.paso)}>
                Editar
              </Button>
            </div>
          ))}
        </dl>
      </section>

      {!publicado && (
        <section className="ed-publicar" aria-label="Publicar">
          {fase === "error" && (
            <Callout tono="danger" titulo="No se pudo publicar. Tu borrador sigue guardado.">
              {detalleError}
            </Callout>
          )}
          <div className="ed-publicar__fila">
            <p id="ed-publicar-nota" className="ed-bloque__d">
              {puedePublicar ? "Te pediremos confirmar antes de publicar." : "Resuelve lo necesario para poder publicar."}
            </p>
            <Button
              aria-describedby="ed-publicar-nota"
              disabled={!puedePublicar || fase === "publicando"}
              aria-busy={fase === "publicando"}
              onClick={() => setConfirmando(true)}
            >
              {fase === "publicando" ? "Publicando…" : fase === "error" ? "Reintentar" : "Publicar curso"}
            </Button>
          </div>
        </section>
      )}

      <ConfirmDialog
        abierto={confirmando}
        titulo={`¿Publicar “${curso.titulo}”?`}
        confirmar="Publicar curso"
        cancelar="Seguir revisando"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => void publicar()}
      >
        <ul className="ed-dialog__lista">
          <li>Aparecerá como publicado en tus cursos.</li>
          <li>
            {curso.acceso === "invitados"
              ? "Podrán inscribirse solo las personas que registres."
              : "Cualquiera con el enlace podrá inscribirse."}
          </li>
          <li>Puedes seguir editándolo; los cambios se guardan solos.</li>
        </ul>
      </ConfirmDialog>

      <ConfirmDialog
        abierto={despublicando}
        titulo="¿Pasar el curso a borrador?"
        confirmar="Pasar a borrador"
        onCancelar={() => setDespublicando(false)}
        onConfirmar={() => void despublicar()}
      >
        <p>Dejará de figurar como publicado. Podrás volver a publicarlo cuando quieras.</p>
      </ConfirmDialog>
    </div>
  );
}
