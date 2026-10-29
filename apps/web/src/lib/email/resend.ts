/**
 * Envío de correo transaccional con Resend (API REST, sin SDK). Solo backend.
 * Sin RESEND_API_KEY no envía y devuelve false: quien llama decide si eso es
 * un error (la postulación se guarda igual y se ve en /admin/postulaciones).
 */
export function escaparHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function enviarCorreo(opts: {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[correo] falta RESEND_API_KEY: no se envió", opts.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Avantia <contacto@goavantia.com>",
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo,
      }),
    });
    if (!res.ok) {
      console.error("[correo] Resend respondió", res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[correo] no se pudo enviar", e instanceof Error ? e.message : e);
    return false;
  }
}
