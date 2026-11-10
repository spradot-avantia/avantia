import { createHash, randomBytes } from "node:crypto";

/** Token opaco para cookies y enlaces de correo. En base solo se guarda el hash. */
export function nuevoToken(bytes = 32): { token: string; hash: string } {
  const token = randomBytes(bytes).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
