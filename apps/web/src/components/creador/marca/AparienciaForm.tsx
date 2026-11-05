"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { guardarAparienciaAction } from "../../../lib/creador/actions";
import type { TenantCreador } from "../../../lib/creador/types";
import {
  FORMAS,
  OPCIONES_FORMA,
  OPCIONES_TIPOGRAFIA,
  TIPOGRAFIAS,
  clasesIdentidad,
  type Forma,
  type Tipografia,
} from "../../../lib/tenant/identidad";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { IndicadorGuardado } from "./IndicadorGuardado";
import { PreviewMarca } from "./PreviewMarca";
import "../creador.css";
import "./marca.css";
import "./apariencia.css";

/**
 * Mi academia > Apariencia (ADR 027): tipografía y forma de lista cerrada.
 * Las variables --font-tn-* las declara el contenedor padre (clasesFuentes), para que
 * cada tarjeta muestre «Aa» en su fuente real.
 */
export function AparienciaForm({ tenant }: { tenant: TenantCreador }) {
  const router = useRouter();
  const [base, setBase] = useState<{ tipografia: Tipografia; forma: Forma }>({ tipografia: tenant.tipografia, forma: tenant.forma });
  const [tipografia, setTipografia] = useState<Tipografia>(tenant.tipografia);
  const [forma, setForma] = useState<Forma>(tenant.forma);
  const [error, setError] = useState<string | null>(null);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const sucio = tipografia !== base.tipografia || forma !== base.forma;

  function descartar() {
    setTipografia(base.tipografia);
    setForma(base.forma);
    setError(null);
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    iniciar(async () => {
      const r = await guardarAparienciaAction({ tipografia, forma });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setBase({ tipografia: r.data.tipografia, forma: r.data.forma });
      setTipografia(r.data.tipografia);
      setForma(r.data.forma);
      setGuardadoOk(true);
      router.refresh();
    });
  }

  return (
    <form className="mk-card" onSubmit={guardar} noValidate aria-labelledby="mk-apariencia-h">
      <div className="mk-card__head">
        <h2 className="mk-h2" id="mk-apariencia-h">
          Apariencia
        </h2>
        <IndicadorGuardado sucio={sucio} guardando={pendiente} />
      </div>
      <p className="mk-ayuda">Elige cómo se leen y se sienten el sitio de tu academia y las pantallas de tus estudiantes. El color y el logo los defines en Marca.</p>

      <fieldset className="ap-grupo" onChange={() => setGuardadoOk(false)}>
        <legend className="cr-field__label">Tipografía</legend>
        <div className="ap-opciones">
          {TIPOGRAFIAS.map((t) => (
            <label key={t} className={`ap-opcion ${clasesIdentidad(t, forma)}`}>
              <input
                type="radio"
                name="ap-tipografia"
                value={t}
                checked={tipografia === t}
                onChange={() => setTipografia(t)}
              />
              <span className="ap-muestra ap-muestra--tipo" aria-hidden="true">
                Aa
              </span>
              <span className="ap-nombre">{OPCIONES_TIPOGRAFIA[t].nombre}</span>
              <span className="ap-detalle">{OPCIONES_TIPOGRAFIA[t].detalle}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="ap-grupo" onChange={() => setGuardadoOk(false)}>
        <legend className="cr-field__label">Forma de las esquinas</legend>
        <div className="ap-opciones ap-opciones--forma">
          {FORMAS.map((f) => (
            <label key={f} className={`ap-opcion ${clasesIdentidad(tipografia, f)}`}>
              <input type="radio" name="ap-forma" value={f} checked={forma === f} onChange={() => setForma(f)} />
              <span className="ap-muestra ap-muestra--forma" aria-hidden="true" />
              <span className="ap-nombre">{OPCIONES_FORMA[f].nombre}</span>
              <span className="ap-detalle">{OPCIONES_FORMA[f].detalle}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <PreviewMarca
        nombre={tenant.nombre}
        frase={tenant.frase ?? ""}
        logoUrl={tenant.logoUrl}
        logoModo={tenant.logoModo}
        color={tenant.colorPrimario}
        tipografia={tipografia}
        forma={forma}
        idTitulo="mk-prev-apariencia"
        titulo="Así se verá con esta apariencia"
      />

      {error && (
        <Callout tono="danger" titulo="No pudimos guardar la apariencia">
          {error} Tus cambios siguen aquí; inténtalo de nuevo.
        </Callout>
      )}
      {guardadoOk && !sucio && <Callout tono="success" titulo="Apariencia guardada" />}

      <div className="mk-acciones">
        <Button type="submit" disabled={!sucio || pendiente}>
          {pendiente ? "Guardando…" : "Guardar apariencia"}
        </Button>
        {sucio && (
          <Button variante="ghost" onClick={descartar} disabled={pendiente}>
            Descartar cambios
          </Button>
        )}
      </div>
    </form>
  );
}
