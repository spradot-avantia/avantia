// Envío de eventos de negocio a PostHog desde el servidor (ADR 040). Best effort: un fallo o la
// falta de configuración nunca rompen la acción del alumno. Solo servidor.
import { PostHog } from "posthog-node";
import { POSTHOG_HOST, POSTHOG_KEY, analiticaActiva } from "./config";
import type { EventosServidor, NombreEventoServidor } from "./eventos";
import { idSeudonimo } from "./identidad";

let cliente: PostHog | null = null;

function obtener(): PostHog | null {
  if (!analiticaActiva()) return null;
  // flushAt 1 y sin intervalo: en serverless el proceso puede congelarse tras responder.
  cliente ??= new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, flushAt: 1, flushInterval: 0 });
  return cliente;
}

export async function capturarServidor<E extends NombreEventoServidor>(
  tenantId: string,
  alumnoId: string,
  evento: E,
  props: EventosServidor[E],
): Promise<void> {
  try {
    const ph = obtener();
    const distinctId = idSeudonimo(tenantId, alumnoId);
    if (!ph || !distinctId) return;
    await ph.captureImmediate({
      distinctId,
      event: evento,
      properties: { ...props, tenant_id: tenantId, origen: "servidor", $process_person_profile: false },
      groups: { tenant: tenantId },
    });
  } catch (err) {
    console.error("[analitica] no se pudo enviar", evento, err instanceof Error ? err.message : err);
  }
}
