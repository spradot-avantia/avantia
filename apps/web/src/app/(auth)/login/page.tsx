import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormLogin } from "../../../components/creador/auth/FormulariosAuth";
import { getUsuarioActual } from "../../../lib/auth/usuario";
import { sanitizarNext } from "../../../lib/auth/validacion";

export const metadata: Metadata = { title: "Ingresar | Avantia" };

type Params = { searchParams: { next?: string; error?: string; aviso?: string } };

export default async function LoginPage({ searchParams }: Params) {
  const next = sanitizarNext(searchParams.next);
  if (await getUsuarioActual()) redirect(next);
  const aviso =
    searchParams.error === "enlace_invalido"
      ? { tono: "danger" as const, texto: "El enlace venció o ya se usó. Ingresa con tu contraseña o pide un enlace nuevo." }
      : null;
  return (
    <>
      <h1 className="au-title">Ingresa a tu academia</h1>
      <p className="au-lede">Usa el correo y la contraseña con que creaste tu cuenta.</p>
      <FormLogin next={next} aviso={aviso} />
      <p className="au-sep" aria-hidden="true">o</p>
      <button type="button" className="av-btn av-btn--secondary av-btn--lg" disabled aria-describedby="google-pronto" style={{ width: "100%" }}>
        Continuar con Google · Próximamente
      </button>
      <p id="google-pronto" className="av-legal">El acceso con Google estará disponible más adelante.</p>
    </>
  );
}
