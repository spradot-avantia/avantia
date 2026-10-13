/** Estado que devuelven las Server Actions de auth a los formularios (useFormState). */
export interface EstadoForm {
  ok?: boolean;
  /** Mensaje general (error o aviso). */
  mensaje?: string;
  errores?: Record<string, string>;
  /** Para repoblar campos no sensibles tras un error (nunca la contraseña). */
  valores?: { email?: string; nombre?: string };
}

export const ESTADO_INICIAL: EstadoForm = {};
