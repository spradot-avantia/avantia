"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Tenant } from "../types/tenant";

const TenantContext = createContext<Tenant | null>(null);

/**
 * A diferencia de la versión SPA (que resolvía el tenant en el cliente
 * contra la API tras montar la página), acá el tenant ya llega resuelto
 * desde app/(public)/[domain]/layout.tsx —un Server Component— y este
 * provider solo lo expone a los Client Components descendientes que lo
 * necesiten (ej. el reproductor de video). No hay fetch ni estado de
 * loading: si el layout renderizó, el tenant existe.
 */
export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): Tenant {
  const tenant = useContext(TenantContext);
  if (!tenant) {
    throw new Error("useTenant() debe usarse dentro de <TenantProvider>");
  }
  return tenant;
}
