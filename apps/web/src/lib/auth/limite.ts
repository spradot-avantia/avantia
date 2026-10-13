/**
 * Limitador mínimo EN MEMORIA para acciones de auth (ventana deslizante).
 *
 * Es solo una red de seguridad adicional: Supabase Auth ya limita por IP y por
 * correo (login, signup, envío de correos). En serverless cada instancia tiene
 * su propia memoria, así que esto NO es un límite global.
 * TODO(NF-23): reemplazar por un limitador compartido (Upstash/Redis o tabla)
 * cuando haya tráfico real.
 */
export function crearLimitador(max: number, ventanaMs: number, ahora: () => number = Date.now) {
  const golpes = new Map<string, number[]>();
  return {
    /** true si la clave todavía puede intentar (y registra el intento). */
    permitir(clave: string): boolean {
      const t = ahora();
      const recientes = (golpes.get(clave) ?? []).filter((x) => t - x < ventanaMs);
      if (recientes.length >= max) {
        golpes.set(clave, recientes);
        return false;
      }
      recientes.push(t);
      golpes.set(clave, recientes);
      if (golpes.size > 5000) {
        for (const [k, v] of golpes) if (v.every((x) => t - x >= ventanaMs)) golpes.delete(k);
      }
      return true;
    },
  };
}
