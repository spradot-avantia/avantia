import { PERSONAS } from "@/components/marketing/content";
import { respuestaVCard } from "@/components/marketing/vcard";

export function GET() {
  const p = PERSONAS.javiera;
  return respuestaVCard({ persona: p, whatsapp: p.whatsapp, archivo: "javiera-mena-avantia.vcf" });
}
