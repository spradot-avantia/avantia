import type { Metadata } from "next";
import { TarjetaContacto } from "@/components/marketing/TarjetaContacto";
import { PERSONAS } from "@/components/marketing/content";

const p = PERSONAS.samuel;

export const metadata: Metadata = {
  title: `${p.nombre} ${p.apellido}, ${p.cargo} | Avantia`,
  description: `${p.nombre} ${p.apellido}, ${p.cargo} de Avantia. Guarda su contacto, escríbele por WhatsApp o agenda 20 minutos.`,
  alternates: { canonical: `/${p.slug}` },
};

export default function SamuelPage() {
  return <TarjetaContacto persona={p} whatsapp={p.whatsapp} agenda={p.agenda} vcfHref={`/${p.slug}/contacto.vcf`} />;
}
