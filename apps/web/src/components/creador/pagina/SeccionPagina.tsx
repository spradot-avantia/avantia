"use client";

// Mi academia > Página de tu academia: template elegido, estado de publicación
// y accesos a la encuesta, al editor y a la vista del template (diseño 02).
import Link from "next/link";
import { useState, useTransition } from "react";
import { elegirTemplateAction } from "../../../lib/creador/actions";
import { estadoPagina, infoTemplate, TEMPLATES, type ClaveTemplate, type PaginaAcademia } from "../../../lib/creador/paginaReglas";
import { Callout } from "../Callout";
import { LinkButton } from "../Button";
import { MiniTemplate } from "./MiniTemplate";
import "../creador.css";
import "./pagina.css";

const CHIP = {
  sin_publicar: { texto: "Sin publicar", cls: "pg-chip" },
  publicada: { texto: "Publicada", cls: "pg-chip pg-chip--ok" },
  cambios_sin_publicar: { texto: "Cambios sin publicar", cls: "pg-chip pg-chip--espera" },
} as const;

export function SeccionPagina({ pagina, color, direccion }: { pagina: PaginaAcademia; color: string; direccion: string }) {
  const [p, setP] = useState(pagina);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const template = p.contenido.template;
  const estado = estadoPagina(p);

  function elegir(clave: ClaveTemplate) {
    if (clave === template || pendiente) return;
    const previo = p;
    setP({ ...p, contenido: { ...p.contenido, template: clave } });
    setError(null);
    iniciar(async () => {
      const r = await elegirTemplateAction(clave);
      if (r.ok) setP(r.data);
      else {
        setP(previo);
        setError(r.error);
      }
    });
  }

  return (
    <section id="pagina" className="pg-bloque" aria-labelledby="pg-h">
      <div className="pg-bloque__cab">
        <h2 className="pg-h2" id="pg-h">
          Página de tu academia
        </h2>
        <p className="pg-ayuda">La página pública donde las personas conocen tus cursos y se inscriben.</p>
      </div>

      <section className="pg-card" aria-labelledby="pg-tpl">
        <div className="pg-card__cab">
          <h3 className="pg-h3" id="pg-tpl">
            Template
          </h3>
          <span className={CHIP[estado].cls} role="status">
            {pendiente ? "Guardando…" : CHIP[estado].texto}
          </span>
        </div>

        <div role="radiogroup" aria-labelledby="pg-tpl" className="pg-tpls">
          {TEMPLATES.map((t) => (
            <button
              key={t.clave}
              type="button"
              role="radio"
              aria-checked={template === t.clave}
              className="pg-tpl"
              onClick={() => elegir(t.clave)}
            >
              <MiniTemplate clave={t.clave} color={color} />
              <b>{t.nombre}</b>
              <span className="pg-ayuda">{t.corta}</span>
            </button>
          ))}
        </div>

        {error && <Callout tono="danger" titulo="No pudimos guardar el template">{error}</Callout>}

        <div className="pg-fila">
          {template ? (
            <>
              <LinkButton href="/mi-academia/pagina">Editar contenido de la página</LinkButton>
              <LinkButton href={`/mi-academia/templates/${template}`} variante="secondary">
                Ver template {infoTemplate(template).nombre}
              </LinkButton>
            </>
          ) : (
            <p className="pg-ayuda">Elige un template para empezar a editar tu página.</p>
          )}
          <Link className="pg-enlace" href="/mi-academia/encuesta">
            ¿No sabes cuál elegir? Responde 5 preguntas
          </Link>
        </div>

        {p.publicado && (
          <p className="pg-ayuda">
            Visible en{" "}
            <a className="pg-enlace" href={`https://${direccion}`} target="_blank" rel="noreferrer">
              {direccion}
            </a>
          </p>
        )}
      </section>
    </section>
  );
}