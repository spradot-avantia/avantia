"use client";

// Captura desde el navegador (ADR 040). Seguro de llamar siempre: si PostHog no está iniciado o la
// persona no aceptó «analítica», no hace nada.
import posthog from "posthog-js";
import type { EventosCliente, NombreEventoCliente } from "./eventos";

export function capturar<E extends NombreEventoCliente>(evento: E, props: EventosCliente[E]): void {
  try {
    if (!posthog.__loaded || posthog.has_opted_out_capturing()) return;
    posthog.capture(evento, props as Record<string, unknown>);
  } catch {
    /* la analítica nunca rompe la pantalla */
  }
}
