import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormSignup } from "../../../components/creador/auth/FormulariosAuth";
import { getUsuarioActual } from "../../../lib/auth/usuario";

export const metadata: Metadata = { title: "Crear cuenta | Avantia" };

export default async function SignupPage() {
  if (await getUsuarioActual()) redirect("/");
  return (
    <>
      <h1 className="au-title">Crea tu cuenta</h1>
      <p className="au-lede">Después te pediremos el nombre de tu academia.</p>
      <FormSignup />
      <p className="au-sep" aria-hidden="true">o</p>
      <button type="button" className="av-btn av-btn--secondary av-btn--lg" disabled aria-describedby="google-pronto" style={{ width: "100%" }}>
        Continuar con Google · Próximamente
      </button>
      <p id="google-pronto" className="av-legal">El acceso con Google estará disponible más adelante.</p>
    </>
  );
}
