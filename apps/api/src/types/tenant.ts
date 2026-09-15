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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}
