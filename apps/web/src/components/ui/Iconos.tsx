import type { ReactNode } from "react";

// Íconos de la plataforma (alumno y creador): duotono (relleno suave + trazo), heredan el color de la academia
// (currentColor) y son decorativos (aria-hidden): el texto siempre acompaña.
interface Props {
  tam?: number;
  className?: string;
  /** Grosor del trazo (por defecto 1.7). */
  grosor?: number;
}

function Svg({ tam = 24, className, grosor = 1.7, girar, children }: Props & { girar?: number; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tam}
      height={tam}
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      style={{ verticalAlign: "-0.2em", ...(girar ? { transform: `rotate(${girar}deg)` } : {}) }}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const SUAVE = { fill: "currentColor", fillOpacity: 0.16 } as const;

/** Cohete: avance y progreso. */
export function IconoCohete(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 3c3.6 2 5.5 5.6 5.5 9.5l-2 3h-7l-2-3C6.5 8.6 8.4 5 12 3z" {...SUAVE} />
      <circle cx="12" cy="10" r="1.7" />
      <path d="M9.5 15.5 8 19l3-1.2M14.5 15.5 16 19l-3-1.2M12 17.5V21" />
    </Svg>
  );
}

/** Medalla: insignias. */
export function IconoMedalla(p: Props) {
  return (
    <Svg {...p}>
      <path d="M8.5 3h7l-2 5h-3l-2-5z" {...SUAVE} />
      <circle cx="12" cy="14.5" r="5.5" {...SUAVE} />
      <path d="m12 11.8 1 2 2.2.3-1.6 1.6.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.6 2.2-.3 1-2z" />
    </Svg>
  );
}

/** Trofeo: curso completado. */
export function IconoTrofeo(p: Props) {
  return (
    <Svg {...p}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" {...SUAVE} />
      <path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4l.5 3h-5l.5-3z" />
    </Svg>
  );
}

/** Rayo: experiencia (XP). */
export function IconoRayo(p: Props) {
  return (
    <Svg {...p}>
      <path d="M13 2.8 5.5 13h5l-1 8.2L18 10.5h-5.2L13 2.8z" {...SUAVE} />
    </Svg>
  );
}

/** Estrella: nivel. */
export function IconoEstrella(p: Props) {
  return (
    <Svg {...p}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5z" {...SUAVE} />
    </Svg>
  );
}

/** Libros: avance por curso. */
export function IconoLibros(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5v-15z" {...SUAVE} />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5v-15z" />
    </Svg>
  );
}

/** Diana: lo que dominas. */
export function IconoDiana(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" {...SUAVE} />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </Svg>
  );
}

/** Usuario: perfil. */
export function IconoUsuario(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8.5" r="3.7" {...SUAVE} />
      <path d="M5 20c.6-3.7 3.4-5.8 7-5.8s6.4 2.1 7 5.8" />
    </Svg>
  );
}

/** Sobre: correo. */
export function IconoCorreo(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...SUAVE} />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </Svg>
  );
}

/** Candado: contraseña y seguridad. */
export function IconoCandado(p: Props) {
  return (
    <Svg {...p}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" {...SUAVE} />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2" />
    </Svg>
  );
}

/** Escudo con visto: correo verificado. */
export function IconoEscudo(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 3 5 5.8v5.5c0 4.2 2.8 7.6 7 9.2 4.2-1.6 7-5 7-9.2V5.8L12 3z" {...SUAVE} />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </Svg>
  );
}

/** Calendario: miembro desde. */
export function IconoCalendario(p: Props) {
  return (
    <Svg {...p}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" {...SUAVE} />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </Svg>
  );
}

/** Llama: constancia (se usa en el perfil). */
export function IconoLlama(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 3c.5 3-3.5 4.6-3.5 8.6 0 1.4.6 2.4 1.5 3 0-1.6.9-2.6 2-3.4.2 1.4 1.5 2 2.2 3.4.6-1 .8-2.2.5-3.5 1.5 1.3 2.3 3 2.3 4.5 0 3-2.4 5.1-5 5.1S7 19.7 7 16.6C7 11.5 11.3 9 12 3z" {...SUAVE} />
    </Svg>
  );
}

/** Título de sección con ícono en una burbuja del color de la academia. */
export function TituloIcono({ icono, children, nivel = 2, id }: { icono: ReactNode; children: ReactNode; nivel?: 1 | 2; id?: string }) {
  const H = nivel === 1 ? "h1" : "h2";
  return (
    <H id={id} className="al-titulo-ico">
      <span className="al-ico-burbuja" aria-hidden="true">
        {icono}
      </span>
      {children}
    </H>
  );
}

// ---- Acciones y estados (sustituyen glifos de texto como ✓ ✕ ▴ ▾ ← →) ----

export function IconoCheck({ tam = 14, className, grosor = 2.4 }: Props) {
  return (
    <Svg tam={tam} className={className} grosor={grosor}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function IconoEquis({ tam = 14, className, grosor = 2.4 }: Props) {
  return (
    <Svg tam={tam} className={className} grosor={grosor}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

type Dir = "arriba" | "abajo" | "izquierda" | "derecha";
const ROT: Record<Dir, number> = { derecha: 0, abajo: 90, izquierda: 180, arriba: 270 };

/** Chevron « > » girado según la dirección. */
export function IconoChevron({ dir = "derecha", ...p }: Props & { dir?: Dir }) {
  return (
    <Svg {...p} girar={ROT[dir]}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Svg>
  );
}

/** Flecha con asta, para acciones («Siguiente →», subir, bajar). */
export function IconoFlecha({ dir = "derecha", ...p }: Props & { dir?: Dir }) {
  return (
    <Svg {...p} girar={ROT[dir]}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  );
}

export function IconoPapelera(p: Props) {
  return (
    <Svg {...p}>
      <path d="M6.5 8h11l-.8 11a1.5 1.5 0 0 1-1.5 1.4H8.8a1.5 1.5 0 0 1-1.5-1.4L6.5 8z" {...SUAVE} />
      <path d="M4.5 8h15M9.5 8V5.5h5V8M10.2 11.5v5M13.8 11.5v5" />
    </Svg>
  );
}

// ---- Tipos de contenido ----

export function IconoVideo(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" {...SUAVE} />
      <path d="m10.5 9.5 4 2.5-4 2.5v-5z" fill="currentColor" />
    </Svg>
  );
}

export function IconoTexto(p: Props) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" {...SUAVE} />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </Svg>
  );
}

export function IconoDocumento(p: Props) {
  return (
    <Svg {...p}>
      <path d="M7 3.5h6.5L18.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z" {...SUAVE} />
      <path d="M13.5 3.5v5h5M8.5 13h7M8.5 16.5h5" />
    </Svg>
  );
}

export function IconoEnlace(p: Props) {
  return (
    <Svg {...p}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
    </Svg>
  );
}

export function IconoReloj(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" {...SUAVE} />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconoRepetir(p: Props) {
  return (
    <Svg {...p}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5" />
    </Svg>
  );
}

/** Panel lateral (mostrar/ocultar el contenido del curso). */
export function IconoPanel(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" {...SUAVE} />
      <path d="M9.5 4.5v15" />
    </Svg>
  );
}

/** Lista: resumen del módulo. */
export function IconoLista(p: Props) {
  return (
    <Svg {...p}>
      <path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
    </Svg>
  );
}

export type TipoContenido = "video" | "texto" | "documento";
export const ROTULO_TIPO: Record<TipoContenido, string> = { video: "Video", texto: "Texto", documento: "Documento" };

/** Ícono del formato de una lección. Decorativo: el rótulo siempre va en texto. */
export function IconoTipoLeccion({ tipo, ...p }: Props & { tipo: TipoContenido }) {
  if (tipo === "video") return <IconoVideo {...p} />;
  if (tipo === "texto") return <IconoTexto {...p} />;
  return <IconoDocumento {...p} />;
}
