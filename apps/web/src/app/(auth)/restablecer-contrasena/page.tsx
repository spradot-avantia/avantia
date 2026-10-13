import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "../../../components/creador/Callout";
import { FormRestablecer } from "../../../components/creador/auth/FormulariosAuth";
import { getUsuarioActual } from "../../../lib/auth/usuario";

export const metadata: Metadata = { title: "Nueva contraseña | Avantia" };

// Se llega aquí desde /auth/confirm (type=recovery), que deja la sesión de recuperación.
export default async function RestablecerPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) {
    return (
      <>
        <h1 className="au-title">Enlace no válido</h1>
        <Callout tono="danger">
          El enlace venció o ya se usó. <Link className="au-inline-link" href="/olvide-contrasena">Pide uno nuevo</Link> con tu correo.
        </Callout>
      </>
    );
  }
  return (
    <>
      <h1 className="au-title">Elige una contraseña nueva</h1>
      <p className="au-lede">Para la cuenta {usuario.email}.</p>
      <FormRestablecer />
    </>
  );
}
