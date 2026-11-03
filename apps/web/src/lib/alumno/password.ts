// Hash de contraseñas de alumno con scrypt (node:crypto, sin dependencias).
// Formato: scrypt$N$r$p$salt_b64$hash_b64 — los parámetros viajan con el hash
// para poder subirlos más adelante sin invalidar cuentas existentes.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 16384;
const R = 8;
const P = 1;
const LARGO = 64;

function derivar(password: string, salt: Buffer, n: number, r: number, p: number, largo: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, largo, { N: n, r, p, maxmem: 256 * n * r }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derivar(password, salt, N, R, P, LARGO);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, almacenado: string): Promise<boolean> {
  const partes = almacenado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = partes;
  const esperado = Buffer.from(hashB64, "base64");
  if (!esperado.length) return false;
  try {
    const key = await derivar(password, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p), esperado.length);
    return key.length === esperado.length && timingSafeEqual(key, esperado);
  } catch {
    return false;
  }
}

/** Hash fijo para igualar el tiempo de respuesta cuando el correo no existe. */
let falso: Promise<string> | null = null;
export function hashFalso(): Promise<string> {
  falso ??= hashPassword("avantia-no-existe");
  return falso;
}
