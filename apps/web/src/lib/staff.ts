import { getUsuarioActual } from "./auth/usuario";

/**
 * STUB de rol "equipo de Avantia" (Supuestos_y_Pendientes: separacion de rol
 * staff vs dueno de academia). Deniega por defecto: solo es staff quien tiene
 * sesion Y su correo esta en STAFF_EMAILS (lista separada por comas).
 *
 * TODO(RQ-06): reemplazar por un rol real (claim en el JWT o tabla `staff`).
 */
export async function esStaff(): Promise<boolean> {
  const lista = (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (lista.length === 0) return false;
  // Reutiliza la sesion cacheada por request (sin otra llamada a Auth).
  const email = (await getUsuarioActual())?.email?.toLowerCase();
  return !!email && lista.includes(email);
}
