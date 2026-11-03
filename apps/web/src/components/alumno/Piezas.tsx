import type { ReactNode } from "react";
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

export function EstadoBadge({ estado }: { estado: string }) {
  const e = ESTADOS[estado] ?? ESTADOS.pendiente;
  return <span className={`al-badge ${e.clase}`}>{e.texto}</span>;
}

export function Insignia({ activa, icono, titulo, children }: { activa: boolean; icono: string; titulo: string; children: ReactNode }) {
  return (
    <li className={`al-insignia${activa ? " al-insignia--on" : ""}`}>
      <span className="al-insignia__ico" aria-hidden="true">
        {icono}
      </span>
      <span>
        <strong>{titulo}</strong>
        <br />
        <span className="al-muted">{activa ? "Ganada" : children}</span>
      </span>
    </li>
  );
}
