export interface Tenant {
  id: string;
  slug: string;
  customDomain: string | null;
  subdomain: string;
  nombre: string;
  theme: {
    logoUrl: string | null;
    colorPrimario: string;
  };
}
