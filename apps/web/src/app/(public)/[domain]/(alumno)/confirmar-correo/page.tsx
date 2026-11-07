import type { Metadata } from "next";
import Link from "next/link";
import { FormConfirmarCorreo } from "../../../../../components/alumno/Formularios";

export const metadata: Metadata = { title: "Confirmar nuevo correo", robots: { index: false } };

export default function ConfirmarCorreoPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === "string" ? searchParams.token.slice(0, 200) : "";
  return (
    <div className="al-main--estrecho al-stack" style={{ width: "100%", margin: "0 auto" }}>
      <h1>Confirma tu nuevo correo</h1>
      {token ? (
        <>
          <p className="al-muted">Un último paso: toca el botón para usar este correo al ingresar.</p>
          <FormConfirmarCorreo token={token} />
        </>
      ) : (
        <p className="al-alert al-alert--error" role="alert">
          El enlace no es válido. <Link href="/perfil">Ve a tu perfil</Link> para pedir uno nuevo.
        </p>
      )}
    </div>
  );
}
