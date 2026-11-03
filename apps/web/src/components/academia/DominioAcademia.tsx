"use client";

// Tarjeta "Dominio": dirección incluida en la plataforma y conexión de un dominio propio
// (sin dominio → esperando conexión con registros DNS → conectado).

import { useEffect, useRef, useState } from "react";
import { Icono } from "./Iconos";
import { DNS_CNAME_DESTINO, DNS_IP, DOMINIO_PLATAFORMA, limpiarDominio, validarDominio } from "./marca";

export type EstadoDominio = "sin-dominio" | "pendiente" | "conectado";

type Props = {
  subdominio: string;
  dominioInicial?: string;
  estadoInicial?: EstadoDominio;
  /** Código del registro TXT de verificación. TODO: generarlo al conectar (ver custom_domains). */
  codigoVerificacion?: string;
  /** Registra el dominio (custom_domains, estado "pendiente"). */
  onConectar?: (dominio: string) => Promise<void> | void;
  /** Devuelve true si los registros ya apuntan a Avantia. Sin esta función, la tarjeta funciona en modo demostración. */
  onVerificar?: (dominio: string) => Promise<boolean>;
  onQuitar?: (dominio: string) => Promise<void> | void;
};

export function DominioAcademia({
  subdominio,
  dominioInicial = "",
  estadoInicial = "sin-dominio",
  codigoVerificacion = "[CÓDIGO DE VERIFICACIÓN]",
  onConectar,
  onVerificar,
  onQuitar,
}: Props) {
  const [estado, setEstado] = useState<EstadoDominio>(estadoInicial);
  const [dominio, setDominio] = useState(dominioInicial);
  const [error, setError] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const demo = useRef(0);

  useEffect(() => () => window.clearTimeout(demo.current), []);

  const direccionBase = `${subdominio}.${DOMINIO_PLATAFORMA}`;
  const partes = dominio.split(".");
  const esSubdominio = partes.length > 2;
  const chip =
    estado === "conectado"
      ? { texto: "Conectado", cls: "ac-chip ac-chip--ok" }
      : estado === "pendiente"
        ? { texto: "Esperando conexión", cls: "ac-chip ac-chip--espera" }
        : { texto: "Sin dominio propio", cls: "ac-chip" };

  async function conectar() {
    const r = validarDominio(dominio);
    if (!r.ok) {
      setError(r.error);
      document.getElementById("dom-input")?.focus();
      return;
    }
    setError("");
    try {
      await onConectar?.(r.dominio);
      setIntentos(0);
      setEstado("pendiente");
    } catch {
      setError("No pudimos registrar el dominio. Inténtalo de nuevo.");
    }
  }

  async function verificar() {
    if (verificando) return;
    setVerificando(true);
    let listo: boolean;
    if (onVerificar) {
      listo = await onVerificar(dominio).catch(() => false);
    } else {
      // DEMO: el primer intento "no encuentra" los registros y el segundo conecta.
      await new Promise<void>((ok) => {
        demo.current = window.setTimeout(ok, 1000);
      });
      listo = intentos + 1 >= 2;
    }
    setIntentos((n) => n + 1);
    setVerificando(false);
    if (listo) setEstado("conectado");
  }

  async function quitar() {
    await onQuitar?.(dominio);
    setEstado("sin-dominio");
    setDominio("");
    setIntentos(0);
  }

  return (
    <section className="ac-card ac-card--grid ac-dominio" aria-labelledby="dom-h">
      <div className="ac-card__cab">
        <h3 className="ac-lbl ac-lbl--16" id="dom-h">
          Dominio
        </h3>
        <span className={chip.cls}>{chip.texto}</span>
      </div>

      <div className="ac-dir">
        <span className="ac-help">
          {estado === "conectado" ? "Dirección incluida (redirige a tu dominio)" : "Tu página ya funciona en"}
        </span>
        <b className="ac-mono">{direccionBase}</b>
      </div>

      {estado === "sin-dominio" && (
        <div className="ac-field ac-field--ultimo">
          <label className="ac-lbl" htmlFor="dom-input">
            Dominio propio <span className="ac-opt">Opcional</span>
          </label>
          <div className="ac-fila ac-fila--input">
            <input
              id="dom-input"
              className={`ac-in${error ? " ac-in--mal" : ""}`}
              value={dominio}
              placeholder="academia.tudominio.cl"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error || undefined}
              aria-describedby="dom-ayuda"
              onChange={(e) => {
                setDominio(limpiarDominio(e.target.value));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void conectar();
                }
              }}
            />
            <button type="button" className="ac-btn ac-btn--p" onClick={conectar}>
              Conectar
            </button>
          </div>
          {error && (
            <p className="ac-help ac-txt-err" role="alert">
              {error}
            </p>
          )}
          <span className="ac-help" id="dom-ayuda">
            Usa un dominio que ya tengas. Te recomendamos un subdominio, como academia.tudominio.cl.
          </span>
        </div>
      )}

      {estado === "pendiente" && (
        <div className="ac-grid-12">
          <p className="ac-texto">
            Para conectar <b className="ac-romper">{dominio}</b>:
          </p>
          <ol className="ac-instr">
            <li>Entra al panel donde administras tu dominio.</li>
            <li>Agrega estos registros DNS:</li>
          </ol>
          <div className="ac-tabla-dns">
            <table>
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{esSubdominio ? "CNAME" : "A"}</td>
                  <td className="ac-mono">{esSubdominio ? partes[0] : "@"}</td>
                  <td className="ac-mono">{esSubdominio ? DNS_CNAME_DESTINO : DNS_IP}</td>
                </tr>
                <tr>
                  <td>TXT</td>
                  <td className="ac-mono">_avantia</td>
                  <td className="ac-mono">{codigoVerificacion}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="ac-help">
            3. Vuelve aquí y presiona «Verificar». Los cambios de DNS pueden tardar hasta 48 horas en propagarse.
          </p>
          {intentos > 0 && !verificando && (
            <div className="ac-alert ac-alert--info" role="status">
              <Icono nombre="info" />
              <span>
                <b>Aún no detectamos los registros</b>
                Revisa que el nombre y el valor estén escritos igual. Si los acabas de agregar, intenta de nuevo en un rato.
              </span>
            </div>
          )}
          <div className="ac-fila">
            <button type="button" className="ac-btn ac-btn--p" aria-busy={verificando} onClick={verificar}>
              {verificando ? "Verificando…" : "Verificar"}
            </button>
            <button
              type="button"
              className="ac-btn ac-btn--g"
              onClick={() => {
                window.clearTimeout(demo.current);
                setVerificando(false);
                setIntentos(0);
                setEstado("sin-dominio");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {estado === "conectado" && (
        <div className="ac-grid-10">
          <div className="ac-dir ac-dir--ok">
            <span className="ac-help">Tu página se ve en</span>
            <b className="ac-mono">https://{dominio}</b>
          </div>
          <p className="ac-help">HTTPS activo. La dirección {direccionBase} redirige a tu dominio.</p>
          <div>
            <button type="button" className="ac-btn ac-btn--g ac-btn--sm" onClick={quitar}>
              Quitar dominio
            </button>
          </div>
        </div>
      )}
    </section>
  );
}