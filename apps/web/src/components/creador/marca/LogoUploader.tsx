"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { LOGO_MAX_BYTES, LOGO_MIN_LADO, LOGO_TIPOS } from "../../../lib/creador/validacion";
import type { LogoLocal } from "./useLogo";
import "../creador.css";
import "./marca.css";

interface Props {
  logo: LogoLocal;
  onSeleccion: (file: File, url: string, info: string, ratio: number) => void;
  onQuitar: () => void;
  /** Mensaje de error externo (p. ej. fallo al subir en el servidor). */
  errorExterno?: string | null;
}

const ACCEPT = LOGO_TIPOS.join(",");
const AYUDA = `PNG, JPG, SVG o WebP · hasta 2 MB · mínimo ${LOGO_MIN_LADO} px por lado`;

function mb(bytes: number) {
  return (bytes / 1048576).toFixed(1).replace(".", ",");
}

function medir(url: string): Promise<{ ancho: number; alto: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
    img.onerror = () => reject(new Error("ilegible"));
    img.src = url;
  });
}

/**
 * Campo de logo con los estados del diseño (04): vacío, arrastrando,
 * revisando, cargado y error. Toda la zona es clicable (label sobre un input
 * file visualmente oculto pero enfocable) y recibe archivos arrastrados.
 */
export function LogoUploader({ logo, onSeleccion, onQuitar, errorExterno }: Props) {
  const id = useId();
  const inputVacio = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [revisando, setRevisando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enfocarZona, setEnfocarZona] = useState(false);

  // Al quitar el logo, el foco vuelve a la zona de carga (el botón desaparece).
  useEffect(() => {
    if (enfocarZona && !logo.url) {
      inputVacio.current?.focus();
      setEnfocarZona(false);
    }
  }, [enfocarZona, logo.url]);

  async function tomar(file: File | undefined | null) {
    if (!file) return;
    setArrastrando(false);
    setError(null);
    if (!(LOGO_TIPOS as readonly string[]).includes(file.type)) {
      setError("Ese formato no se puede usar. Elige un archivo PNG, JPG, SVG o WebP.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(`El archivo pesa ${mb(file.size)} MB. Usa uno de 2 MB o menos.`);
      return;
    }
    setRevisando(file.name);
    const url = URL.createObjectURL(file);
    try {
      const { ancho, alto } = await medir(url);
      const esSvg = file.type === "image/svg+xml";
      if (!esSvg && Math.min(ancho, alto) < LOGO_MIN_LADO) {
        URL.revokeObjectURL(url);
        setError(`La imagen mide ${ancho} × ${alto} px. Usa una de al menos ${LOGO_MIN_LADO} px por lado.`);
        return;
      }
      const kb = Math.max(1, Math.round(file.size / 1024));
      const info = `${esSvg ? "SVG" : `${ancho} × ${alto} px`} · ${kb} KB`;
      onSeleccion(file, url, info, ancho && alto ? ancho / alto : 1);
    } catch {
      URL.revokeObjectURL(url);
      setError("No pudimos leer la imagen. Prueba con otro archivo o expórtala de nuevo como PNG.");
    } finally {
      setRevisando(null);
    }
  }

  function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite elegir el mismo archivo otra vez
    void tomar(f);
  }
  function alSoltar(e: DragEvent) {
    e.preventDefault();
    void tomar(e.dataTransfer.files?.[0]);
  }

  const msg = error ?? errorExterno ?? null;
  const ayudaId = `${id}-ayuda`;
  const errId = `${id}-error`;
  const describe = [ayudaId, msg ? errId : ""].filter(Boolean).join(" ");

  return (
    <div className="mk-logo">
      {logo.url ? (
        <div className="mk-logo__cargado" aria-busy={!!revisando}>
          <div className={`mk-logo__tablero mk-checker${logo.ratio > 1.8 ? " mk-logo__tablero--ancho" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob) o logo remoto por tenant */}
            <img src={logo.url} alt="Vista previa de tu logo" />
          </div>
          <div className="mk-logo__datos">
            <strong className="mk-logo__nombre">{logo.nombre}</strong>
            {logo.info && <span className="mk-ayuda">{logo.info}</span>}
            {revisando && (
              <span className="mk-ayuda" role="status">
                Revisando tu imagen…
              </span>
            )}
            <div className="mk-logo__acciones">
              <label className="av-btn av-btn--secondary cr-btn mk-pick">
                <input className="mk-vh" type="file" accept={ACCEPT} onChange={alElegir} aria-describedby={describe} />
                Reemplazar
              </label>
              <button
                type="button"
                className="av-btn cr-btn cr-btn--ghost"
                onClick={() => {
                  setError(null);
                  setEnfocarZona(true);
                  onQuitar();
                }}
              >
                Quitar logo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          className={`mk-drop${arrastrando ? " mk-drop--on" : ""}${msg ? " mk-drop--err" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={alSoltar}
        >
          <input
            ref={inputVacio}
            className="mk-vh"
            type="file"
            accept={ACCEPT}
            onChange={alElegir}
            aria-describedby={describe}
          />
          <span className="mk-drop__ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
          </span>
          {revisando ? (
            <>
              <span className="mk-drop__t" role="status">
                <span className="mk-spin" aria-hidden="true" /> Revisando tu imagen…
              </span>
              <span className="mk-ayuda" id={ayudaId}>
                {revisando}
              </span>
            </>
          ) : arrastrando ? (
            <>
              <span className="mk-drop__t">Suelta el archivo para subirlo</span>
              <span className="mk-ayuda" id={ayudaId}>
                {AYUDA}
              </span>
            </>
          ) : (
            <>
              <span className="mk-drop__t">
                Arrastra tu logo aquí o <span className="mk-drop__link">elige un archivo</span>
              </span>
              <span className="mk-ayuda" id={ayudaId}>
                {AYUDA}
              </span>
            </>
          )}
        </label>
      )}

      {logo.url && (
        <span className="mk-ayuda" id={ayudaId}>
          {AYUDA}
        </span>
      )}

      {msg && (
        <div className="mk-alerta" role="alert" id={errId}>
          <strong>No pudimos usar ese archivo</strong>
          <span>{msg}</span>
        </div>
      )}
    </div>
  );
}
