// Catálogo ÚNICO de eventos de analítica (ADR 040). Los nombres y propiedades salen de acá:
// ni el cliente ni el servidor inventan eventos sueltos. Sin datos personales (ni correo ni
// nombre): solo ids de la academia, del curso y de la lección.

export interface PropsBase {
  curso_id?: string;
  modulo_id?: string;
  leccion_id?: string;
}

/** Eventos del navegador: solo se envían con el consentimiento de «analítica». */
export interface EventosCliente {
  leccion_vista: PropsBase & { tipo_leccion: string };
  /** Segundos con la pestaña visible, acumulados; se envía una vez al salir de la lección. */
  leccion_tiempo_activo: PropsBase & { activo_seg: number };
  /** Hasta dónde bajó en una lección de texto (25, 50, 75, 100). */
  leccion_scroll: PropsBase & { profundidad: number };
  video_click: PropsBase;
  quiz_pregunta_vista: PropsBase & { pregunta_id: string; modo: string; posicion: number };
  quiz_respuesta: PropsBase & { pregunta_id: string; modo: string; acierto: boolean; ms_hasta_responder: number; cambios_de_respuesta: number };
  quiz_abandono: PropsBase & { modo: string; respondidas: number; total: number };
  repaso_iniciado: { preguntas: number };
  entrega_iniciada: PropsBase & { tarea_id: string };
  entrega_enviada: PropsBase & { tarea_id: string; ms_desde_inicio: number };
  /** Señales de fricción (rage click, error de interfaz). */
  clic_rabioso: { ruta: string; elemento: string };
  error_ui: { ruta: string; mensaje: string };
}

export type NombreEventoCliente = keyof EventosCliente;

/** Eventos de servidor (hechos de negocio). Se envían aunque no haya cookies: no usan el navegador. */
export interface EventosServidor {
  cuenta_creada: PropsBase;
  inscripcion_creada: PropsBase;
  inscripcion_activada: PropsBase;
  leccion_abierta: PropsBase;
  leccion_completada: PropsBase;
  curso_completado: PropsBase;
  intento_quiz: PropsBase;
  correo_cambiado: PropsBase;
  pago_registrado: PropsBase;
}

export type NombreEventoServidor = keyof EventosServidor;
