import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotonGoogle, FormSignup } from "../../../components/creador/auth/FormulariosAuth";
import { getUsuarioActual } from "../../../lib/auth/usuario";

export const metadata: Metadata = { title: "Crear cuenta | Avantia" };

export default async function SignupPage() {
  if (await getUsuarioActual()) redirect("/inicio");
  return (
    <>
      <h1 className="au-title">Crea tu cuenta</h1>
      <p className="au-lede">Después te pediremos el nombre de tu academia.</p>
      <FormSignup />
      <p className="au-sep" aria-hidden="true">o</p>
      <BotonGoogle next="/inicio" />
      <p className="av-legal au-google-legal">
        Al continuar con Google aceptas los términos y la política de privacidad.
      </p>
      <p className="au-alt">
        ¿Ya tienes cuenta? <Link href="/login">Ingresar</Link>
      </p>
    </>
  );
}