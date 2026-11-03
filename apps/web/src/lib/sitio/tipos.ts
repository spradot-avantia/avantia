// Datos que reciben los templates del sitio público (Programa, Maestro y
// Consultor). Módulo PURO: lo usan el sitio público (servidor) y la vista
// previa del editor (cliente).
import {
  EJEMPLOS,
  muestraTestimoniosEjemplo,
  type AccionPagina,
  type ClaveTemplate,
  type ContenidoPagina,
} from "../creador/paginaReglas";

export interface CursoSitio {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  modalidad: "a_su_ritmo" | "con_fechas";
  fechaInicio: string | null;
  /** Ya formateado ("$320.000", "Gratis") o null si no corresponde mostrarlo. */
  precio: string | null;
  totalModulos: number;
  totalLecciones: number;
}

export interface AcademiaSitio {
  nombre: string;
  frase: string | null;
  colorPrimario: string;
  logoUrl: string | null;
  logoModo: "logo_y_nombre" | "solo_logo";
}

/** Qué partes se muestran con contenido de ejemplo (solo en la vista previa). */
export interface MarcasEjemplo {
  titulo: boolean;
  bajada: boolean;
  bioNombre: boolean;
  bioTexto: boolean;
  testimonios: boolean;
}

export interface DatosSitio {
  template: ClaveTemplate;
  academia: AcademiaSitio;
  titulo: string;
  bajada: string;
  fotoUrl: string | null;
  accion: AccionPagina;
  bioNombre: string;
  bioTexto: string;
  testimonios: { nombre: string; texto: string }[];
  /** Cifra de ejemplo ("4,8 de 5 · …"); solo existe con los testimonios de ejemplo. */
  cifra: string | null;
  cursos: CursoSitio[];
  ejemplo: MarcasEjemplo;
  /** "vista": vista previa del creador (botones sin destino, ejemplo marcado). */
  modo: "publico" | "vista";
}

const SIN_EJEMPLO: MarcasEjemplo = { titulo: false, bajada: false, bioNombre: false, bioTexto: false, testimonios: false };

/**
 * Arma lo que muestra un template. En "vista", los campos vacíos se completan
 * con el ejemplo del template (y se marcan). En "publico" nunca hay ejemplo:
 * la página solo se publica sin pendientes (ver pendientesPagina).
 */
export function construirDatosSitio(opts: {
  contenido: ContenidoPagina;
  template: ClaveTemplate;
  academia: AcademiaSitio;
  cursos: CursoSitio[];
  modo: "publico" | "vista";
}): DatosSitio {
  const { contenido: c, template, academia, modo } = opts;
  const ej = EJEMPLOS[template];
  const vista = modo === "vista";
  const marcas: MarcasEjemplo = vista
    ? {
        titulo: !c.titulo,
        bajada: !c.bajada,
        bioNombre: !c.bioNombre,
        bioTexto: !c.bioTexto,
        testimonios: muestraTestimoniosEjemplo(c),
      }
    : SIN_EJEMPLO;
  const ocultos = new Set(c.cursosOcultos);
  return {
    template,
    academia,
    titulo: c.titulo ?? (vista ? ej.titulo : academia.nombre),
    bajada: c.bajada ?? (vista ? ej.bajada : academia.frase ?? ""),
    fotoUrl: c.fotoUrl,
    accion: c.accion,
    bioNombre: c.bioNombre ?? (vista ? ej.bioNombre : ""),
    bioTexto: c.bioTexto ?? (vista ? ej.bioTexto : ""),
    testimonios: marcas.testimonios ? ej.testimonios : c.testimonios.map((t) => ({ nombre: t.nombre, texto: t.texto })),
    cifra: marcas.testimonios ? ej.cifra : null,
    cursos: opts.cursos.filter((x) => !ocultos.has(x.id)),
    ejemplo: marcas,
    modo,
  };
}

/** Precio para mostrar: 0 -> "Gratis"; si no, moneda del tenant (CLP por defecto). */
export function formatearPrecio(centavos: number | null | undefined, moneda: string | null | undefined): string | null {
  if (centavos == null) return null;
  if (centavos <= 0) return "Gratis";
  const cur = (moneda || "CLP").toUpperCase();
  const sinDecimales = cur === "CLP" || cur === "COP" || cur === "ARS";
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: sinDecimales ? 0 : 2,
    }).format(centavos / 100);
  } catch {
    return `$${Math.round(centavos / 100).toLocaleString("es-CL")}`;
  }
}

/** Texto corto del curso: "A su ritmo · 3 módulos · 5 lecciones". */
export function resumenCurso(c: CursoSitio): string {
  const partes = [c.modalidad === "con_fechas" ? fechaGrupo(c.fechaInicio) : "A su ritmo"];
  if (c.totalModulos) partes.push(`${c.totalModulos} ${c.totalModulos === 1 ? "módulo" : "módulos"}`);
  if (c.totalLecciones) partes.push(`${c.totalLecciones} ${c.totalLecciones === 1 ? "lección" : "lecciones"}`);
  return partes.join(" · ");
}

function fechaGrupo(fecha: string | null): string {
  if (!fecha) return "Con fechas";
  const d = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "Con fechas";
  return `Empieza el ${d.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`;
}

/** Destino del botón principal: la ficha del curso si hay uno, si no la lista. */
export function destinoAccion(d: Pick<DatosSitio, "cursos">): string {
  return d.cursos.length === 1 ? `/curso/${d.cursos[0].slug}` : "#cursos";
}