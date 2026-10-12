"use client";

import { useRef, useState } from "react";
import { Button } from "../Button";
import "./inicio.css";

/** Copia un enlace al portapapeles y avisa (aria-live). */
export function CopiarEnlace({
  url,
  etiqueta = "Copiar enlace del curso",
  variante = "secondary",
}: {
  url: string;
  etiqueta?: string;
  variante?: "primary" | "secondary" | "ghost";
}) {
  const [estado, setEstado] = useState<"idle" | "ok" | "error">("idle");
  const t = useRef<ReturnType<typeof setTimeout>>();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
    clearTimeout(t.current);
    t.current = setTimeout(() => setEstado("idle"), 3500);
  }

  return (
    <>
      <Button variante={variante} onClick={copiar}>
        {estado === "ok" ? "Enlace copiado" : etiqueta}
      </Button>
      <span className={estado === "error" ? "ci-muted" : "ci-sr"} role="status" aria-live="polite">
        {estado === "ok" && "Enlace copiado al portapapeles."}
        {estado === "error" && `No pudimos copiar. Cópialo a mano: ${url}`}
      </span>
    </>
  );
}
