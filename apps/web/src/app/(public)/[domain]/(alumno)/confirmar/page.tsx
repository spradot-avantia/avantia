import type { Metadata } from "next";
import Link from "next/link";
import { FormConfirmar } from "../../../../../components/alumno/Formularios";

export const metadata: Metadata = { title: "Confirmar correo", robots: { index: false } };

export default function ConfirmarPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === "string" ? searchParams.token.slice(0, 200) : "";
  return (
    <div className="al-main--estrecho al-stack" style={{ width: "100%", margin: "0 auto" }}>
      <h1>Confirma tu correo</h1>
      {token ? (
        <>
          <p className="al-muted">Un último paso: toca el botón para activar tu cuenta.</p>
          <FormConfirmar token={token} />
        </>
      ) : (
        <p className="al-alert al-alert--error" role="alert">
          El enlace no es válido. <Link href="/ingresar">Ingresa</Link> para pedir uno nuevo.
        </p>
      )}
    </div>
  );
}
