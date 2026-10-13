import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoogleG } from "@/components/marketing/icons";
import "@/components/marketing/landing.css";

export const metadata: Metadata = {
  title: "Crear cuenta o ingresar | Avantia",
  description: "Crea tu cuenta de creador en Avantia o ingresa a tu academia con correo y contraseña.",
};

// Destino de los CTA "Continuar con Google" / "Ingresar" de la landing.
// El acceso del creador vive en el host del panel (ADR 003): aquí solo se
// deriva hacia /signup y /login de NEXT_PUBLIC_PANEL_URL. Google queda como
// "Próximamente" (RQ-01 original; se retoma después).
export default function RegistroPage() {
  const panel = (process.env.NEXT_PUBLIC_PANEL_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return (
    <main className="av-scope lp-auth">
      <Link href="/landing" aria-label="avantia, inicio">
        <Image src="/brand/avantia-mark.png" alt="" width={581} height={364} style={{ height: 36, width: "auto" }} priority />
      </Link>
      <div className="av-card lp-auth__card">
        <h1 className="av-h2" style={{ fontSize: 28 }}>Crea tu cuenta o ingresa</h1>
        <p className="av-lede" style={{ fontSize: 16 }}>
          Entra con tu correo y una contraseña. Te toma un minuto y después nombras tu academia.
        </p>
        <a className="av-btn av-btn--primary av-btn--lg" href={`${panel}/signup`} style={{ width: "100%" }}>
          Crear mi cuenta
        </a>
        <a className="av-btn av-btn--secondary av-btn--lg" href={`${panel}/login`} style={{ width: "100%" }}>
          Ya tengo cuenta: ingresar
        </a>
        <button type="button" className="av-btn av-btn--secondary av-btn--lg" disabled aria-describedby="google-nota" style={{ width: "100%" }}>
          <GoogleG /> Continuar con Google · Próximamente
        </button>
        <p id="google-nota" className="av-legal" role="note">
          El acceso con Google estará disponible más adelante.
        </p>
        <span id="ingresar" />
      </div>
    </main>
  );
}
