import type { Metadata } from "next";
import { FormOlvide } from "../../../components/creador/auth/FormulariosAuth";

export const metadata: Metadata = { title: "Recuperar contraseña | Avantia" };

export default function OlvidePage({ searchParams }: { searchParams: { error?: string } }) {
  const aviso =
    searchParams.error === "enlace_invalido" ? "El enlace venció o ya se usó. Pide uno nuevo con tu correo." : null;
  return (
    <>
      <h1 className="au-title">Recupera tu contraseña</h1>
      <p className="au-lede">Escribe tu correo y te enviaremos un enlace para elegir una contraseña nueva.</p>
      <FormOlvide aviso={aviso} />
    </>
  );
}
