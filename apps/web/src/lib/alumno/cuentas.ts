// Cuentas de alumno por academia (ADR 018): registro, confirmación de correo,
// ingreso y recuperación. Service role SIEMPRE con .eq("tenant_id", tenant.id),
// y el tenant sale del host. Respuestas que no revelan si un correo existe.
import { crearLimitador } from "../auth/limite";
import { supabaseAdmin } from "../supabase/admin";
import type { Tenant } from "../../types/tenant";
import { claveCliente, origenPublico, requireTenantPublico } from "./contexto";
import { enviarCorreoAlumno } from "./correos";
import { registrarEvento } from "./eventos";
import { aplicarInvitaciones, solicitarInscripcion } from "./inscripciones";
import { hashFalso, hashPassword, verifyPassword } from "./password";
import { crearSesion } from "./sesion";
import { hashToken, nuevoToken } from "./token";
import {
  erroresPorCampo,
  ingresoSchema,
  limpiarCampana,
  MSG_CREDENCIALES,
  MSG_GENERICO,
  MSG_LIMITE,
  recuperacionSchema,
  registroSchema,
  restablecerSchema,
} from "./validacion";

export interface EstadoForm {
  ok?: boolean;
  error?: string;
  campos?: Record<string, string>;
  mensaje?: string;
  /** El correo existe pero falta confirmarlo: la UI ofrece reenviar el enlace. */
  sinConfirmar?: boolean;
  correo?: string;
  /** Ruta a la que el navegador debe ir (navegación completa; ver actions.ts). */
  irA?: string;
}

// Solo para pruebas E2E (muchos registros/ingresos desde una IP): ALUMNO_LIMITE_FACTOR=50 multiplica los límites.
const FACTOR = Math.max(1, Number(process.env.ALUMNO_LIMITE_FACTOR ?? 1) || 1);
const limiteRegistro = crearLimitador(8 * FACTOR, 60 * 60 * 1000);
const limiteIngreso = crearLimitador(8 * FACTOR, 15 * 60 * 1000);
const limiteCorreos = crearLimitador(5 * FACTOR, 60 * 60 * 1000);

const HORAS_CONFIRMAR = 48;
const HORAS_RECUPERAR = 2;

const MSG_REVISA_CORREO =
  "Te enviamos un enlace para confirmar tu correo. Revisa tu bandeja de entrada y la carpeta de spam; puede tardar un par de minutos.";

export async function emitirToken(
  tenantId: string,
  alumnoId: string,
  tipo: "confirmar" | "recuperar" | "cambio_correo",
  horas: number,
  dato?: string,
): Promise<string> {
  // Un solo enlace vigente por tipo: invalida los anteriores.
  await supabaseAdmin
    .from("alumno_tokens")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("tipo", tipo)
    .is("usado_at", null);
  const { token, hash } = nuevoToken();
  const { error } = await supabaseAdmin.from("alumno_tokens").insert({
    tenant_id: tenantId,
    alumno_id: alumnoId,
    tipo,
    token_hash: hash,
    expira_at: new Date(Date.now() + horas * 3600 * 1000).toISOString(),
    ...(dato ? { dato } : {}),
  });
  if (error) throw new Error("No se pudo emitir el enlace");
  return token;
}

async function enviarConfirmacion(tenant: Tenant, alumno: { id: string; nombre: string; correo: string }): Promise<void> {
  const token = await emitirToken(tenant.id, alumno.id, "confirmar", HORAS_CONFIRMAR);
  await enviarCorreoAlumno({
    tenant,
    para: alumno.correo,
    asunto: `Confirma tu correo en ${tenant.nombre}`,
    titulo: "Confirma tu correo",
    parrafos: [`Hola, ${alumno.nombre.split(" ")[0]}. Para entrar a ${tenant.nombre}, confirma que este correo es tuyo.`],
    boton: "Confirmar mi correo",
    url: `${origenPublico()}/confirmar?token=${encodeURIComponent(token)}`,
    nota: `El enlace vence en ${HORAS_CONFIRMAR} horas. Si no creaste esta cuenta, puedes ignorar este mensaje.`,
  });
}

export interface EntradaRegistro {
  nombre: string;
  email: string;
  password: string;
  terminos: boolean;
  cursoSlug?: string | null;
  origen?: "anuncio" | "pagina" | null;
  campana?: string | null;
}

export async function registrarAlumno(entrada: EntradaRegistro): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const parsed = registroSchema.safeParse({ ...entrada, terminos: entrada.terminos === true });
  if (!parsed.success) return { ok: false, campos: erroresPorCampo(parsed.error), error: "Revisa los campos marcados." };
  const { nombre, email, password } = parsed.data;

  if (!limiteRegistro.permitir(`${tenant.id}:${claveCliente()}`) || !limiteCorreos.permitir(`reg:${tenant.id}:${email}`)) {
    return { ok: false, error: MSG_LIMITE };
  }

  try {
    const { data: existente } = await supabaseAdmin
      .from("alumnos")
      .select("id, nombre, correo, correo_verificado_at")
      .eq("tenant_id", tenant.id)
      .eq("correo", email)
      .maybeSingle();

    if (existente) {
      // No se revela que ya existe; si falta confirmar, se reenvía el enlace.
      if (!existente.correo_verificado_at) await enviarConfirmacion(tenant, existente);
      return { ok: true, correo: email, mensaje: MSG_REVISA_CORREO };
    }

    const { data: nuevo, error } = await supabaseAdmin
      .from("alumnos")
      .insert({ tenant_id: tenant.id, nombre, correo: email, password_hash: await hashPassword(password) })
      .select("id, nombre, correo")
      .single();
    if (error || !nuevo) {
      // Carrera con otro registro del mismo correo: respuesta genérica.
      if (error?.code === "23505") return { ok: true, correo: email, mensaje: MSG_REVISA_CORREO };
      return { ok: false, error: MSG_GENERICO };
    }
    await registrarEvento(tenant.id, { tipo: "cuenta_creada", alumnoId: nuevo.id });

    if (entrada.cursoSlug) {
      const { data: curso } = await supabaseAdmin
        .from("cursos")
        .select("id, acceso, estado")
        .eq("tenant_id", tenant.id)
        .eq("slug", entrada.cursoSlug)
        .maybeSingle();
      // Solo cursos "enlace": los de invitados se activan al confirmar el correo.
      if (curso && curso.acceso === "enlace") {
        await solicitarInscripcion(
          tenant.id,
          { id: nuevo.id, correo: nuevo.correo, verificado: false },
          curso,
          { origen: entrada.origen === "anuncio" ? "anuncio" : "pagina", campana: limpiarCampana(entrada.campana) },
        );
      }
    }

    await enviarConfirmacion(tenant, nuevo);
    return { ok: true, correo: email, mensaje: MSG_REVISA_CORREO };
  } catch (e) {
    console.error("[alumno] registro", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}

export async function reenviarConfirmacion(emailCrudo: string): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const parsed = recuperacionSchema.safeParse({ email: emailCrudo });
  if (!parsed.success) return { ok: false, campos: erroresPorCampo(parsed.error) };
  const email = parsed.data.email;
  if (!limiteCorreos.permitir(`conf:${tenant.id}:${email}`)) return { ok: false, error: MSG_LIMITE };
  try {
    const { data: a } = await supabaseAdmin
      .from("alumnos")
      .select("id, nombre, correo, correo_verificado_at")
      .eq("tenant_id", tenant.id)
      .eq("correo", email)
      .maybeSingle();
    if (a && !a.correo_verificado_at) await enviarConfirmacion(tenant, a);
  } catch (e) {
    console.error("[alumno] reenvío", e instanceof Error ? e.message : e);
  }
  return { ok: true, correo: email, mensaje: MSG_REVISA_CORREO };
}

/** Consume el enlace de confirmación (un solo uso), verifica el correo y abre sesión. */
export async function confirmarCorreo(tokenCrudo: string): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  if (!tokenCrudo || tokenCrudo.length > 200) return { ok: false, error: "El enlace no es válido." };
  const vencido = "Este enlace venció o ya se usó. Pide uno nuevo desde «Ingresar».";
  try {
    const { data: t } = await supabaseAdmin
      .from("alumno_tokens")
      .update({ usado_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("tipo", "confirmar")
      .eq("token_hash", hashToken(tokenCrudo))
      .is("usado_at", null)
      .gt("expira_at", new Date().toISOString())
      .select("alumno_id")
      .maybeSingle();
    if (!t) return { ok: false, error: vencido };

    const { data: a } = await supabaseAdmin
      .from("alumnos")
      .update({ correo_verificado_at: new Date().toISOString(), ultimo_ingreso_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("id", t.alumno_id)
      .select("id, correo")
      .maybeSingle();
    if (!a) return { ok: false, error: vencido };

    await aplicarInvitaciones(tenant.id, a.id, a.correo);
    await crearSesion(tenant.id, a.id);
    return { ok: true };
  } catch (e) {
    console.error("[alumno] confirmar", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}

export async function ingresarAlumno(entrada: { email: string; password: string }): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const parsed = ingresoSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false, campos: erroresPorCampo(parsed.error), error: "Revisa los campos marcados." };
  const { email, password } = parsed.data;
  if (!limiteIngreso.permitir(`${tenant.id}:${claveCliente()}`) || !limiteIngreso.permitir(`${tenant.id}:${email}`)) {
    return { ok: false, error: MSG_LIMITE };
  }
  try {
    const { data: a } = await supabaseAdmin
      .from("alumnos")
      .select("id, correo, password_hash, correo_verificado_at")
      .eq("tenant_id", tenant.id)
      .eq("correo", email)
      .maybeSingle();
    // Siempre se hace un scrypt, exista o no el correo (evita medir tiempos).
    const ok = await verifyPassword(password, a?.password_hash ?? (await hashFalso()));
    if (!a || !ok) return { ok: false, error: MSG_CREDENCIALES };
    if (!a.correo_verificado_at) {
      return {
        ok: false,
        sinConfirmar: true,
        correo: email,
        error: "Aún no confirmas tu correo. Abre el mensaje que te enviamos y toca el botón; si no lo encuentras, revisa spam o pide otro enlace.",
      };
    }
    await supabaseAdmin
      .from("alumnos")
      .update({ ultimo_ingreso_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("id", a.id);
    await aplicarInvitaciones(tenant.id, a.id, a.correo);
    await crearSesion(tenant.id, a.id);
    return { ok: true };
  } catch (e) {
    console.error("[alumno] ingreso", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}

export async function pedirRecuperacion(emailCrudo: string): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const parsed = recuperacionSchema.safeParse({ email: emailCrudo });
  if (!parsed.success) return { ok: false, campos: erroresPorCampo(parsed.error), error: "Revisa tu correo." };
  const email = parsed.data.email;
  const generico: EstadoForm = {
    ok: true,
    mensaje: "Si el correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa tu bandeja y la carpeta de spam.",
  };
  if (!limiteCorreos.permitir(`rec:${tenant.id}:${email}`) || !limiteCorreos.permitir(`rec-ip:${tenant.id}:${claveCliente()}`)) {
    return { ok: false, error: MSG_LIMITE };
  }
  try {
    const { data: a } = await supabaseAdmin
      .from("alumnos")
      .select("id, nombre, correo")
      .eq("tenant_id", tenant.id)
      .eq("correo", email)
      .maybeSingle();
    if (a) {
      const token = await emitirToken(tenant.id, a.id, "recuperar", HORAS_RECUPERAR);
      await enviarCorreoAlumno({
        tenant,
        para: a.correo,
        asunto: `Restablece tu contraseña en ${tenant.nombre}`,
        titulo: "Crea una contraseña nueva",
        parrafos: [`Hola, ${a.nombre.split(" ")[0]}. Pediste restablecer tu contraseña de ${tenant.nombre}.`],
        boton: "Crear contraseña nueva",
        url: `${origenPublico()}/restablecer?token=${encodeURIComponent(token)}`,
        nota: `El enlace vence en ${HORAS_RECUPERAR} horas. Si no fuiste tú, ignora este mensaje: tu contraseña no cambia.`,
      });
    }
  } catch (e) {
    console.error("[alumno] recuperación", e instanceof Error ? e.message : e);
  }
  return generico;
}

export async function restablecerContrasena(entrada: { token: string; password: string; confirmacion: string }): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const parsed = restablecerSchema.safeParse({ password: entrada.password, confirmacion: entrada.confirmacion });
  if (!parsed.success) return { ok: false, campos: erroresPorCampo(parsed.error), error: "Revisa los campos marcados." };
  if (!entrada.token || entrada.token.length > 200) return { ok: false, error: "El enlace no es válido." };
  try {
    const { data: t } = await supabaseAdmin
      .from("alumno_tokens")
      .update({ usado_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("tipo", "recuperar")
      .eq("token_hash", hashToken(entrada.token))
      .is("usado_at", null)
      .gt("expira_at", new Date().toISOString())
      .select("alumno_id")
      .maybeSingle();
    if (!t) return { ok: false, error: "Este enlace venció o ya se usó. Pide uno nuevo desde «Olvidé mi contraseña»." };

    // Haber recibido el enlace en su correo prueba que lo controla: queda verificado.
    const { data: a } = await supabaseAdmin
      .from("alumnos")
      .update({ password_hash: await hashPassword(parsed.data.password), correo_verificado_at: new Date().toISOString() })
      .eq("tenant_id", tenant.id)
      .eq("id", t.alumno_id)
      .select("id, correo")
      .maybeSingle();
    if (!a) return { ok: false, error: MSG_GENERICO };

    // Cierra todas las sesiones abiertas de esa cuenta.
    await supabaseAdmin
      .from("alumno_tokens")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("alumno_id", a.id)
      .eq("tipo", "sesion");
    await aplicarInvitaciones(tenant.id, a.id, a.correo);
    await crearSesion(tenant.id, a.id);
    return { ok: true };
  } catch (e) {
    console.error("[alumno] restablecer", e instanceof Error ? e.message : e);
    return { ok: false, error: MSG_GENERICO };
  }
}
