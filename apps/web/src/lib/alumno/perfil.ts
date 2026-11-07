// Perfil del alumno: cambiar el nombre y la contraseña. El tenant sale del host y el
// alumno de la sesión (nunca del formulario); toda escritura filtra por tenant_id.
import { z } from "zod";
import { crearLimitador } from "../auth/limite";
import { LARGO_MAX_CONTRASENA } from "../auth/contrasena";
import { supabaseAdmin } from "../supabase/admin";
import { origenPublico, requireTenantPublico } from "./contexto";
import { enviarCorreoAlumno } from "./correos";
import { registrarEvento } from "./eventos";
import { aplicarInvitaciones } from "./inscripciones";
import { hashToken } from "./token";
import { emitirToken, type EstadoForm } from "./cuentas";
import { hashPassword, verifyPassword } from "./password";
import { crearSesion, getAlumnoActual } from "./sesion";
import { correo, erroresPorCampo, MSG_GENERICO, MSG_LIMITE, registroSchema, restablecerSchema } from "./validacion";

const FACTOR = Math.max(1, Number(process.env.ALUMNO_LIMITE_FACTOR ?? 1) || 1);
const limiteClave = crearLimitador(6 * FACTOR, 15 * 60 * 1000);

const MSG_SESION = "Tu sesión expiró. Ingresa de nuevo.";

const nuevoCorreoSchema = correo;
const nombreSchema = z.object({ nombre: registroSchema.shape.nombre });

export async function actualizarNombre(entrada: { nombre: string }): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const alumno = await getAlumnoActual();
  if (!alumno) return { ok: false, error: MSG_SESION };
  const parsed = nombreSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false, campos: erroresPorCampo(parsed.error), error: "Revisa los campos marcados." };
  try {
    const { error } = await supabaseAdmin
      .from("alumnos")
      .update({ nombre: parsed.data.nombre })
      .eq("tenant_id", tenant.id)
      .eq("id", alumno.id);
    if (error) return { ok: false, error: MSG_GENERICO };
    return { ok: true, mensaje: "Guardamos tu nombre." };
  } catch (e) {
    console.error("[alumno] actualizar nombre", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}

const cambioSchema = z.object({
  actual: z.string({ message: "Escribe tu contraseña actual." }).min(1, "Escribe tu contraseña actual.").max(LARGO_MAX_CONTRASENA * 2),
});

export async function cambiarContrasena(entrada: { actual: string; password: string; confirmacion: string }): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const alumno = await getAlumnoActual();
  if (!alumno) return { ok: false, error: MSG_SESION };

  const actual = cambioSchema.safeParse({ actual: entrada.actual });
  const nueva = restablecerSchema.safeParse({ password: entrada.password, confirmacion: entrada.confirmacion });
  if (!actual.success || !nueva.success) {
    return {
      ok: false,
      campos: { ...(actual.success ? {} : erroresPorCampo(actual.error)), ...(nueva.success ? {} : erroresPorCampo(nueva.error)) },
      error: "Revisa los campos marcados.",
    };
  }
  if (actual.data.actual === nueva.data.password) {
    return { ok: false, campos: { password: "La contraseña nueva debe ser distinta de la actual." }, error: "Revisa los campos marcados." };
  }
  if (!limiteClave.permitir(`${tenant.id}:${alumno.id}`)) return { ok: false, error: MSG_LIMITE };

  try {
    const { data: a } = await supabaseAdmin
      .from("alumnos")
      .select("password_hash")
      .eq("tenant_id", tenant.id)
      .eq("id", alumno.id)
      .maybeSingle();
    if (!a || !(await verifyPassword(actual.data.actual, a.password_hash))) {
      return { ok: false, campos: { actual: "Esa no es tu contraseña actual. Revísala e inténtalo de nuevo." }, error: "Revisa los campos marcados." };
    }
    const { error } = await supabaseAdmin
      .from("alumnos")
      .update({ password_hash: await hashPassword(nueva.data.password) })
      .eq("tenant_id", tenant.id)
      .eq("id", alumno.id);
    if (error) return { ok: false, error: MSG_GENERICO };

    // Cierra las sesiones abiertas (otros dispositivos) y deja una nueva para este.
    await supabaseAdmin.from("alumno_tokens").delete().eq("tenant_id", tenant.id).eq("alumno_id", alumno.id).eq("tipo", "sesion");
    await crearSesion(tenant.id, alumno.id);
    return { ok: true, mensaje: "Cambiamos tu contraseña. Cerramos tu sesión en otros dispositivos." };
  } catch (e) {
    console.error("[alumno] cambiar contraseña", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}

// ---- Cambio de correo (ADR 036) ----

const HORAS_CAMBIO_CORREO = 2;
const limiteCambioCorreo = crearLimitador(5 * FACTOR, 60 * 60 * 1000);

const MSG_ENLACE_CORREO = (correo: string) =>
  `Te enviamos un enlace a ${correo}. Tócalo para confirmar el cambio; vence en ${HORAS_CAMBIO_CORREO} horas. Mientras tanto, sigues ingresando con tu correo actual.`;

/** Paso 1: valida, y envía el enlace al correo NUEVO. `alumnos.correo` no cambia todavía. */
export async function solicitarCambioCorreo(entrada: { email: string; password: string }): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const alumno = await getAlumnoActual();
  if (!alumno) return { ok: false, error: MSG_SESION };

  const nuevo = nuevoCorreoSchema.safeParse(entrada.email);
  const pass = cambioSchema.safeParse({ actual: entrada.password });
  if (!nuevo.success || !pass.success) {
    return {
      ok: false,
      campos: {
        ...(nuevo.success ? {} : { email: nuevo.error.issues[0]?.message ?? "Revisa el correo." }),
        ...(pass.success ? {} : { password: "Escribe tu contraseña actual para confirmar que eres tú." }),
      },
      error: "Revisa los campos marcados.",
    };
  }
  const correoNuevo = nuevo.data;
  if (correoNuevo === alumno.correo) {
    return { ok: false, campos: { email: "Ese ya es tu correo actual." }, error: "Revisa los campos marcados." };
  }
  if (!limiteCambioCorreo.permitir(`${tenant.id}:${alumno.id}`)) return { ok: false, error: MSG_LIMITE };

  try {
    const { data: a } = await supabaseAdmin
      .from("alumnos")
      .select("password_hash")
      .eq("tenant_id", tenant.id)
      .eq("id", alumno.id)
      .maybeSingle();
    if (!a || !(await verifyPassword(pass.data.actual, a.password_hash))) {
      return { ok: false, campos: { password: "Esa no es tu contraseña actual. Revísala e inténtalo de nuevo." }, error: "Revisa los campos marcados." };
    }

    // Si ya existe en esta academia no se revela: misma respuesta, pero no se envía enlace.
    const { data: existente } = await supabaseAdmin
      .from("alumnos")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("correo", correoNuevo)
      .maybeSingle();
    if (!existente) {
      const token = await emitirToken(tenant.id, alumno.id, "cambio_correo", HORAS_CAMBIO_CORREO, correoNuevo);
      await enviarCorreoAlumno({
        tenant,
        para: correoNuevo,
        asunto: `Confirma tu nuevo correo en ${tenant.nombre}`,
        titulo: "Confirma tu nuevo correo",
        parrafos: [
          `Hola, ${alumno.nombre.split(" ")[0]}. Pediste usar este correo para ingresar a ${tenant.nombre}. Confírmalo para completar el cambio.`,
        ],
        boton: "Confirmar mi nuevo correo",
        url: `${origenPublico()}/confirmar-correo?token=${encodeURIComponent(token)}`,
        nota: `El enlace vence en ${HORAS_CAMBIO_CORREO} horas. Si no fuiste tú, ignora este mensaje: no cambiará nada.`,
      });
    }
    return { ok: true, correo: correoNuevo, mensaje: MSG_ENLACE_CORREO(correoNuevo) };
  } catch (e) {
    console.error("[alumno] solicitar cambio de correo", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}

/** Paso 2: consume el enlace (un solo uso), cambia el correo, cierra sesiones y avisa al correo anterior. */
export async function confirmarCambioCorreo(tokenCrudo: string): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  if (!tokenCrudo || tokenCrudo.length > 200) return { ok: false, error: "El enlace no es válido." };
  const vencido = "Este enlace venció o ya se usó. Pide el cambio de nuevo desde tu perfil.";
  try {
    const { data: t } = await supabaseAdmin
      .from("alumno_tokens")
      .update({ usado_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("tipo", "cambio_correo")
      .eq("token_hash", hashToken(tokenCrudo))
      .is("usado_at", null)
      .gt("expira_at", new Date().toISOString())
      .select("alumno_id, dato")
      .maybeSingle();
    if (!t || !t.dato) return { ok: false, error: vencido };

    const { data: antes } = await supabaseAdmin
      .from("alumnos")
      .select("nombre, correo")
      .eq("tenant_id", tenant.id)
      .eq("id", t.alumno_id)
      .maybeSingle();
    if (!antes) return { ok: false, error: vencido };

    const { data: a, error } = await supabaseAdmin
      .from("alumnos")
      .update({ correo: t.dato, correo_verificado_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("id", t.alumno_id)
      .select("id, correo")
      .maybeSingle();
    if (error?.code === "23505") {
      return { ok: false, error: "Ese correo ya está en uso en esta academia. Usa otro o escribe a tu academia." };
    }
    if (error || !a) return { ok: false, error: MSG_GENERICO };

    // Cierra todas las sesiones y deja una nueva en este dispositivo.
    await supabaseAdmin.from("alumno_tokens").delete().eq("tenant_id", tenant.id).eq("alumno_id", a.id).eq("tipo", "sesion");
    await aplicarInvitaciones(tenant.id, a.id, a.correo);
    await registrarEvento(tenant.id, { tipo: "correo_cambiado", alumnoId: a.id });
    await crearSesion(tenant.id, a.id);

    // Aviso al correo anterior (sin enlace de cambio: solo para recuperar la cuenta si no fue el alumno).
    await enviarCorreoAlumno({
      tenant,
      para: antes.correo,
      asunto: `Cambiaron el correo de tu cuenta en ${tenant.nombre}`,
      titulo: "Cambiamos el correo de tu cuenta",
      parrafos: [
        `Hola, ${antes.nombre.split(" ")[0]}. El correo de tu cuenta en ${tenant.nombre} ahora es ${a.correo}.`,
        "Si no fuiste tú, restablece tu contraseña cuanto antes y escribe a tu academia.",
      ],
      boton: "Recuperar mi cuenta",
      url: `${origenPublico()}/recuperar`,
      nota: "Recibes este aviso porque este era el correo de la cuenta.",
    }).catch(() => false);
    return { ok: true };
  } catch (e) {
    console.error("[alumno] confirmar cambio de correo", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}
