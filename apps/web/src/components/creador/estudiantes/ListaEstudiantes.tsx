"use client";

import { useState, useTransition } from "react";
import { quitarEstudianteAction } from "../../../lib/creador/actions";
import type { EstadoInvitacion } from "../../../lib/creador/types";
import { Badge } from "../Badge";
import { Button } from "../Button";
import "../inicio/inicio.css";

export interface FilaEstudiante {
  id: string;
  email: string;
  cursoTitulo: string;
  estado: EstadoInvitacion;
}

const ESTADO: Record<EstadoInvitacion, { texto: string; tono: "ok" | "neutral" | "warning" }> = {
  pendiente: { texto: "Registrado, aún sin entrar", tono: "neutral" },
  aceptada: { texto: "Ya entró", tono: "ok" },
  revocada: { texto: "Acceso revocado", tono: "warning" },
};

export function ListaEstudiantes({ filas }: { filas: FilaEstudiante[] }) {
  const [pendiente, start] = useTransition();
  const [quitando, setQuitando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function quitar(f: FilaEstudiante) {
    if (!window.confirm(`¿Quitar a ${f.email} de «${f.cursoTitulo}»?`)) return;
    setQuitando(f.id);
    setError(null);
    start(async () => {
      const r = await quitarEstudianteAction(f.id);
      if (!r.ok) setError(r.error);
      setQuitando(null);
    });
  }

  return (
    <div className="ci-stack" style={{ gap: "var(--av-space-3)" }}>
      {error && (
        <p role="alert" className="cr-field__error">
          {error}
        </p>
      )}
      <ul className="ci-list">
        {filas.map((f) => (
          <li key={f.id} className="ci-row ci-row--compact">
            <div className="ci-row__main">
              <span className="ci-row__title">{f.email}</span>
              <div className="ci-row__meta">
                <span>{f.cursoTitulo}</span>
                <Badge tono={ESTADO[f.estado].tono}>{ESTADO[f.estado].texto}</Badge>
              </div>
            </div>
            <div className="ci-actions">
              <Button variante="ghost" onClick={() => quitar(f)} disabled={pendiente} aria-label={`Quitar a ${f.email}`}>
                {quitando === f.id ? "Quitando…" : "Quitar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
