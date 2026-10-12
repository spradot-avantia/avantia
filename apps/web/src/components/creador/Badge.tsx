import type { ReactNode } from "react";
import "./creador.css";

type Tono = "ok" | "neutral" | "warning" | "info";

const CLASE: Record<Tono, string> = {
  ok: "av-badge--ok",
  neutral: "av-badge--neutral",
  warning: "cr-badge--warning",
  info: "cr-badge--info",
};

export function Badge({ tono = "neutral", children }: { tono?: Tono; children: ReactNode }) {
  return <span className={`av-badge ${CLASE[tono]}`}>{children}</span>;
}

/** Badge de estado de un curso. */
export function BadgeEstadoCurso({ estado }: { estado: "borrador" | "publicado" }) {
  return estado === "publicado" ? <Badge tono="ok">Publicado</Badge> : <Badge tono="warning">Borrador</Badge>;
}
