import type { ReactNode } from "react";
import Image from "next/image";
import "../../components/creador/creador.css";
import "../../components/creador/auth/auth.css";

export const dynamic = "force-dynamic";

// Postulación al programa fundador: pública y sin sesión (ADR 014).
export default function PostulacionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="av-scope au-wrap">
      <Image src="/brand/avantia-mark.png" alt="avantia" width={581} height={364} style={{ height: 36, width: "auto" }} priority />
      <main className="av-card au-card" id="contenido">
        {children}
      </main>
    </div>
  );
}
