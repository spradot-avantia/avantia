import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BotonGoogle, FormLogin } from "../../../components/creador/auth/FormulariosAuth";
import { getUsuarioActual } from "../../../lib/auth/usuario";
import { sanitizarNext } from "../../../lib/auth/validacion";

export const metadata: Metadata = { title: "Ingresar | Avantia" };

type Params = { searchParams: { next?: string; error?: string; aviso?: string } };

const AVISOS: Record<string, string> = {
  enlace_invalido: "El enlace venció o ya se usó. Ingresa con tu contraseña o pide un enlace nuevo.",
  google: "No pudimos ingresar con Google. Inténtalo de nuevo o usa tu correo y contraseña.",
};

export default async function LoginPage({ searchParams }: Params) {
  const next = sanitizarNext(searchParams.next);
  if (await getUsuarioActual()) redirect(next);

  const textoAviso = searchParams.error ? AVISOS[searchParams.error] : undefined;
  const aviso = textoAviso ? { tono: "danger" as const, texto: textoAviso } : null;

  return (
    <>
      <h1 className="au-title">Ingresa a tu academia</h1>
      <p className="au-lede">Ingresa con tu correo o con tu cuenta de Google.</p>
      <FormLogin next={next} aviso={aviso} />
      <p className="au-sep" aria-hidden="true">o</p>
      <BotonGoogle next={next} />
      <p className="au-alt">
        ¿No tienes cuenta? <Link href="/signup">Crear una cuenta</Link>
      </p>
    </>
  );
}