"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { crearLimitador } from "../auth/limite";
import { urlPanel } from "../auth/panel";
import { MSG_GENERICO, MSG_LIMITE, erroresPorCampo } from "../auth/validacion";
import { enviarCorreo, escaparHtml } from "../email/resend";
import { esStaff } from "../staff";
import { supabaseAdmin } from "../supabase/admin";
import { postulacionSchema, type EstadoPostulacion } from "./validacion";

/**
 * Postulación al programa fundador SIN iniciar sesión (ADR 014). El servidor
 * escribe con service role porque el postulante no tiene identidad; por eso
 * hay campo trampa, límite por IP/correo y validación estricta. No existe
 * tenant_id: es una tabla de plataforma (excepción documentada en ADR 011).
 */
const limitePorIp = crearLimitador(5, 10 * 60_000);
const limitePorCorreo = crearLimitador(3, 60 * 60_000);

function destinatariosAviso(): string[] {
  return (process.env.POSTULACIONES_NOTIFY_TO ?? "javiera@goavantia.com,contacto@goavantia.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

function ipCliente(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
}

export async function enviarPostulacionAction(_prev: EstadoPostulacion, fd: FormData): Promise<EstadoPostulacion> {
  const valores = {
    nombre: fd.get("nombre")?.toString() ?? "",
    email: fd.get("email")?.toString() ?? "",
    descripcion: fd.get("descripcion")?.toString() ?? "",
  };
  // Campo trampa: las personas no lo ven; los bots lo llenan. Se responde "ok" sin guardar.
  if ((fd.get("sitio")?.toString() ?? "") !== "") return { ok: true };

  const parsed = postulacionSchema.safeParse(valores);
  if (!parsed.success) return { errores: erroresPorCampo(parsed.error), valores };
  const { nombre, email, descripcion } = parsed.data;

  if (!limitePorIp.permitir(ipCliente()) || !limitePorCorreo.permitir(email)) return { mensaje: MSG_LIMITE, valores };

  const { data: existente, error: errLectura } = await supabaseAdmin
    .from("postulaciones")
    .select("id, estado")
    .eq("email", email)
    .maybeSingle();
  if (errLectura) {
    console.error("[postulacion] lectura", errLectura.code ?? errLectura.message);
    return { mensaje: MSG_GENERICO, valores };
  }

  // Misma respuesta si ya existía: no se revela si un correo ya postuló.
  if (existente) {
    if (existente.estado === "nueva") {
      await supabaseAdmin.from("postulaciones").update({ nombre, descripcion }).eq("id", existente.id);
    }
    return { ok: true };
  }

  const { error } = await supabaseAdmin.from("postulaciones").insert({ email, nombre, descripcion });
  if (error) {
    console.error("[postulacion] guardar", error.code ?? error.message);
    return { mensaje: MSG_GENERICO, valores };
  }

  await enviarCorreo({
    to: destinatariosAviso(),
    replyTo: email,
    subject: `Nueva postulación: ${nombre}`,
    text: `${nombre} <${email}>\n\n${descripcion}\n\nRevisar: ${urlPanel()}/admin/postulaciones`,
    html: `<p><b>${escaparHtml(nombre)}</b> &lt;${escaparHtml(email)}&gt;</p><p>${escaparHtml(descripcion).replace(/\n/g, "<br>")}</p><p><a href="${urlPanel()}/admin/postulaciones">Ver en el panel</a></p>`,
  });
  return { ok: true };
}

const ESTADOS = new Set(["nueva", "contactada", "aceptada", "lista_espera", "descartada"]);

/** Solo el equipo: cambia el estado y, al aceptar (o reenviar), manda la invitación a registrarse. */
export async function cambiarEstadoPostulacionAction(fd: FormData): Promise<void> {
  if (!(await esStaff())) return;
  const id = fd.get("id")?.toString() ?? "";
  const estado = fd.get("estado")?.toString() ?? "";
  if (!id || !ESTADOS.has(estado)) return;

  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .update({ estado, ...(estado === "aceptada" ? { invitado_en: new Date().toISOString() } : {}) })
    .eq("id", id)
    .select("nombre, email")
    .maybeSingle();
  if (error || !data) {
    console.error("[postulacion] cambiar estado", error?.code ?? error?.message ?? "no encontrada");
    return;
  }

  if (estado === "aceptada") {
    const enlace = `${urlPanel()}/signup`;
    await enviarCorreo({
      to: [data.email],
      replyTo: destinatariosAviso()[0],
      subject: "Quedaste en el programa fundador de Avantia",
      text: `Hola ${data.nombre},\n\nTu postulación fue aceptada. Crea tu cuenta con este mismo correo (${data.email}), con contraseña o con Google:\n${enlace}\n\nSi tienes dudas, responde este correo.\n\nEquipo Avantia`,
      html: `<p>Hola ${escaparHtml(data.nombre)},</p><p>Tu postulación fue aceptada. Crea tu cuenta con este mismo correo (<b>${escaparHtml(data.email)}</b>), con contraseña o con Google.</p><p><a href="${enlace}">Crear mi cuenta</a></p><p>Si tienes dudas, responde este correo.</p><p>Equipo Avantia</p>`,
    });
  }
  revalidatePath("/admin/postulaciones");
}
