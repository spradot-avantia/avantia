// Correos al alumno con la marca de la academia (nunca la de Avantia).
import { enviarCorreo, escaparHtml } from "../email/resend";
import type { Tenant } from "../../types/tenant";

interface Plantilla {
  tenant: Tenant;
  para: string;
  asunto: string;
  titulo: string;
  parrafos: string[];
  boton: string;
  url: string;
  nota: string;
}

export function armarCorreo(p: Plantilla): { html: string; text: string } {
  const color = /^#[0-9a-f]{6}$/i.test(p.tenant.theme.colorPrimario) ? p.tenant.theme.colorPrimario : "#2563eb";
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1d23">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px">
<tr><td style="font-size:15px;font-weight:700;color:${color}">${escaparHtml(p.tenant.nombre)}</td></tr>
<tr><td style="padding-top:16px;font-size:22px;font-weight:700">${escaparHtml(p.titulo)}</td></tr>
${p.parrafos.map((t) => `<tr><td style="padding-top:12px;font-size:15px;line-height:1.5">${escaparHtml(t)}</td></tr>`).join("\n")}
<tr><td style="padding-top:20px"><a href="${escaparHtml(p.url)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:8px">${escaparHtml(p.boton)}</a></td></tr>
<tr><td style="padding-top:16px;font-size:13px;color:#6b7280;line-height:1.5">${escaparHtml(p.nota)}<br>Si el botón no funciona, copia este enlace: ${escaparHtml(p.url)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${p.tenant.nombre}\n\n${p.titulo}\n\n${p.parrafos.join("\n\n")}\n\n${p.boton}: ${p.url}\n\n${p.nota}`;
  return { html, text };
}

/** Envía y, fuera de producción, deja el enlace en el log si no hay proveedor de correo. */
export async function enviarCorreoAlumno(p: Plantilla): Promise<boolean> {
  const { html, text } = armarCorreo(p);
  const ok = await enviarCorreo({ to: [p.para], subject: p.asunto, html, text });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info(`[correo alumno · solo desarrollo] ${p.asunto} -> ${p.para}: ${p.url}`);
  }
  return ok;
}
