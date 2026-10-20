import { redirect } from "next/navigation";
import { postularHref } from "@/components/marketing/Ctas";

// Ruta antigua de los CTA de la landing. Desde la V3 la entrada del creador es
// la postulación con Google (/postular en el panel, ADR 011).
export default function RegistroPage() {
  redirect(postularHref());
}
