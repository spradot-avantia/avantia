import { Routes, Route } from "react-router-dom";

import { DashboardLayout } from "./dashboard/DashboardLayout.js";
import { HomePage } from "./dashboard/HomePage.js";
import { CursosPage } from "./dashboard/cursos/CursosPage.js";
import { NuevoCursoPage } from "./dashboard/cursos/NuevoCursoPage.js";
import { EditarCursoPage } from "./dashboard/cursos/EditarCursoPage.js";
import { EstudiantesPage } from "./dashboard/estudiantes/EstudiantesPage.js";
import { DominioPage } from "./dashboard/configuracion/DominioPage.js";
import { MarcaPage } from "./dashboard/configuracion/MarcaPage.js";

import { PublicLayout } from "./public-site/PublicLayout.js";
import { LandingPage } from "./public-site/LandingPage.js";
import { CursoVentaPage } from "./public-site/CursoVentaPage.js";
import { AprenderPage } from "./public-site/AprenderPage.js";
import { CheckoutPage } from "./public-site/CheckoutPage.js";

const panelHostSuffix =
  import.meta.env.VITE_PANEL_HOST_SUFFIX ?? "app.avantia.app";

function isPanelHost(hostname: string): boolean {
  return hostname === "localhost" || hostname.endsWith(panelHostSuffix);
}

/**
 * Equivalente a las route groups (dashboard) y (public)/[domain] de
 * Next.js: acá la decisión de qué set de rutas mostrar se toma en runtime
 * según el hostname, ya que un SPA no tiene el concepto de rewrite a nivel
 * de edge.
 */
export function AppRouter() {
  const panel = isPanelHost(window.location.hostname);

  if (panel) {
    return (
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cursos" element={<CursosPage />} />
          <Route path="cursos/nuevo" element={<NuevoCursoPage />} />
          <Route path="cursos/:cursoId" element={<EditarCursoPage />} />
          <Route path="estudiantes" element={<EstudiantesPage />} />
          <Route path="configuracion/dominio" element={<DominioPage />} />
          <Route path="configuracion/marca" element={<MarcaPage />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="curso/:slug" element={<CursoVentaPage />} />
        <Route
          path="aprender/:cursoId/:leccionId"
          element={<AprenderPage />}
        />
        <Route path="checkout" element={<CheckoutPage />} />
      </Route>
    </Routes>
  );
}
