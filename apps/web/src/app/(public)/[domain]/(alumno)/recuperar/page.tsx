import type { Metadata } from "next";
import { FormRecuperar } from "../../../../../components/alumno/Formularios";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <div className="al-main--estrecho al-stack" style={{ width: "100%", margin: "0 auto" }}>
      <h1>Recupera tu contraseña</h1>
      <p className="al-muted">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.</p>
      <FormRecuperar />
    </div>
  );
}
