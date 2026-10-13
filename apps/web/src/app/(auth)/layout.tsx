import type { ReactNode } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { hostActual, hostEsPanel, urlPanel } from "../../lib/auth/panel";
import "../../components/creador/creador.css";
import "../../components/creador/auth/auth.css";

export const dynamic = "force-dynamic";

// Layout sin menú para las pantallas de acceso. La sesión del creador vive solo
// en el host del panel (ADR 003): en cualquier otro host se redirige allí.
export default function AuthLayout({ children }: { children: ReactNode }) {
  if (!hostEsPanel(hostActual())) redirect(`${urlPanel()}/login`);
  return (
    <div className="av-scope au-wrap">
      <Image src="/brand/avantia-mark.png" alt="avantia" width={581} height={364} style={{ height: 36, width: "auto" }} priority />
      <main className="av-card au-card" id="contenido">
        {children}
      </main>
    </div>
  );
}
