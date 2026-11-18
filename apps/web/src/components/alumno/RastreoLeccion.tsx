"use client";

// Mide la visita a una lección (ADR 040): tiempo ACTIVO (pestaña visible y con actividad reciente),
// profundidad de lectura y clic en el video. El tiempo se envía al servidor propio (panel del
// creador) y a PostHog solo si hay consentimiento. Sin contenido ni datos personales.
import { useEffect } from "react";
import { capturar } from "../../lib/analitica/cliente";

interface Props {
  cursoId: string;
  moduloId: string;
  leccionId: string;
  tipo: string;
}

const INACTIVO_MS = 60_000; // sin movimiento por 1 min, el reloj se detiene

export function RastreoLeccion({ cursoId, moduloId, leccionId, tipo }: Props) {
  useEffect(() => {
    const base = { curso_id: cursoId, modulo_id: moduloId, leccion_id: leccionId };
    const visitaId = crypto.randomUUID();
    capturar("leccion_vista", { ...base, tipo_leccion: tipo });

    let activoMs = 0;
    let ultimoTick = Date.now();
    let ultimaActividad = Date.now();
    let enviado = 0;
    const tick = () => {
      const t = Date.now();
      if (document.visibilityState === "visible" && t - ultimaActividad < INACTIVO_MS) activoMs += Math.min(t - ultimoTick, 5000);
      ultimoTick = t;
    };
    const reloj = window.setInterval(tick, 1000);
    const actividad = () => {
      ultimaActividad = Date.now();
    };
    const eventosAct = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventosAct.forEach((e) => window.addEventListener(e, actividad, { passive: true }));

    function enviar() {
      tick();
      const seg = Math.round(activoMs / 1000);
      if (seg < 1 || seg === enviado) return;
      enviado = seg;
      try {
        navigator.sendBeacon("/api/alumno/tiempo-leccion", new Blob([JSON.stringify({ cursoId, leccionId, visitaId, activoSeg: seg })], { type: "application/json" }));
      } catch {
        /* sin beacon: no se registra el tiempo de esta visita */
      }
      capturar("leccion_tiempo_activo", { ...base, activo_seg: seg }, { alSalir: true });
    }
    const alOcultar = () => {
      if (document.visibilityState === "hidden") enviar();
    };
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", enviar);

    // Profundidad de lectura (25/50/75/100 %) en lecciones de texto.
    const marcadas = new Set<number>();
    const alScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = (window.scrollY / max) * 100;
      for (const hito of [25, 50, 75, 100]) {
        if (pct >= hito - 2 && !marcadas.has(hito)) {
          marcadas.add(hito);
          capturar("leccion_scroll", { ...base, profundidad: hito });
        }
      }
    };
    if (tipo === "texto") window.addEventListener("scroll", alScroll, { passive: true });

    // Clic en el reproductor (iframe): el clic no sube al documento; se detecta por el foco.
    let videoClic = false;
    const alBlur = () => {
      window.setTimeout(() => {
        if (!videoClic && document.activeElement instanceof HTMLIFrameElement) {
          videoClic = true;
          capturar("video_click", base);
        }
      }, 0);
    };
    if (tipo === "video") window.addEventListener("blur", alBlur);

    return () => {
      enviar(); // navegación interna (sin recarga): cuenta como salida de la lección
      window.clearInterval(reloj);
      eventosAct.forEach((e) => window.removeEventListener(e, actividad));
      document.removeEventListener("visibilitychange", alOcultar);
      window.removeEventListener("pagehide", enviar);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("blur", alBlur);
    };
  }, [cursoId, moduloId, leccionId, tipo]);

  return null;
}
