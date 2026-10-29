// Contenido de la landing. Todo texto "pendiente" se marca con `pend: true` o
// con corchetes [..] y se renderiza con la clase .av-todo (línea punteada).

export const THEMES = [
  { c: "#c2410c", name: "Escuela Ámbar", initial: "Á", course: "Fotografía de producto", m: ["Luz y encuadre", "Edición básica", "Fotos que venden"] },
  { c: "#0f766e", name: "Estudio Brújula", initial: "B", course: "Liderazgo para nuevos jefes", m: ["Tu primer equipo", "Conversaciones difíciles", "Delegar sin miedo"] },
  { c: "#0e7490", name: "Academia Mar", initial: "M", course: "Finanzas para independientes", m: ["Ordena tus ingresos", "Tu presupuesto mensual", "Impuestos sin sustos"] },
] as const;

export const DEMO_SWATCHES = [
  { c: "#0e7490", label: "Azul petróleo" },
  { c: "#c2410c", label: "Coral" },
  { c: "#0f766e", label: "Verde" },
  { c: "#9d174d", label: "Ciruela" },
  { c: "#334155", label: "Grafito" },
] as const;

export const STEPS_CREATOR = [
  { title: "Configura tu marca", desc: "Sube tu logo, elige tus colores y conecta tu dominio." },
  { title: "Sube tu curso", desc: "Carga tus contenidos y ordénalos como los enseñas." },
  { title: "Invita y cobra", desc: "Tus alumnos se inscriben y pagan dentro de tu academia." },
];

export const STEPS_STUDENT = [
  { title: "Recibe tu correo", desc: "Con el nombre y la marca de tu academia." },
  { title: "Entra a tu dominio", desc: "Tus alumnos aprenden en tu dirección web." },
  { title: "Paga y accede", desc: "Sin salir de tu academia." },
];

export const FUTURE = [
  { icon: "bar", title: "Progreso y logros", text: "Que tus alumnos vean su avance y celebren cada módulo." },
  { icon: "card", title: "Pasarela de pago", text: "Cobra a tus alumnos y emite sus documentos tributarios desde tu academia." },
  { icon: "dots", title: "Comunidad del curso", text: "Un espacio para que tus alumnos conversen y se apoyen." },
  { icon: "video", title: "Sesiones en vivo", text: "Seminarios y encuentros dentro de tu academia." },
  { icon: "award", title: "Certificaciones", text: "Certificados con tu marca para tus alumnos al completar un curso." },
  { icon: "trophy", title: "Gamificación", text: "Puntos, insignias y desafíos para que tus alumnos mantengan el ritmo." },
  { icon: "videoEdit", title: "Edición de videos asistida por IA", text: "Herramientas de IA que te ayudan a editar tus clases en video." },
  { icon: "chat", title: "Marketing digital", text: "Gestiona tus campañas y sigue su rendimiento en un solo lugar." },
] as const;

// FAQ de la landing V3 (reunión 2026-10-13).
export const FAQS: { q: string; a: string; pend?: boolean }[] = [
  { q: "¿Tiene costo participar?", a: "No. El programa es gratis y no pedimos tarjeta. Al terminar, decides si continúas con un plan, con un precio preferente durante los dos primeros meses." },
  { q: "¿Qué pasa cuando termina el programa?", a: "No se cobra nada automáticamente, porque no tenemos tu tarjeta. Te contactamos para conversar si quieres seguir con un plan a precio preferente." },
  { q: "¿Necesito conocimientos técnicos?", a: "La plataforma está diseñada para que no necesites conocimientos de programación. Igual te acompañamos en la configuración de tu academia, incluida la conexión de tu dominio si hace falta." },
  { q: "¿Cuánto cuestan los planes?", a: "Estamos definiendo los planes junto con el primer grupo. Como fundador, accedes a un precio preferente durante los dos primeros meses.", pend: true },
  { q: "¿Cobran comisión por las ventas de mis cursos?", a: "No. No cobramos comisión por las ventas de tus cursos." },
  { q: "¿Con qué medios de pago pueden pagar mis alumnos?", a: "Pendiente.", pend: true },
  { q: "¿Quién emite la boleta o factura a mis alumnos?", a: "Tu academia emite la boleta o factura directamente a sus alumnos. Lo que viene en Avantia es ayudarte con ese documento tributario." },
  { q: "¿Mis contenidos y los datos de mis alumnos siguen siendo míos?", a: "Sí. Tus contenidos y los datos de tus alumnos siguen siendo tuyos. Nosotros nos encargamos de almacenarlos y protegerlos por ti." },
  { q: "¿Puedo usar mi propio dominio?", a: "Sí, esa es la idea." },
  { q: "¿Qué pasa si no quedo en el primer grupo?", a: "Quedas en la lista de espera y te avisamos cuando abramos el siguiente." },
  { q: "¿Cómo postulo?", a: "Creas tu cuenta con tu correo y una contraseña, o con Google, y luego completas un formulario corto. Si ya tienes cuenta, solo ingresas." },
];

/** Datos de contacto y enlaces públicos de la landing. */
export const CONTACTO = "contacto@goavantia.com";

/**
 * Página de reservas de Google Calendar ("Agenda de citas") para la reunión de
 * 20 minutos. Se configura en NEXT_PUBLIC_AGENDA_URL; sin ella, cae a un correo.
 */
export function agendaHref(): string {
  return process.env.NEXT_PUBLIC_AGENDA_URL?.trim() || `mailto:${CONTACTO}?subject=${encodeURIComponent("Agendar reunión de 20 minutos")}`;
}
