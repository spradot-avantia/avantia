import type { Metadata } from "next";
import Link from "next/link";
import { FormRestablecer } from "../../../../../components/alumno/Formularios";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default function RestablecerPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === "string" ? searchParams.token.slice(0, 200) : "";
  return (
    <div className="al-main--estrecho al-stack" style={{ width: "100%", margin: "0 auto" }}>
      <h1>Crea una contraseña nueva</h1>
      {token ? (
        <FormRestablecer token={token} />
      ) : (
        <p className="al-alert al-alert--error" role="alert">
          El enlace no es válido. <Link href="/recuperar">Pide uno nuevo</Link>.
        </p>
      )}
    </div>
  );
}
