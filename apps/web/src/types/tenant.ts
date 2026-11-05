import type { Forma, Tipografia } from "../lib/tenant/identidad";

export interface Tenant {
  id: string;
  slug: string;
  customDomain: string | null;
  subdomain: string;
  nombre: string;
  frase: string | null;
  theme: {
    logoUrl: string | null;
    logoModo: "logo_y_nombre" | "solo_logo";
    colorPrimario: string;
    /** Identidad visual (ADR 027). */
    tipografia: Tipografia;
    forma: Forma;
  };
}
