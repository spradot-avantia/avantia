import { PERSONAS } from "@/components/marketing/content";
import { respuestaVCard } from "@/components/marketing/vcard";

export function GET() {
  const p = PERSONAS.samuel;
  return respuestaVCard({ persona: p, whatsapp: p.whatsapp, archivo: "samuel-prado-avantia.vcf" });
}
