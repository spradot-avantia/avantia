"use client";

// Video demo de la plataforma (YouTube) en "Míralo funcionar". Primero muestra
// solo la miniatura con un botón de reproducir; el reproductor se carga recién al
// hacer clic, desde youtube-nocookie.com (sin cookies de YouTube antes de reproducir
// y sin hacer más lenta la landing).
import { useState } from "react";
import { VIDEO_DEMO } from "./content";

export function VideoDemo() {
  const [reproduciendo, setReproduciendo] = useState(false);
  const { id, titulo } = VIDEO_DEMO;

  return (
    <div className="lp-video">
      {reproduciendo ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" className="lp-video__portada" onClick={() => setReproduciendo(true)} aria-label={`Reproducir el video: ${titulo}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube, dominio externo */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.hidden = true; }} />
          <span className="lp-video__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}