import { WHATSAPP } from "@/components/marketing/content";
import { respuestaVCard } from "@/components/marketing/vcard";

export function GET() {
  return respuestaVCard({ whatsapp: WHATSAPP, archivo: "avantia.vcf" });
}
