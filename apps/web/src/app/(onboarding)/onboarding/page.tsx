import { redirect } from "next/navigation";
import { OnboardingFlow } from "../../../components/creador/marca/OnboardingFlow";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

// Onboarding de 3 pasos (pantalla 03): Bienvenida -> Tu academia -> Color y logo.
// Sin academia (RQ-02): el paso 2 CREA la academia con la sesion del usuario.
export default async function OnboardingPage() {
  const tenant = await getCurrentTenant();
  if (tenant?.onboardingCompletado) redirect("/mi-academia");

  if (!tenant) {
    // Crear una academia exige sesion real (ruta /login: login con correo y contrasena).
    const { data } = await createSupabaseServerClient().auth.getUser();
    if (!data.user) redirect("/login");
  }

  const dominioRaiz = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "avantia.app";
  return <OnboardingFlow tenant={tenant} dominioRaiz={dominioRaiz} />;
}
