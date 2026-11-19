// Inicio del pago de un curso con Checkout Pro de Mercado Pago (ADR 046). Solo backend.
// El tenant sale del host, el alumno de la sesión y el PRECIO DE LA BASE: nada del
// formulario decide cuánto se cobra ni a qué academia.
import { Preference } from "mercadopago";
import { cargarCurso } from "../alumno/catalogo";
import { solicitarInscripcion } from "../alumno/inscripciones";
import type { AlumnoSesion } from "../alumno/sesion";
import { getMercadopagoClient } from "../mercadopago";
import type { Tenant } from "../../types/tenant";
import { MONEDA_PASARELA, pesosDeCentavos } from "./reglas";

export type ResultadoIniciarPago = { ok: true; url: string } | { ok: false; error: string };

/** Pagos con pasarela activos solo si hay credenciales (y no se apagaron a propósito). */
export function pagosHabilitados(): boolean {
  return process.env.PAGOS_HABILITADOS !== "false" && !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

/** URL pública https del webhook, si existe (en local sin túnel no hay: el retorno acredita). */
function urlNotificacion(): string | undefined {
  const u = process.env.MERCADOPAGO_NOTIFICATION_URL?.trim();
  return u && u.startsWith("https://") ? u : undefined;
}

export async function iniciarPagoCurso(
  tenant: Tenant,
  alumno: AlumnoSesion,
  cursoSlug: string,
  origen: { origenUrl: string; campana: string | null },
): Promise<ResultadoIniciarPago> {
  if (!pagosHabilitados()) return { ok: false, error: "Los pagos en línea no están disponibles en esta academia todavía." };

  const curso = await cargarCurso(tenant.id, { slug: cursoSlug });
  if (!curso || curso.estado !== "publicado") return { ok: false, error: "Este curso no está disponible." };
  if (curso.acceso !== "enlace") return { ok: false, error: "Este curso es solo para personas invitadas." };
  if (curso.precioCentavos <= 0) return { ok: false, error: "Este curso es gratis: inscríbete sin pagar." };

  const r = await solicitarInscripcion(tenant.id, alumno, curso, { origen: "pagina", campana: origen.campana });
  if (!r.ok) return { ok: false, error: r.error };
  if (r.inscripcion.estado === "activa") return { ok: true, url: `/aprender/${curso.id}` };
  if (r.inscripcion.estado !== "pendiente") return { ok: false, error: "Tu inscripción no admite pago. Escríbele a la academia." };

  const retorno = `${origen.origenUrl}/pago/retorno`;
  const https = retorno.startsWith("https://");
  const notificacion = urlNotificacion();
  try {
    const pref = await new Preference(getMercadopagoClient()).create({
      body: {
        items: [
          {
            id: curso.id,
            title: curso.titulo.slice(0, 120),
            quantity: 1,
            unit_price: pesosDeCentavos(curso.precioCentavos),
            currency_id: MONEDA_PASARELA,
          },
        ],
        payer: { email: alumno.correo },
        external_reference: r.inscripcion.id,
        metadata: { tenant_id: tenant.id, curso_id: curso.id },
        back_urls: { success: retorno, pending: retorno, failure: retorno },
        // Mercado Pago rechaza auto_return con back_urls que no son https (demo local).
        ...(https ? { auto_return: "approved" } : {}),
        ...(notificacion ? { notification_url: notificacion } : {}),
        statement_descriptor: tenant.nombre.replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 22) || undefined,
      },
      requestOptions: { idempotencyKey: `pref-${r.inscripcion.id}-${curso.precioCentavos}-${Date.now()}` },
    });
    // Siempre init_point: con credenciales de prueba ya abre el checkout de prueba.
    if (!pref.init_point) return { ok: false, error: "No pudimos abrir el pago. Inténtalo de nuevo." };
    return { ok: true, url: pref.init_point };
  } catch (e) {
    console.error("[pagos] no se pudo crear la preferencia", e instanceof Error ? e.message : e);
    return { ok: false, error: "No pudimos abrir el pago. Inténtalo de nuevo en unos minutos." };
  }
}
