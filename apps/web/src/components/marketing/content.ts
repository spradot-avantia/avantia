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
  { icon: "dots", title: "Comunidad del curso", text: "Un espacio para que tus alumnos conversen y se apoyen." },
  { icon: "video", title: "Sesiones en vivo", text: "Seminarios y encuentros dentro de tu academia." },
  { icon: "award", title: "Certificaciones", text: "Certificados con tu marca para tus alumnos al completar un curso." },
  { icon: "trophy", title: "Gamificación", text: "Puntos, insignias y desafíos para que tus alumnos mantengan el ritmo." },
  { icon: "videoEdit", title: "Edición de videos asistida por IA", text: "Herramientas de IA que te ayudan a editar tus clases en video." },
] as const;

export const FAQS: { q: string; a: string; pend?: boolean }[] = [
  { q: "¿Tiene costo participar?", a: "No. Tienes 30 días gratis y no pedimos tarjeta. Al terminar, decides si continúas con un plan, con precio preferente." },
  { q: "¿Qué pasa cuando terminan los 30 días?", a: "No se cobra nada automáticamente, porque no tenemos tu tarjeta. Te contactamos para conversar si quieres seguir." },
  { q: "¿Necesito conocimientos técnicos?", a: "Te acompañamos en la configuración de tu academia, incluida la conexión de tu dominio." },
  { q: "¿Cuánto cuestan los planes?", a: "Pendiente. Opción: “Estamos definiendo los planes junto con el primer grupo. Como fundador, accedes a un precio preferente durante [período].”", pend: true },
  { q: "¿Cobran comisión por las ventas de mis cursos?", a: "Pendiente.", pend: true },
  { q: "¿Con qué medios de pago pueden pagar mis alumnos?", a: "Pendiente.", pend: true },
  { q: "¿Quién emite la boleta o factura a mis alumnos?", a: "Pendiente.", pend: true },
  { q: "¿Mis contenidos y los datos de mis alumnos siguen siendo míos?", a: "Pendiente: confirmar con asesoría legal la propiedad y si existe exportación de datos.", pend: true },
  { q: "¿Puedo usar mi propio dominio?", a: "Sí." },
  { q: "¿Qué pasa si no quedo en el primer grupo?", a: "Quedas en la lista de espera y te avisamos cuando abramos el siguiente." },
  { q: "¿Cómo creo mi cuenta?", a: "Con tu cuenta de Google. Para creadores no hay correo y contraseña: es un solo paso y tu acceso queda protegido por Google." },
];
