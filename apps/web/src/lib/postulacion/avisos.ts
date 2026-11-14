// Avisos que /admin/postulaciones muestra tras una acción (llegan como ?aviso=código).
// Van aparte de actions.ts porque un archivo "use server" solo puede exportar funciones async.
export const AVISOS_POSTULACION: Record<string, { texto: string; tono: "ok" | "alerta" }> = {
  contactada: { texto: "Marcada como contactada.", tono: "ok" },
  lista_espera: { texto: "Pasó a lista de espera.", tono: "ok" },
  descartada: { texto: "Postulación rechazada. Si la persona estaba aceptada, perdió el acceso.", tono: "ok" },
  aceptada_enviada: { texto: "Aceptada: enviamos el correo con la invitación para crear la cuenta.", tono: "ok" },
  aceptada_sin_correo: {
    texto:
      "Quedó aceptada, pero el correo de invitación NO salió (revisa RESEND_API_KEY y MAIL_FROM en el entorno). Avísale a la persona por otro medio o pulsa «Reenviar invitación» cuando el correo funcione.",
    tono: "alerta",
  },
  error: { texto: "No pudimos completar la acción. Inténtalo de nuevo.", tono: "alerta" },
};

export function avisoPostulacion(codigo: string | undefined) {
  return codigo ? AVISOS_POSTULACION[codigo] : undefined;
}
