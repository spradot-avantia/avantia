// Tarjeta de contacto que abre el QR de eventos: /contacto (empresa) y
// /javiera, /samuel (fundadores). Se lee de pie, en el teléfono, en segundos.
// Acción principal: guardar el contacto; WhatsApp, secundaria; agenda, enlace.
// Crítica de diseño 2026-11-21 (.impeccable/critique/).

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CONTACTO, LINKEDIN_URL, THEMES, type PersonaContacto } from "./content";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./landing.css";
import "./tarjeta-contacto.css";

// Academia de ejemplo de la mini vista (mismo set que la landing): su color
// muestra que cada academia lleva su propia marca.
const EJEMPLO = THEMES[2];

function Ico({ d, size = 20 }: { d: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {d}
    </svg>
  );
}

const ICONOS = {
  whatsapp: <><path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 18.7z" /><path d="M9 9.5c.3 2.2 2.3 4.2 5.5 5.5l1.3-1.3-2-1-1 .7c-.8-.4-1.5-1.1-1.9-1.9l.7-1-1-2z" /></>,
  guardar: <><circle cx="10" cy="8" r="4" /><path d="M3 20c0-3.6 3.1-6 7-6M18 9v6M15 12h6" /></>,
  candado: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></>,
};

const EXTERNO = { target: "_blank", rel: "noopener noreferrer" } as const;

export function TarjetaContacto({
  persona,
  whatsapp,
  agenda,
  vcfHref,
}: {
  persona?: PersonaContacto;
  whatsapp: string | null;
  agenda: string | null;
  vcfHref: string;
}) {
  const ruta = persona ? `/${persona.slug}` : "/contacto";
  const org = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACTO,
    ...(LINKEDIN_URL ? { sameAs: [LINKEDIN_URL] } : {}),
  };
  const jsonLd = persona
    ? {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: `${SITE_URL}${ruta}`,
        mainEntity: {
          "@type": "Person",
          name: `${persona.nombre} ${persona.apellido}`,
          jobTitle: persona.cargo,
          ...(persona.foto ? { image: `${SITE_URL}${persona.foto}` } : {}),
          worksFor: org,
          ...(whatsapp ? { telephone: `+${whatsapp}` } : {}),
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        url: `${SITE_URL}${ruta}`,
        name: `Contacto | ${SITE_NAME}`,
        about: { ...org, ...(whatsapp ? { telephone: `+${whatsapp}` } : {}) },
      };

  const enlaces = [
    ...(LINKEDIN_URL ? [{ href: LINKEDIN_URL, texto: "LinkedIn", externo: true }] : []),
    { href: "/", texto: "goavantia.com", externo: false },
    { href: `mailto:${CONTACTO}`, texto: "Correo", externo: false },
  ];

  return (
    <div className="av-scope lp ct" style={{ "--ct-academia": EJEMPLO.c } as CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="ct-card">
        <div className="lp-logo ct-logo">
          <Image src="/brand/avantia-mark.png" alt="" width={581} height={364} style={{ height: 32, width: "auto" }} priority />
          <Image src="/brand/avantia-wordmark.png" alt="avantia" width={739} height={159} style={{ height: 16, width: "auto" }} priority />
        </div>

        {persona && (
          <div className="ct-persona">
            {persona.foto ? (
              <Image className="ct-persona__foto" src={persona.foto} alt={`Foto de ${persona.nombre} ${persona.apellido}`} width={64} height={64} priority />
            ) : (
              <span className="ct-persona__ini" aria-hidden="true">{persona.nombre[0]}{persona.apellido[0]}</span>
            )}
            <span className="ct-persona__txt">
              <h1>{persona.nombre} {persona.apellido}</h1>
              <span>{persona.cargo} de Avantia</span>
            </span>
          </div>
        )}

        <div className="ct-intro">
          <span className="av-overline">Para expertos que ya enseñan online</span>
          {persona ? (
            <p className="ct-title"><span>Tu academia online,</span> <span className="lp-hero__marca">con tu marca</span></p>
          ) : (
            <h1 className="ct-title"><span>Tu academia online,</span> <span className="lp-hero__marca">con tu marca</span></h1>
          )}
          <p className="ct-lede">
            Repasos y recordatorios para que tus alumnos terminen el curso. Con tu dominio, tu marca y tus precios.
          </p>
        </div>

        {/* Mini vista del producto, marcada como ejemplo (borde punteado + etiqueta). */}
        <figure className="ct-demo" aria-label={`Ejemplo de academia: un alumno en ${EJEMPLO.course}, lección 4 de 12, con el repaso del día listo`}>
          <span className="av-overline ct-demo__tag" aria-hidden="true">Ejemplo de academia</span>
          <span className="ct-demo__dom" aria-hidden="true"><Ico d={ICONOS.candado} size={12} />academia.tumarca.com</span>
          <div className="ct-demo__curso" aria-hidden="true">
            <span className="ct-demo__play">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="ct-demo__info">
              <b>{EJEMPLO.course}</b>
              <span className="ct-demo__bar"><span style={{ width: "33%" }} /></span>
              <span className="ct-demo__meta">Lección 4 de 12</span>
            </span>
          </div>
          <span className="ct-demo__ok" aria-hidden="true"><Ico d={ICONOS.check} size={16} />Repaso de hoy listo</span>
        </figure>

        <div className="ct-acciones">
          <a className="av-btn av-btn--primary av-btn--lg ct-btn" href={vcfHref} download>
            <Ico d={ICONOS.guardar} /> Guardar contacto
          </a>
          <p className="ct-nota">Se descarga una tarjeta para tu agenda.</p>
          {whatsapp && (
            <a className="av-btn av-btn--secondary av-btn--lg ct-btn" href={`https://wa.me/${whatsapp}`} {...EXTERNO}>
              <Ico d={ICONOS.whatsapp} /> {persona ? "Escríbeme por WhatsApp" : "Escríbenos por WhatsApp"}
            </a>
          )}
          {agenda && (
            <p className="ct-agenda">
              ¿Prefieres verlo funcionar? <a href={agenda} {...EXTERNO}>{persona ? "Agenda 20 minutos conmigo" : "Agenda 20 minutos"}</a>
            </p>
          )}
        </div>

        <nav className="ct-enlaces" aria-label="Más formas de contacto">
          {enlaces.map((e) => (
            <a key={e.texto} href={e.href} {...(e.externo ? EXTERNO : {})}>{e.texto}</a>
          ))}
        </nav>

        <p className="ct-foot">
          <Link href="/privacidad">Privacidad</Link> · Avantia Tecnología SpA
        </p>
      </main>
    </div>
  );
}
