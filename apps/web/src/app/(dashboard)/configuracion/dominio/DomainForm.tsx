"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/Button";
import styles from "../../dashboard.module.css";

type Estado = { domain: string; status: "verificado" | "pendiente_verificacion" };

export function DomainForm({
  tenantId,
  initialDomain,
}: {
  tenantId: string;
  initialDomain: string | null;
}) {
  const [input, setInput] = useState("");
  const [estado, setEstado] = useState<Estado | null>(
    initialDomain ? { domain: initialDomain, status: "pendiente_verificacion" } : null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setCargando(true);

    try {
      const res = await fetch("/api/tenants/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, domain: input }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "No se pudo guardar el dominio");
        return;
      }

      setEstado({ domain: data.domain, status: data.status });
      setInput("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className={styles.card} style={{ maxWidth: 480 }}>
      {estado && (
        <p>
          Dominio actual: <strong>{estado.domain}</strong> —{" "}
          {estado.status === "verificado" ? "Verificado" : "Pendiente de verificación DNS"}
          {" "}
          <em>(demo — todavía no valida DNS real)</em>
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="micursos.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />
        <Button type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Conectar dominio"}
        </Button>
      </form>

      {errorMsg && (
        <p role="alert" style={{ color: "#dc2626", marginBottom: 0 }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
