"use client";

// Tarjeta "Dominio": dirección incluida y conexión de un dominio propio.
// Concierge (RQ-30, ADR 021): el creador agrega los registros DNS y el equipo
// de Avantia verifica y conecta el dominio; aquí no hay verificación automática.
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { cancelarSolicitudDominioAction, solicitarDominioAction } from "../../../lib/creador/actions";
import { limpiarDominio, registrosDns, validarDominio } from "../../../lib/creador/paginaReglas";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Input } from "../Field";
import "../creador.css";
import "./pagina.css";

interface Props {
  direccionBase: string;
  dominioRaiz: string;
  /** tenants.custom_domain: lo llena el equipo al conectar. */
  dominioConectado: string | null;
  solicitado: string | null;
  token: string | null;
}

export function DominioCard({ direccionBase, dominioRaiz, dominioConectado, solicitado: solicitadoInicial, token: tokenInicial }: Props) {
  const router = useRouter();
  const [solicitado, setSolicitado] = useState(solicitadoInicial);
  const [token, setToken] = useState(tokenInicial);
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [revisado, setRevisado] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const conectado = !!dominioConectado && (!solicitado || solicitado === dominioConectado);
  const estado = conectado ? "conectado" : solicitado ? "pendiente" : "sin";
  const chip =
    estado === "conectado"
      ? { t: "Conectado", c: "pg-chip pg-chip--ok" }
      : estado === "pendiente"
        ? { t: "Esperando conexión", c: "pg-chip pg-chip--espera" }
        : { t: "Sin dominio propio", c: "pg-chip" };

  function conectar(e: FormEvent) {
    e.preventDefault();
    const v = validarDominio(valor, dominioRaiz);
    if (!v.ok) {
      setError(v.error);
      document.getElementById("pg-dominio")?.focus();
      return;
    }
    setError(null);
    iniciar(async () => {
      const r = await solicitarDominioAction(v.dominio);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSolicitado(r.data.dominioSolicitado);
      setToken(r.data.dominioToken);
      setValor("");
    });
  }

  function cancelar() {
    iniciar(async () => {
      const r = await cancelarSolicitudDominioAction();
      if (r.ok) {
        setSolicitado(null);
        setToken(null);
        setRevisado(false);
      } else setError(r.error);
    });
  }

  function revisar() {
    setRevisado(true);
    router.refresh();
  }

  return (
    <section className="pg-card" aria-labelledby="pg-dom-h">
      <div className="pg-card__cab">
        <h3 className="pg-h3" id="pg-dom-h">
          Dominio
        </h3>
        <span className={chip.c}>{chip.t}</span>
      </div>

      <div className="pg-dir">
        <span className="pg-ayuda">{conectado ? "Dirección incluida" : "Tu página ya funciona en"}</span>
        <b className="pg-mono">{direccionBase}</b>
      </div>

      {estado === "sin" && (
        <form className="cr-field" onSubmit={conectar} noValidate>
          <label className="cr-field__label" htmlFor="pg-dominio">
            Dominio propio <span className="cr-field__opt">(opcional)</span>
          </label>
          <div className="pg-input-fila">
            <Input
              id="pg-dominio"
              value={valor}
              placeholder="academia.tudominio.cl"
              autoComplete="off"
              spellCheck={false}
              invalido={!!error}
              conAyuda
              onChange={(e) => {
                setValor(limpiarDominio(e.target.value));
                setError(null);
              }}
            />
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Conectar"}
            </Button>
          </div>
          <span className="cr-field__hint" id="pg-dominio-ayuda">
            Usa un dominio que ya tengas. Te recomendamos un subdominio, como academia.tudominio.cl.
          </span>
          {error && (
            <span className="cr-field__error" id="pg-dominio-error" role="alert">
              {error}
            </span>
          )}
        </form>
      )}

      {estado === "pendiente" && solicitado && token && (
        <div className="pg-grid">
          <p>
            Para conectar <b className="pg-mono">{solicitado}</b>:
          </p>
          <ol className="pg-pasos">
            <li>Entra al panel donde administras tu dominio (por ejemplo, NIC Chile, Spaceship o GoDaddy).</li>
            <li>Agrega estos registros DNS:</li>
          </ol>
          <div className="pg-tabla">
            <table>
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {registrosDns(solicitado, token).map((r) => (
                  <tr key={r.tipo}>
                    <td>{r.tipo}</td>
                    <td className="pg-mono">{r.nombre}</td>
                    <td className="pg-mono">{r.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pg-ayuda">
            3. Nuestro equipo revisa los registros y conecta tu dominio con HTTPS, normalmente en un día hábil. Los
            cambios de DNS pueden tardar hasta 48 horas en propagarse.
          </p>
          {revisado && !pendiente && (
            <Callout tono="info" titulo="Aún no está conectado">
              Revisa que el nombre y el valor estén escritos igual. Te avisamos cuando quede listo.
            </Callout>
          )}
          {error && <Callout tono="danger">{error}</Callout>}
          <div className="pg-fila">
            <Button onClick={revisar}>Revisar estado</Button>
            <Button variante="ghost" onClick={cancelar} disabled={pendiente}>
              Cancelar solicitud
            </Button>
          </div>
        </div>
      )}

      {estado === "conectado" && dominioConectado && (
        <div className="pg-dir pg-dir--ok">
          <span className="pg-ayuda">Tu página se ve en</span>
          <b className="pg-mono">https://{dominioConectado}</b>
          <span className="pg-ayuda">HTTPS activo. Para cambiarlo, escríbenos a contacto@goavantia.com.</span>
        </div>
      )}
    </section>
  );
}