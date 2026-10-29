import type { Metadata } from "next";
import { FormPostulacion } from "../../../components/creador/auth/FormPostulacion";

export const metadata: Metadata = { title: "Postula al programa fundador | Avantia" };

// Postulación pública, sin iniciar sesión (ADR 014): nombre, correo y a qué te
// dedicas hoy. Al enviar se muestra el botón para agendar los 20 minutos.
export default function PostularPage() {
  return <FormPostulacion />;
}
