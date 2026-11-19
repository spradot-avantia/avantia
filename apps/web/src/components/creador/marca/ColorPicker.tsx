"use client";

import { useEffect, useId, useState } from "react";
import { FONDO_OSCURO_REF, analizarMarca, colorParaOscuro, marcaOscura, textoSobre } from "../../../lib/creador/color";
import { PALETA_MARCA, ajustarParaAA, cumpleAASobreBlanco, ratioSobreBlanco } from "./contraste";
import "../creador.css";
import "./marca.css";

interface Props {
  value: string;
  onChange: (hex: string) => void;
  /**
   * Color para el modo oscuro (ADR 045): null = automático. Si se pasa `onChangeOscuro`,
   * se muestra la vista previa en claro y en oscuro con su contraste.
   */
  oscuro?: string | null;
  onChangeOscuro?: (hex: string | null) => void;
}

const HEX = /^#[0-9a-f]{6}$/i;
const fmt = (n: number) => n.toFixed(1).replace(".", ",");

/** Selector nativo + campo hexadecimal, con su error. */
function CampoHex({ value, onChange, etiqueta }: { value: string; onChange: (hex: string) => void; etiqueta: string }) {
  const id = useId();
  const [texto, setTexto] = useState(value.toUpperCase());
  useEffect(() => setTexto(value.toUpperCase()), [value]);
  const invalido = !HEX.test(texto);

  function escribir(v: string) {
    const limpio = ("#" + v.replace(/[^0-9a-f]/gi, "")).slice(0, 7).toUpperCase();
    setTexto(limpio);
    if (HEX.test(limpio)) onChange(limpio.toLowerCase());
  }

  return (
    <div className="mk-color__propio">
      <label className="cr-field__label" htmlFor={`${id}-hex`}>
        {etiqueta}
      </label>
      <div className="mk-color__fila">
        <input
          type="color"
          className="mk-color__nativo"
          aria-label={`${etiqueta}: elegir con el selector`}
          value={HEX.test(value) ? value : "#2563eb"}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
        />
        <input
          id={`${id}-hex`}
          className="av-input cr-input mk-color__hex"
          value={texto}
          onChange={(e) => escribir(e.target.value)}
          maxLength={7}
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={invalido || undefined}
          aria-describedby={invalido ? `${id}-err` : undefined}
        />
      </div>
      {invalido && (
        <span className="cr-field__error" id={`${id}-err`} role="alert">
          Escribe un color hexadecimal de 6 dígitos, por ejemplo #2563EB.
        </span>
      )}
    </div>
  );
}

/** Muestra el color como texto y como botón sobre un fondo, con sus ratios. */
function Muestra({
  titulo,
  fondo,
  tinta,
  color,
  ratioTexto,
  ratioBoton,
}: {
  titulo: string;
  fondo: string;
  tinta: string;
  color: string;
  ratioTexto: number;
  ratioBoton: number;
}) {
  const ok = (r: number) => r >= 4.5;
  return (
    <figure className="mk-muestra" style={{ background: fondo, color: tinta }}>
      <figcaption className="mk-muestra__tit">{titulo}</figcaption>
      <span className="mk-muestra__link" style={{ color }}>
        Ver el curso
      </span>
      <span className="mk-muestra__btn" style={{ background: color, color: textoSobre(color) }}>
        Continuar
      </span>
      <ul className="mk-muestra__ratios">
        <li>
          Texto {fmt(ratioTexto)}:1 <span aria-hidden="true">{ok(ratioTexto) ? "✓" : "✕"}</span>
          <span className="av-sr-only">{ok(ratioTexto) ? " cumple AA" : " no cumple AA"}</span>
        </li>
        <li>
          Botón {fmt(ratioBoton)}:1 <span aria-hidden="true">{ok(ratioBoton) ? "✓" : "✕"}</span>
          <span className="av-sr-only">{ok(ratioBoton) ? " cumple AA" : " no cumple AA"}</span>
        </li>
      </ul>
    </figure>
  );
}

/** Paleta + color propio (hex) con aviso y ajuste de contraste AA, en claro y (opcional) en oscuro. */
export function ColorPicker({ value, onChange, oscuro = null, onChangeOscuro }: Props) {
  const idModo = useId();
  const invalido = !HEX.test(value);
  const cumple = cumpleAASobreBlanco(value);
  const sugerido = cumple ? value : ajustarParaAA(value);
  const conOscuro = !!onChangeOscuro;
  const colorOsc = marcaOscura(value, oscuro);
  const a = analizarMarca(value, colorOsc);
  const sugeridoOsc = colorParaOscuro(oscuro ?? value);

  return (
    <div className="mk-color">
      <div role="group" aria-label="Colores sugeridos" className="mk-color__paleta">
        {PALETA_MARCA.map((c) => {
          const activo = value.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              className="mk-sw"
              style={{ background: c, color: textoSobre(c) }}
              aria-label={`Usar ${c}`}
              aria-pressed={activo}
              onClick={() => onChange(c.toLowerCase())}
            >
              {activo && (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <CampoHex value={value} onChange={onChange} etiqueta="Otro color" />

      {!invalido && (
        <p className={`mk-contraste ${cumple ? "mk-contraste--ok" : "mk-contraste--no"}`} role="status">
          {cumple ? (
            <>Contraste {fmt(ratioSobreBlanco(value))}:1 sobre blanco. Cumple AA: enlaces y botones se leen bien.</>
          ) : (
            <>
              Este color es muy claro: sobre fondo blanco tiene contraste {fmt(ratioSobreBlanco(value))}:1 y los enlaces no se leerían bien (mínimo 4,5:1).{" "}
              <button type="button" className="mk-linkbtn" onClick={() => onChange(sugerido)}>
                Usar {sugerido.toUpperCase()} (ajustado)
              </button>
            </>
          )}
        </p>
      )}

      {conOscuro && !invalido && (
        <fieldset className="mk-oscuro">
          <legend className="cr-field__label">En modo oscuro</legend>
          <p className="mk-oscuro__ayuda">
            Muchos estudiantes usan el celular en modo oscuro. Sobre un fondo oscuro tu color necesita ser más claro para leerse.
          </p>
          <div className="mk-oscuro__modos">
            <label className="mk-oscuro__modo">
              <input type="radio" name={`${idModo}-modo`} checked={oscuro === null} onChange={() => onChangeOscuro!(null)} />
              <span>
                Automático <small>(recomendado: {colorOsc.toUpperCase()})</small>
              </span>
            </label>
            <label className="mk-oscuro__modo">
              <input type="radio" name={`${idModo}-modo`} checked={oscuro !== null} onChange={() => onChangeOscuro!(colorOsc)} />
              <span>Elegir otro color</span>
            </label>
          </div>
          {oscuro !== null && <CampoHex value={oscuro} onChange={(c) => onChangeOscuro!(c)} etiqueta="Color en modo oscuro" />}

          <div className="mk-muestras">
            <Muestra titulo="Fondo claro" fondo="#ffffff" tinta="#0a1029" color={value} ratioTexto={a.sobreClaro} ratioBoton={a.textoEncimaClaro} />
            <Muestra titulo="Fondo oscuro" fondo={FONDO_OSCURO_REF} tinta="#e9ecf8" color={colorOsc} ratioTexto={a.sobreOscuro} ratioBoton={a.textoEncimaOscuro} />
          </div>

          {oscuro !== null && !a.cumpleOscuro && (
            <p className="mk-contraste mk-contraste--no" role="status">
              Este color se pierde sobre fondo oscuro ({fmt(a.sobreOscuro)}:1; mínimo 4,5:1).{" "}
              <button type="button" className="mk-linkbtn" onClick={() => onChangeOscuro!(sugeridoOsc)}>
                Usar {sugeridoOsc.toUpperCase()} (ajustado)
              </button>
            </p>
          )}
        </fieldset>
      )}
    </div>
  );
}
