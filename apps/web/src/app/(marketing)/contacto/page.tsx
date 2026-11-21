import type { Metadata } from "next";
import { TarjetaContacto } from "@/components/marketing/TarjetaContacto";
import { WHATSAPP } from "@/components/marketing/content";

// Tarjeta de la empresa. Las de los fundadores viven en /javiera y /samuel.

export const metadata: Metadata = {
  title: "Contacto | Avantia",
  description: "Tu academia online, con tu marca. Guarda nuestro contacto, escríbenos por WhatsApp o agenda 20 minutos con el equipo.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <TarjetaContacto
      whatsapp={WHATSAPP}
      agenda={process.env.NEXT_PUBLIC_AGENDA_URL?.trim() || null}
      vcfHref="/contacto/avantia.vcf"
    />
  );
}
