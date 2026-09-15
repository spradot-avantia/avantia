import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Tenant {
  id: string;
  slug: string;
  nombre: string;
  logo_url: string | null;
  color_primario: string | null;
}

interface TenantContextValue {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: true,
  error: null,
});

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * A diferencia de Next.js, acá no hay un middleware de edge que resuelva el
 * tenant antes de renderizar: al ser un SPA, el tenant se resuelve del lado
 * del cliente contra la API usando window.location.hostname. Esto implica un
 * pequeño delay antes de poder mostrar el theming del tenant (ver ADR
 * 002-migracion-nextjs-a-node-react.md para el detalle de este trade-off).
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;

    fetch(`${apiUrl}/api/tenants/resolve?hostname=${hostname}`)
      .then((res) => {
        if (!res.ok) throw new Error("Academia no encontrada");
        return res.json();
      })
      .then((data: Tenant) => setTenant(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
