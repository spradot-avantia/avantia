import { redirect } from "next/navigation";
import { SinAcademia } from "../../../components/creador";
import { OnboardingFlow } from "../../../components/creador/marca/OnboardingFlow";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

// Onboarding de 3 pasos (pantalla 03): Bienvenida -> Tu academia -> Color y logo.
export default async function OnboardingPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) return <SinAcademia />;
  if (tenant.onboardingCompletado) redirect("/mi-academia");
  const dominioRaiz = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "avantia.app";
  return <OnboardingFlow tenant={tenant} dominioRaiz={dominioRaiz} />;
}
