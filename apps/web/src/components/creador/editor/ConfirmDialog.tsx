"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "../Button";
import "./editor.css";

interface Props {
  abierto: boolean;
  titulo: string;
  children?: ReactNode;
  confirmar: string;
  cancelar?: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Dialogo modal nativo (<dialog>): foco atrapado, Esc cierra, foco vuelve al disparador. */
export function ConfirmDialog({ abierto, titulo, children, confirmar, cancelar = "Cancelar", peligro, onConfirmar, onCancelar }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="ed-dialog"
      aria-labelledby={tituloId}
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
    >
      <div className="ed-dialog__body">
        <h2 id={tituloId} className="ed-dialog__title">
          {titulo}
        </h2>
        {children && <div className="ed-dialog__text">{children}</div>}
        <div className="ed-dialog__actions">
          <Button variante="secondary" onClick={onCancelar} autoFocus>
            {cancelar}
          </Button>
          <Button variante={peligro ? "danger" : "primary"} onClick={onConfirmar}>
            {confirmar}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
