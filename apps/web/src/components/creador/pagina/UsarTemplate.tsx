"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { elegirTemplateAction } from "../../../lib/creador/actions";
import { infoTemplate, type ClaveTemplate } from "../../../lib/creador/paginaReglas";
import { Button } from "../Button";

/** "Usar este template": lo guarda y abre el editor de la página. */
export function UsarTemplate({ clave, actual }: { clave: ClaveTemplate; actual: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (actual) {
    return (
      <Button onClick={() => router.push("/mi-academia/pagina")}>Editar mi página</Button>
    );
  }
  return (
    <>
      <Button
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await elegirTemplateAction(clave);
            if (r.ok) router.push("/mi-academia/pagina");
            else setError(r.error);
          })
        }
      >
        {pendiente ? "Guardando…" : `Usar ${infoTemplate(clave).nombre}`}
      </Button>
      {error && (
        <span className="cr-field__error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}