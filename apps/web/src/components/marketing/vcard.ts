import { CONTACTO, LINKEDIN_URL, type PersonaContacto } from "./content";
import { SITE_URL } from "@/lib/seo";

/**
 * vCard 3.0 para «Guardar contacto». Sin persona, la tarjeta es de la empresa;
 * con persona, queda a su nombre y Avantia como organización.
 */
export function respuestaVCard(opts: { persona?: PersonaContacto; whatsapp: string | null; archivo: string }): Response {
  const { persona, whatsapp, archivo } = opts;
  const lineas = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    persona ? `N:${persona.apellido};${persona.nombre};;;` : null,
    `FN:${persona ? `${persona.nombre} ${persona.apellido}` : "Avantia"}`,
    "ORG:Avantia Tecnología SpA",
    persona ? `TITLE:${persona.cargo}` : null,
    `EMAIL;TYPE=WORK:${CONTACTO}`,
    whatsapp ? `TEL;TYPE=CELL:+${whatsapp}` : null,
    `URL:${SITE_URL}${persona ? `/${persona.slug}` : ""}`,
    LINKEDIN_URL ? `X-SOCIALPROFILE;TYPE=linkedin:${LINKEDIN_URL}` : null,
    "END:VCARD",
  ].filter(Boolean);

  return new Response(lineas.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${archivo}"`,
    },
  });
}
