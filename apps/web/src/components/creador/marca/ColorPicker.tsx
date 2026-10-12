"use client";

import { useEffect, useId, useState } from "react";
import { textoSobre } from "../../../lib/creador/color";
import { PALETA_MARCA, ajustarParaAA, cumpleAASobreBlanco, ratioSobreBlanco } from "./contraste";
import "../creador.css";
import "./marca.css";

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

const HEX = /^#[0-9a-f]{6}$/i;
const fmt = (n: number) => n.toFixed(1).replace(".", ",");

/** Paleta + color propio (hex) con aviso y ajuste de contraste AA. */
export function ColorPicker({ value, onChange }: Props) {
  const id = useId();
  const [texto, setTexto] = useState(value.toUpperCase());
  useEffect(() => setTexto(value.toUpperCase()), [value]);

  const invalido = !HEX.test(texto);
  const cumple = cumpleAASobreBlanco(value);
  const sugerido = cumple ? value : ajustarParaAA(value);

  function escribir(v: string) {
    const limpio = ("#" + v.replace(/[^0-9a-f]/gi, "")).slice(0, 7).toUpperCase();
    setTexto(limpio);
    if (HEX.test(limpio)) onChange(limpio.toLowerCase());
  }

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

      <div className="mk-color__propio">
        <label className="cr-field__label" htmlFor={`${id}-hex`}>
          Otro color
        </label>
        <div className="mk-color__fila">
          <input
            type="color"
            className="mk-color__nativo"
            aria-label="Elegir color con el selector"
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
    </div>
  );
}
