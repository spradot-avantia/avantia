"use client";

// Inicia PostHog en el sitio de la academia (ADR 040). Todo apagado por defecto: sin clave no hace
// nada; sin id seudónimo (alumno sin sesión) no mide; y sin consentimiento de «analítica» no
// captura. Sin cookies: la identidad vive en memoria y se re-entrega desde el servidor en cada carga.
import { useEffect } from "react";
import posthog from "posthog-js";
import { POSTHOG_HOST, POSTHOG_KEY } from "../../lib/analitica/config";
import { capturar } from "../../lib/analitica/cliente";
import { leerConsentimiento } from "../marketing/AvisoCookies";

interface Props {
  tenantId: string;
  /** HMAC del alumno (lib/analitica/identidad.ts), o null si no hay sesión o no hay secreto. */
  distinctId: string | null;
}

function descripcion(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id.slice(0, 30)}` : "";
  const cls = typeof el.className === "string" && el.className ? `.${el.className.split(/\s+/)[0].slice(0, 30)}` : "";
  return `${tag}${id}${cls}`;
}

export function AnaliticaProvider({ tenantId, distinctId }: Props) {
  useEffect(() => {
    if (!POSTHOG_KEY || !distinctId) return;
    if (!posthog.__loaded) {
      posthog.init(POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: POSTHOG_HOST.replace(".i.posthog.com", ".posthog.com"),
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        // Solo eventos propios: sin flags (enviaría el id antes del consentimiento), encuestas, mapas
        // de calor, clics muertos, rendimiento ni scripts externos (ADR 040).
        advanced_disable_flags: true,
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        disable_web_experiments: true,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_performance: false,
        rageclick: false,
        disable_external_dependency_loading: true,
        persistence: "memory",
        opt_out_capturing_by_default: true,
        person_profiles: "identified_only",
        bootstrap: { distinctID: distinctId },
      });
    }
    posthog.group("tenant", tenantId);
    posthog.register({ tenant_id: tenantId });

    const aplicar = () => {
      if (leerConsentimiento()?.analitica) posthog.opt_in_capturing({ captureEventName: false });
      else posthog.opt_out_capturing();
    };
    aplicar();
    window.addEventListener("avantia:cookies", aplicar);

    // Señales de fricción: 3 clics rápidos en el mismo elemento y errores de la interfaz.
    let clics: { el: Element; t: number }[] = [];
    const alClic = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      const t = Date.now();
      clics = [...clics.filter((c) => t - c.t < 1000 && c.el === el), { el, t }];
      if (clics.length >= 3) {
        clics = [];
        capturar("clic_rabioso", { ruta: window.location.pathname, elemento: descripcion(el) });
      }
    };
    let errores = 0;
    const alError = (msg: string) => {
      if (errores++ >= 3) return;
      capturar("error_ui", { ruta: window.location.pathname, mensaje: msg.slice(0, 120) });
    };
    const onError = (e: ErrorEvent) => alError(e.message || "error");
    const onRechazo = (e: PromiseRejectionEvent) => alError(e.reason instanceof Error ? e.reason.message : "promesa rechazada");
    document.addEventListener("click", alClic, true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRechazo);
    return () => {
      window.removeEventListener("avantia:cookies", aplicar);
      document.removeEventListener("click", alClic, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRechazo);
    };
  }, [tenantId, distinctId]);

  return null;
}
