import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoogleG } from "@/components/marketing/icons";
import "@/components/marketing/landing.css";

export const metadata: Metadata = {
  title: "Crear cuenta o ingresar | Avantia",
  description: "Los creadores de Avantia crean su cuenta e ingresan solo con Google.",
};

// Destino de los CTA "Continuar con Google" / "Ingresar" de la landing.
// Decisión (Revision_Flujos 2026-10-12, CR-01): registro e ingreso de creadores
// solo con Google. Pendiente: conectar Supabase Auth (provider Google) y apuntar
// el botón a la ruta de inicio de OAuth; hasta entonces queda deshabilitado.
export default function RegistroPage() {
  return (
    <main className="av-scope lp-auth">
      <Link href="/landing" aria-label="avantia, inicio">
        <Image src="/brand/avantia-mark.png" alt="" width={581} height={364} style={{ height: 36, width: "auto" }} priority />
      </Link>
      <div className="av-card lp-auth__card">
        <h1 className="av-h2" style={{ fontSize: 28 }}>Crea tu cuenta o ingresa</h1>
        <p className="av-lede" style={{ fontSize: 16 }}>
          Los creadores usan su cuenta de Google: un solo paso, sin contraseña que recordar.
        </p>
        <button type="button" className="av-btn av-btn--secondary av-btn--lg" disabled aria-describedby="google-nota" style={{ width: "100%" }}>
          <GoogleG /> Continuar con Google
        </button>
        <p id="google-nota" className="av-legal" role="note">
          <span className="av-todo">[Pendiente]</span> La conexión con Google todavía no está activa. Mientras tanto, postula al programa fundador desde la{" "}
          <Link href="/landing#fundador">página principal</Link>.
        </p>
        <span id="ingresar" />
      </div>
    </main>
  );
}
