// Reglas de la página pública de la academia (ADR 021). Módulo PURO (sin
// imports de servidor): lo usan el editor en el cliente, las Server Actions y
// el sitio público, y se prueba con vitest.
import { z } from "zod";

// ---------------------------------------------------------------- Tipos

export type ClaveTemplate = "programa" | "maestro" | "consultor";
export type AccionPagina = "inscribirme" | "conversacion";

export interface Testimonio {
  /** "Nombre y cargo", tal como lo escribe el creador. */
  nombre: string;
  texto: string;
  /** Cuándo el creador confirmó que tiene autorización para publicarlo. */
  autorizadoAt: string;
}

/** Borrador que edita el creador (y copia que se publica). */
export interface ContenidoPagina {
  template: ClaveTemplate | null;
  titulo: string | null;
  bajada: string | null;
  fotoUrl: string | null;
  accion: AccionPagina;
  cursosOcultos: string[];
  bioNombre: string | null;
  bioTexto: string | null;
  testimonios: Testimonio[];
  ejemploTestimoniosQuitado: boolean;
}

export interface PaginaAcademia {
  contenido: ContenidoPagina;
  publicado: ContenidoPagina | null;
  publicadaAt: string | null;
  dominioSolicitado: string | null;
  dominioToken: string | null;
  dominioSolicitadoAt: string | null;
}

export const CONTENIDO_VACIO: ContenidoPagina = {
  template: null,
  titulo: null,
  bajada: null,
  fotoUrl: null,
  accion: "inscribirme",
  cursosOcultos: [],
  bioNombre: null,
  bioTexto: null,
  testimonios: [],
  ejemploTestimoniosQuitado: false,
};

// ---------------------------------------------------------------- Lectura

/** Testimonios desde jsonb (snake_case en la base). */
export function mapTestimonios(v: unknown): Testimonio[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((t: any) => t && typeof t.nombre === "string" && typeof t.texto === "string")
    .map((t: any) => ({ nombre: t.nombre, texto: t.texto, autorizadoAt: String(t.autorizado_at ?? t.autorizadoAt ?? "") }));
}

/** Contenido guardado en `publicado` (jsonb, camelCase). Tolerante a filas viejas. */
export function contenidoDesdeJson(v: unknown): ContenidoPagina | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return {
    template: esClaveTemplate(o.template) ? o.template : null,
    titulo: typeof o.titulo === "string" ? o.titulo : null,
    bajada: typeof o.bajada === "string" ? o.bajada : null,
    fotoUrl: typeof o.fotoUrl === "string" ? o.fotoUrl : null,
    accion: o.accion === "conversacion" ? "conversacion" : "inscribirme",
    cursosOcultos: Array.isArray(o.cursosOcultos) ? o.cursosOcultos.filter((x): x is string => typeof x === "string") : [],
    bioNombre: typeof o.bioNombre === "string" ? o.bioNombre : null,
    bioTexto: typeof o.bioTexto === "string" ? o.bioTexto : null,
    testimonios: mapTestimonios(o.testimonios),
    ejemploTestimoniosQuitado: o.ejemploTestimoniosQuitado === true,
  };
}

// ---------------------------------------------------------------- Templates

export interface InfoTemplate {
  clave: ClaveTemplate;
  nombre: string;
  /** Una línea para la tarjeta de Mi academia. */
  corta: string;
  /** Descripción del resultado de la encuesta. */
  descripcion: string;
  /** Colores de la miniatura (la del botón es el color de la academia si es null). */
  mini: { fondo: string; titulo: string; linea: string; boton: string | null };
}

export const TEMPLATES: readonly InfoTemplate[] = [
  {
    clave: "programa",
    nombre: "Programa",
    corta: "Curso con fecha y reserva de cupo",
    descripcion: "Una página de curso con fecha de inicio, módulos semana a semana y una tarjeta de reserva siempre visible.",
    mini: { fondo: "#faf9f6", titulo: "#171717", linea: "#cfcbc0", boton: null },
  },
  {
    clave: "maestro",
    nombre: "Maestro",
    corta: "Tú eres la marca, una lección gratis",
    descripcion: "Una página donde tú eres la marca: fotos y videos tuyos, lecciones cortas y una lección gratis para empezar.",
    mini: { fondo: "#000000", titulo: "#f0566b", linea: "#3a3b40", boton: "#c5283d" },
  },
  {
    clave: "consultor",
    nombre: "Consultor",
    corta: "Venta a empresas y casos",
    descripcion: "Una página para vender a empresas: casos con resultados, avance del equipo y una conversación agendada como paso siguiente.",
    mini: { fondo: "#eeeeee", titulo: "#0a0a0a", linea: "#bdbdc4", boton: "#4700de" },
  },
];

export function infoTemplate(clave: ClaveTemplate): InfoTemplate {
  return TEMPLATES.find((t) => t.clave === clave) ?? TEMPLATES[0];
}

export const esClaveTemplate = (v: unknown): v is ClaveTemplate =>
  v === "programa" || v === "maestro" || v === "consultor";

/** Contenido de ejemplo de cada template: solo para la vista previa, nunca se publica. */
export interface EjemploTemplate {
  titulo: string;
  bajada: string;
  bioNombre: string;
  bioTexto: string;
  cifra: string;
  testimonios: { nombre: string; texto: string }[];
}

export const EJEMPLOS: Record<ClaveTemplate, EjemploTemplate> = {
  programa: {
    titulo: "Planificación de mantenimiento",
    bajada: "Curso de 6 semanas para planificadores y supervisores. Terminas con un programa semanal que tu equipo sí cumple.",
    bioNombre: "Matías Herrera",
    bioTexto: "18 años planificando mantención en minería del cobre y celulosa.",
    cifra: "4,8 de 5 · 640 alumnos formados",
    testimonios: [
      { nombre: "Diego F. · Supervisor mecánico", texto: "Armar el programa me tomaba la mañana del viernes. Ahora lo hago antes de almuerzo." },
      { nombre: "Andrea L. · Jefa de mantención", texto: "Es la primera vez que el turno de noche no recibe órdenes incompletas en todo un mes." },
      { nombre: "José R. · Planificador", texto: "Lo mejor son los casos. Decides como si fuera tu turno y después ves qué hizo el creador." },
    ],
  },
  maestro: {
    titulo: "Aprende vino con quien lo hace.",
    bajada: "Lecciones de 8 minutos con Rosario Undurraga, enóloga con 25 vendimias.",
    bioNombre: "Rosario Undurraga",
    bioTexto: "Enóloga con 25 vendimias en Colchagua. Enseña cata, venta y viñedo con el método de su bodega.",
    cifra: "+30 % en ventas · 2 importadores · 1.er lugar",
    testimonios: [
      { nombre: "Camila V. · Sommelier, Santiago", texto: "Aumenté la venta de vino por copa en tres meses. Ahora sé qué decir en la mesa." },
      { nombre: "Tomás R. · Exportación, Colchagua", texto: "Con el guion de presentación cerré mis dos primeros importadores en Brasil." },
    ],
  },
  consultor: {
    titulo: "Contratos y paradas sin sorpresas",
    bajada: "Capacita a tu equipo de minería con 20 años de faena. Cursos cortos, casos reales y avance visible para la empresa.",
    bioNombre: "Carolina Fuentes",
    bioTexto: "Ex gerenta de abastecimiento, ingeniera civil industrial. 20 años negociando contratos y paradas de planta.",
    cifra: "8 % ahorro en renovaciones · 24 compradores capacitados · 92 % terminaron el curso",
    testimonios: [
      { nombre: "Luis M. · Gerente de abastecimiento", texto: "Llegaban a la mesa sabiendo dónde ceder. Lo vimos en las renovaciones de ese mismo semestre." },
    ],
  },
};

// ---------------------------------------------------------------- Validación

export const TITULO_PAGINA_MAX = 90;
export const BAJADA_MAX = 240;
export const BIO_NOMBRE_MAX = 80;
export const BIO_TEXTO_MAX = 400;
export const TESTIMONIO_NOMBRE_MAX = 80;
export const TESTIMONIO_TEXTO_MAX = 300;
export const TESTIMONIOS_MAX = 6;

/** Texto opcional: "" o solo espacios se guarda como null. */
const textoOpcional = (max: number, campo: string) =>
  z
    .string()
    .trim()
    .max(max, `${campo} admite hasta ${max} caracteres.`)
    .transform((v) => (v ? v : null))
    .nullable();

export const contenidoSchema = z
  .object({
    titulo: textoOpcional(TITULO_PAGINA_MAX, "El título"),
    bajada: textoOpcional(BAJADA_MAX, "La bajada"),
    accion: z.enum(["inscribirme", "conversacion"]),
    cursosOcultos: z.array(z.string().uuid()).max(200),
    bioNombre: textoOpcional(BIO_NOMBRE_MAX, "Tu nombre"),
    bioTexto: textoOpcional(BIO_TEXTO_MAX, "La trayectoria"),
    ejemploTestimoniosQuitado: z.boolean(),
  })
  .partial()
  .strict();

export type CambiosContenido = z.input<typeof contenidoSchema>;

export const testimonioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Escribe el nombre y cargo de quien da el testimonio.")
    .max(TESTIMONIO_NOMBRE_MAX, `Admite hasta ${TESTIMONIO_NOMBRE_MAX} caracteres.`),
  texto: z
    .string()
    .trim()
    .min(10, "Escribe el testimonio (al menos 10 caracteres).")
    .max(TESTIMONIO_TEXTO_MAX, `El testimonio admite hasta ${TESTIMONIO_TEXTO_MAX} caracteres.`),
  autorizado: z.literal(true, { message: "Confirma que tienes autorización para publicarlo." }),
});

/** "Agendar una conversación" llega con la pestaña Contactos (diseño 04). */
export const ACCION_CONVERSACION_DISPONIBLE = false;

// ---------------------------------------------------------------- Pendientes

export type CampoPendiente = "template" | "titulo" | "bajada" | "bioNombre" | "bioTexto" | "testimonios";

export interface Pendiente {
  campo: CampoPendiente;
  mensaje: string;
}

/** Testimonios de ejemplo visibles: sin testimonios reales y sin haberlos quitado. */
export const muestraTestimoniosEjemplo = (c: ContenidoPagina) =>
  c.testimonios.length === 0 && !c.ejemploTestimoniosQuitado;

/** Lo que impide publicar: template sin elegir o partes con contenido de ejemplo. */
export function pendientesPagina(c: ContenidoPagina): Pendiente[] {
  const p: Pendiente[] = [];
  if (!c.template) p.push({ campo: "template", mensaje: "Elige un template." });
  if (!c.titulo) p.push({ campo: "titulo", mensaje: "Escribe el título de la portada." });
  if (!c.bajada) p.push({ campo: "bajada", mensaje: "Escribe la bajada de la portada." });
  if (!c.bioNombre) p.push({ campo: "bioNombre", mensaje: "Escribe tu nombre en «Sobre ti»." });
  if (!c.bioTexto) p.push({ campo: "bioTexto", mensaje: "Escribe tu trayectoria en «Sobre ti»." });
  if (muestraTestimoniosEjemplo(c)) {
    p.push({ campo: "testimonios", mensaje: "Quita los testimonios y cifras de ejemplo o agrega uno real." });
  }
  return p;
}

/** Copia comparable del contenido (orden estable de claves). */
function huella(c: ContenidoPagina): string {
  return JSON.stringify([
    c.template,
    c.titulo,
    c.bajada,
    c.fotoUrl,
    c.accion,
    [...c.cursosOcultos].sort(),
    c.bioNombre,
    c.bioTexto,
    c.testimonios.map((t) => [t.nombre, t.texto]),
    c.ejemploTestimoniosQuitado,
  ]);
}

export type EstadoPagina = "sin_publicar" | "publicada" | "cambios_sin_publicar";

export function estadoPagina(p: Pick<PaginaAcademia, "contenido" | "publicado">): EstadoPagina {
  if (!p.publicado) return "sin_publicar";
  return huella(p.contenido) === huella(p.publicado) ? "publicada" : "cambios_sin_publicar";
}

// ---------------------------------------------------------------- Encuesta

type Puntos = Partial<Record<ClaveTemplate, number>>;

export interface OpcionEncuesta {
  texto: string;
  detalle?: string;
  puntos: Puntos;
  /** Por qué suma a su template (se muestra en el resultado). */
  porque: string;
}

export interface PreguntaEncuesta {
  titulo: string;
  opciones: OpcionEncuesta[];
}

export const ENCUESTA: readonly PreguntaEncuesta[] = [
  {
    titulo: "¿Quién te compra principalmente?",
    opciones: [
      { texto: "Profesionales que quieren avanzar en su trabajo", detalle: "Pagan con su plata o la de su empresa.", puntos: { programa: 2, consultor: 1 }, porque: "Le vendes a profesionales que buscan un resultado en su trabajo." },
      { texto: "Personas interesadas en mi tema", detalle: "Aficionados, emprendedores o público general.", puntos: { maestro: 3 }, porque: "Le vendes a un público amplio que llega por el tema y por ti." },
      { texto: "Empresas que capacitan a sus equipos", detalle: "Me compra un gerente o el área de personas.", puntos: { consultor: 3 }, porque: "Le vendes a empresas, que necesitan ver casos y avance del equipo." },
      { texto: "Personas y empresas por igual", puntos: { programa: 1, consultor: 2 }, porque: "Le vendes a personas y empresas, y la página habla a los dos." },
    ],
  },
  {
    titulo: "¿Cómo es tu curso principal?",
    opciones: [
      { texto: "Un programa de varias semanas con un grupo", detalle: "Fechas de inicio, sesiones en vivo y tareas.", puntos: { programa: 3 }, porque: "Tu curso tiene grupos con fecha, así que la reserva de cupo va al centro." },
      { texto: "Lecciones grabadas y cortas", detalle: "Cada alumno las ve a su ritmo.", puntos: { maestro: 3 }, porque: "Tus lecciones son grabadas y cortas, ideales para mostrar en mosaicos." },
      { texto: "Un taller o programa para un equipo", detalle: "Lo adapto a cada empresa.", puntos: { consultor: 3 }, porque: "Haces talleres para equipos, así que la página lleva a una conversación." },
      { texto: "Todavía lo estoy definiendo", puntos: { programa: 1, maestro: 1 }, porque: "Aún defines tu curso; este template se adapta fácil." },
    ],
  },
  {
    titulo: "¿Qué convence más a quien te compra?",
    opciones: [
      { texto: "Lo que va a saber hacer al terminar", detalle: "Un resultado concreto, paso a paso.", puntos: { programa: 3, consultor: 1 }, porque: "Lo que convence es el resultado, y la página lo muestra módulo a módulo." },
      { texto: "Mi nombre y mi trayectoria", detalle: "Me conocen o me siguen por cómo hago las cosas.", puntos: { maestro: 3 }, porque: "Tu nombre convence, así que tu cara y tu historia van primero." },
      { texto: "Resultados en otras empresas", detalle: "Ahorro, menos errores o casos de clientes.", puntos: { consultor: 3 }, porque: "Convencen los resultados en empresas, que se muestran con números." },
    ],
  },
  {
    titulo: "¿Cuántas fotos y videos tuyos tienes para mostrar?",
    opciones: [
      { texto: "Muchos, de buena calidad", detalle: "Retratos, videos enseñando o en terreno.", puntos: { maestro: 3 }, porque: "Tienes buen material visual para llenar el carrusel y los mosaicos." },
      { texto: "Algunos", detalle: "Una buena foto y un par de videos.", puntos: { programa: 2 }, porque: "Con una buena foto y un par de videos alcanza." },
      { texto: "Pocos, prefiero mostrar resultados y datos", puntos: { consultor: 2, programa: 1 }, porque: "Pocas fotos no son problema: la página se apoya en datos y casos." },
    ],
  },
  {
    titulo: "¿Qué quieres que haga quien visita tu página?",
    opciones: [
      { texto: "Reservar un cupo en el próximo grupo", puntos: { programa: 3 }, porque: "El botón principal será reservar un cupo." },
      { texto: "Ver una lección gratis y después inscribirse", puntos: { maestro: 3 }, porque: "El botón principal será ver una lección gratis." },
      { texto: "Agendar una conversación conmigo", puntos: { consultor: 3 }, porque: "El botón principal será agendar una conversación." },
    ],
  },
];

export type RespuestasEncuesta = (number | null)[];

export interface PuntajeEncuesta {
  puntos: Record<ClaveTemplate, number>;
  /** De mayor a menor; en empate gana el que sugiere la primera respuesta. */
  orden: ClaveTemplate[];
  total: number;
}

const CLAVES: ClaveTemplate[] = ["programa", "maestro", "consultor"];
const DESEMPATE_POR_COMPRADOR: ClaveTemplate[] = ["programa", "maestro", "consultor", "consultor"];

export function puntajeEncuesta(respuestas: RespuestasEncuesta): PuntajeEncuesta {
  const puntos: Record<ClaveTemplate, number> = { programa: 0, maestro: 0, consultor: 0 };
  respuestas.forEach((r, i) => {
    const op = r == null ? undefined : ENCUESTA[i]?.opciones[r];
    if (!op) return;
    for (const k of CLAVES) puntos[k] += op.puntos[k] ?? 0;
  });
  const desempate = respuestas[0] == null ? "programa" : (DESEMPATE_POR_COMPRADOR[respuestas[0]] ?? "programa");
  const orden = [...CLAVES].sort((a, b) => puntos[b] - puntos[a] || Number(b === desempate) - Number(a === desempate));
  return { puntos, orden, total: puntos.programa + puntos.maestro + puntos.consultor };
}

/** Razones (de las respuestas) que sumaron al template ganador. */
export function razonesEncuesta(respuestas: RespuestasEncuesta, ganador: ClaveTemplate): string[] {
  return respuestas
    .map((r, i) => (r == null ? null : ENCUESTA[i]?.opciones[r]))
    .filter((o): o is OpcionEncuesta => !!o && (o.puntos[ganador] ?? 0) > 0)
    .map((o) => o.porque);
}

// ---------------------------------------------------------------- Dominio

/** Valores de Vercel para conectar un dominio (confirmar en el proyecto antes de usar). */
export const DNS_CNAME_DESTINO = "cname.vercel-dns.com";
export const DNS_IP_APEX = "76.76.21.21";

/** "https://Academia.MiSitio.cl/" -> "academia.misitio.cl". */
export const limpiarDominio = (v: string) =>
  v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");

export function validarDominio(
  dominio: string,
  dominioRaiz: string,
): { ok: true; dominio: string } | { ok: false; error: string } {
  const d = limpiarDominio(dominio);
  if (!d) return { ok: false, error: "Escribe el dominio que quieres conectar." };
  if (d.length > 253 || !/^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(d) || d.split(".").some((p) => p.startsWith("-") || p.endsWith("-"))) {
    return { ok: false, error: "Revisa el formato. Debe verse como academia.tudominio.cl, sin espacios." };
  }
  const raiz = limpiarDominio(dominioRaiz);
  if (raiz && (d === raiz || d.endsWith(`.${raiz}`))) {
    return { ok: false, error: "Esa dirección ya es de la plataforma. Usa un dominio tuyo." };
  }
  return { ok: true, dominio: d };
}

export interface RegistroDns {
  tipo: "CNAME" | "A" | "TXT";
  nombre: string;
  valor: string;
}

/** Registros que el creador agrega en su proveedor (subdominio -> CNAME; raíz -> A). */
export function registrosDns(dominio: string, token: string): RegistroDns[] {
  const partes = dominio.split(".");
  const esSub = partes.length > 2;
  const principal: RegistroDns = esSub
    ? { tipo: "CNAME", nombre: partes.slice(0, -2).join("."), valor: DNS_CNAME_DESTINO }
    : { tipo: "A", nombre: "@", valor: DNS_IP_APEX };
  const nombreTxt = esSub ? `_avantia.${partes.slice(0, -2).join(".")}` : "_avantia";
  return [principal, { tipo: "TXT", nombre: nombreTxt, valor: `avantia-verificacion=${token}` }];
}

// ---------------------------------------------------------------- Foto de portada

export const PORTADA_MAX_BYTES = 2 * 1024 * 1024;
export const PORTADA_MIN_ANCHO = 1200;
export const PORTADA_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;

export function validarMetaPortada(m: { tipo: string; bytes: number; ancho: number; alto: number }): string | null {
  if (!(PORTADA_TIPOS as readonly string[]).includes(m.tipo)) return "Formato no admitido. Usa JPG, PNG o WebP.";
  if (m.bytes > PORTADA_MAX_BYTES) return "La foto pesa más de 2 MB. Reduce su tamaño y vuelve a intentarlo.";
  if (m.ancho < PORTADA_MIN_ANCHO) return `La foto debe medir al menos ${PORTADA_MIN_ANCHO.toLocaleString("es-CL")} px de ancho.`;
  if (m.ancho < m.alto) return "Usa una foto horizontal (más ancha que alta).";
  return null;
}