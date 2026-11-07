import type { ReactNode } from "react";
import { IconoCheck, IconoReloj, IconoEquis } from "../ui/Iconos";
import "./alumno.css";

export function Barra({ etiqueta, pct, detalle }: { etiqueta: string; pct: number; detalle?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div>
      <div className="al-bar__row">
        <span>{etiqueta}</span>
        <span>{detalle ?? `${v} %`}</span>
      </div>
      <div className="al-bar" role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
        <span style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  activa: { texto: "Inscripción activa", clase: "al-badge--ok" },
  pendiente: { texto: "Pendiente de activación", clase: "al-badge--wait" },
  rechazada: { texto: "No aprobada", clase: "al-badge--no" },
  vencida: { texto: "Vencida", clase: "al-badge--no" },
  cancelada: { texto: "Cancelada", clase: "al-badge--no" },
};

/** Sello de curso completado (SVG propio, hereda el color de la academia). */
export function Sello({ tam = 28 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="al-sello">
      <path
        d="M12 2.5l2.4 1.7 2.9-.2 1.1 2.7 2.5 1.5-.6 2.8 1.2 2.6-2 2.1-.4 2.9-2.9.7-1.9 2.2L12 20.5 9.7 21.5l-1.9-2.2-2.9-.7-.4-2.9-2-2.1 1.2-2.6-.6-2.8 2.5-1.5 1.1-2.7 2.9.2L12 2.5z"
        fill="currentColor"
      />
      <path d="M8.2 12.2l2.6 2.6 5-5.2" stroke="var(--al-on-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const e = ESTADOS[estado] ?? ESTADOS.pendiente;
  const ico = estado === "activa" ? <IconoCheck tam={12} /> : estado === "pendiente" ? <IconoReloj tam={12} /> : <IconoEquis tam={12} />;
  return (
    <span className={`al-badge ${e.clase}`}>
      {ico} {e.texto}
    </span>
  );
}

export function Insignia({ activa, icono, titulo, ganada = "Ganada", children }: { activa: boolean; icono: ReactNode; titulo: string; ganada?: string; children: ReactNode }) {
  return (
    <li className={`al-insignia${activa ? " al-insignia--on" : ""}`}>
      <span className="al-insignia__ico" aria-hidden="true">
        {icono}
      </span>
      <span>
        <strong>{titulo}</strong>
        <br />
        <span className="al-muted">{activa ? ganada : children}</span>
      </span>
    </li>
  );
}
