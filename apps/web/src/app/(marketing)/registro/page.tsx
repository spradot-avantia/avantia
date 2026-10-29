import { redirect } from "next/navigation";
import { postularHref } from "@/components/marketing/Ctas";

// Ruta antigua de los CTA de la landing. Desde la V3 la entrada del creador es
// la postulación (/postular: cuenta con correo o Google, ADR 011 y 013).
export default function RegistroPage() {
  redirect(postularHref());
}
