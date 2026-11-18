// Identificador seudónimo del alumno para analítica (ADR 040): HMAC-SHA256 de tenant+alumno con
// un secreto de servidor. Nunca se envía el id real, el correo ni el nombre. Distinto por
// academia (las cuentas son por academia, ADR 018). Solo servidor.
import { createHmac } from "node:crypto";

/** null si falta ANALITICA_HMAC_SECRET: sin secreto no se identifica a nadie (analítica apagada). */
export function idSeudonimo(tenantId: string, alumnoId: string): string | null {
  const secreto = process.env.ANALITICA_HMAC_SECRET;
  if (!secreto || secreto.length < 16) return null;
  return createHmac("sha256", secreto).update(`${tenantId}:${alumnoId}`).digest("hex").slice(0, 32);
}
