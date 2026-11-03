"use client";

import { useState, useTransition } from "react";
import { activarInscripcionAction, rechazarInscripcionAction } from "../../../lib/creador/actions";
import type { FilaInscripcion } from "../../../lib/creador/inscripciones";
import { MEDIOS_PAGO } from "../../../lib/creador/mediosPago";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Callout } from "../Callout";
import "../inicio/inicio.css";

const ORIGEN = { invitacion: "Invitación", anuncio: "Anuncio", pagina: "Tu página" } as const;

function cuando(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function precio(c: number): string {
  return c > 0 ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(c / 100) : "Gratuito";
}
const horasEspera = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3600000;

/** Inscripciones pendientes: el creador confirma el pago y las activa (o rechaza). */
export function PorActivar({ filas }: { filas: FilaInscripcion[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [medio, setMedio] = useState("transferencia");
  const [confirma, setConfirma] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, start] = useTransition();

  function abrir(id: string, f: FilaInscripcion) {
    setAbierta(abierta === id ? null : id);
    setMedio(f.precioCentavos > 0 ? "transferencia" : "sin_costo");
    setConfirma(false);
    setError(null);
  }
  function activar(id: string) {
    setError(null);
    start(async () => {
      const r = await activarInscripcionAction(id, medio, confirma);
      if (!r.ok) setError(r.error);
      else setAbierta(null);
    });
  }
  function rechazar(f: FilaInscripcion) {
    if (!window.confirm(`¿Rechazar la inscripción de ${f.nombre}? No podrá entrar a «${f.cursoTitulo}».`)) return;
    setError(null);
    start(async () => {
      const r = await rechazarInscripcionAction(f.id);
      if (!r.ok) setError(r.error);
    });
  }

  if (filas.length === 0) {
    return <Callout titulo="No tienes inscripciones por activar">Aquí aparecen quienes crean su cuenta desde un anuncio o tu página.</Callout>;
  }

  return (
    <div className="ci-stack" style={{ gap: "var(--av-space-3)" }}>
      <Callout tono="info">
        Estas personas ya crearon su cuenta. Escríbeles para coordinar el pago y activa su inscripción. Cuando conectes la pasarela de pago, este paso será automático.
      </Callout>
      {error && (
        <p role="alert" className="cr-field__error">
          {error}
        </p>
      )}
      <ul className="ci-list">
        {filas.map((f) => (
          <li key={f.id} className="ci-card ci-stack" style={{ gap: "var(--av-space-3)" }}>
            <div className="ci-row__main">
              <span className="ci-row__title">
                {f.nombre} · {f.correo}
              </span>
              <div className="ci-row__meta">
                <span>
                  {f.cursoTitulo} · {precio(f.precioCentavos)}
                </span>
                <span>
                  {ORIGEN[f.origen]}
                  {f.campana ? ` · ${f.campana}` : ""} · cuenta creada {cuando(f.creadaEn)}
                </span>
                {horasEspera(f.creadaEn) > 24 && <Badge tono="warning">Lleva más de 24 horas esperando</Badge>}
              </div>
            </div>

            {abierta === f.id ? (
              <fieldset className="ci-stack" style={{ gap: "var(--av-space-3)", border: 0, padding: 0, margin: 0 }} disabled={pendiente}>
                <legend className="ci-row__title">Activar la inscripción de {f.nombre}</legend>
                <p className="cr-field__hint">¿Cómo se pagó?</p>
                {MEDIOS_PAGO.map((m) => (
                  <label key={m.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", minHeight: 44 }}>
                    <input type="radio" name={`medio-${f.id}`} value={m.id} checked={medio === m.id} onChange={() => setMedio(m.id)} style={{ width: 22, height: 22 }} />
                    <span>
                      <strong>{m.titulo}</strong>
                      <br />
                      <span className="cr-field__hint">{m.detalle}</span>
                    </span>
                  </label>
                ))}
                <label style={{ display: "flex", gap: 12, alignItems: "flex-start", minHeight: 44 }}>
                  <input type="checkbox" checked={confirma} onChange={(e) => setConfirma(e.target.checked)} style={{ width: 22, height: 22 }} />
                  <span>Confirmo que recibí el pago fuera de la plataforma (o que este acceso no tiene costo).</span>
                </label>
                <p className="cr-field__hint">Queda registrado como pago manual. Con la pasarela, la plataforma lo registrará sola.</p>
                <div className="ci-actions">
                  <Button onClick={() => activar(f.id)} disabled={pendiente || !confirma}>
                    {pendiente ? "Activando…" : "Activar inscripción"}
                  </Button>
                  <Button variante="secondary" onClick={() => setAbierta(null)}>
                    Cancelar
                  </Button>
                </div>
              </fieldset>
            ) : (
              <div className="ci-actions">
                <Button onClick={() => abrir(f.id, f)} disabled={pendiente}>
                  Activar inscripción
                </Button>
                <Button variante="ghost" onClick={() => rechazar(f)} disabled={pendiente}>
                  Rechazar
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Estudiantes con cuenta: inscripción, avance, XP y quién lleva días sin entrar. */
export function TablaAlumnos({ filas }: { filas: FilaInscripcion[] }) {
  if (filas.length === 0) {
    return <Callout titulo="Aún no hay estudiantes con cuenta">Cuando alguien cree su cuenta o acepte tu invitación, aparecerá aquí con su avance.</Callout>;
  }
  const ESTADO = {
    activa: <Badge tono="ok">Activa</Badge>,
    pendiente: <Badge tono="warning">Por activar</Badge>,
    rechazada: <Badge tono="neutral">Rechazada</Badge>,
    vencida: <Badge tono="neutral">Vencida</Badge>,
    cancelada: <Badge tono="neutral">Cancelada</Badge>,
  } as const;
  return (
    <ul className="ci-list">
      {filas.map((f) => (
        <li key={f.id} className="ci-row ci-row--compact ci-card">
          <div className="ci-row__main">
            <span className="ci-row__title">{f.nombre}</span>
            <div className="ci-row__meta">
              <span>{f.correo}</span>
              <span>{f.cursoTitulo}</span>
              <span>
                {ORIGEN[f.origen]}
                {f.campana ? ` · ${f.campana}` : ""}
              </span>
            </div>
          </div>
          <div className="ci-row__meta" style={{ justifyContent: "flex-end" }}>
            {ESTADO[f.estado]}
            {f.estado === "activa" && (
              <>
                <span>
                  Avance <strong>{f.avance} %</strong> ({f.completadas}/{f.totalLecciones})
                </span>
                <span>
                  <strong>{f.xp}</strong> XP
                </span>
                {f.sinActividad && <Badge tono="warning">Sin actividad</Badge>}
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Pestañas «Estudiantes» y «Por activar» del diseño 04.1. */
export function InscripcionesAlumnos({
  inscripciones,
  vistaInicial,
}: {
  inscripciones: FilaInscripcion[];
  vistaInicial?: "por-activar";
}) {
  const porActivar = inscripciones.filter((i) => i.estado === "pendiente");
  const alumnos = inscripciones.filter((i) => i.estado !== "pendiente");
  const [vista, setVista] = useState<"estudiantes" | "por-activar">(vistaInicial ?? (porActivar.length > 0 ? "por-activar" : "estudiantes"));
  const pestanas = [
    { id: "estudiantes" as const, texto: `Estudiantes (${alumnos.length})` },
    { id: "por-activar" as const, texto: `Por activar (${porActivar.length})` },
  ];
  return (
    <section className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-label="Estudiantes con cuenta">
      <div role="tablist" aria-label="Vista" className="ci-actions">
        {pestanas.map((p) => (
          <Button
            key={p.id}
            role="tab"
            aria-selected={vista === p.id}
            variante={vista === p.id ? "primary" : "secondary"}
            onClick={() => setVista(p.id)}
          >
            {p.texto}
          </Button>
        ))}
      </div>
      <div role="tabpanel">{vista === "por-activar" ? <PorActivar filas={porActivar} /> : <TablaAlumnos filas={alumnos} />}</div>
    </section>
  );
}
