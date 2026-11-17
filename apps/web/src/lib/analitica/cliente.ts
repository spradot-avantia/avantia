"use client";

// Captura desde el navegador (ADR 040). Seguro de llamar siempre: si PostHog no está iniciado o la
// persona no aceptó «analítica», no hace nada.
import posthog from "posthog-js";
import type { EventosCliente, NombreEventoCliente } from "./eventos";

/**
 * `alSalir`: para eventos que se emiten al cerrar o salir de la página. PostHog vacía su cola en
 * `pagehide` ANTES de que corra nuestro listener, así que el evento se envía al instante con
 * sendBeacon en vez de quedar en cola (y perderse).
 */
export function capturar<E extends NombreEventoCliente>(evento: E, props: EventosCliente[E], opciones: { alSalir?: boolean } = {}): void {
  try {
    if (!posthog.__loaded || posthog.has_opted_out_capturing()) return;
    posthog.capture(evento, props as Record<string, unknown>, opciones.alSalir ? { send_instantly: true, transport: "sendBeacon" } : undefined);
  } catch {
    /* la analítica nunca rompe la pantalla */
  }
}
