import type { ReactNode } from "react";
import "./creador.css";

type Tono = "neutral" | "info" | "success" | "warning" | "danger";

export function Callout({ tono = "neutral", titulo, children }: { tono?: Tono; titulo?: string; children?: ReactNode }) {
  return (
    <div className={`cr-callout cr-callout--${tono}`} role={tono === "danger" ? "alert" : "note"}>
      {titulo && <strong className="cr-callout__title">{titulo}</strong>}
      {children && <div>{children}</div>}
    </div>
  );
}
