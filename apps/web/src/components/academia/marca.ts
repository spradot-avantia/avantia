// Lógica compartida de la marca de una academia: tipos, colores, iniciales,
// validación del logo y ajuste de contraste. La usan el onboarding y Mi academia,
// así ambos aplican exactamente las mismas reglas.

/** Dominio de la plataforma para los subdominios de cada academia (ej. juan.goavantia.com). */
export const DOMINIO_PLATAFORMA = "goavantia.com";

/** Destino del CNAME que el creador apunta a Avantia para usar su dominio propio. */
export const DNS_CNAME_DESTINO = "cname.goavantia.com";
/** TODO: IP fija del borde (solo para dominios raíz, sin subdominio). */
export const DNS_IP = "[IP DE AVANTIA]";

export const COLORES = ["#0F766E", "#2563EB", "#7C3AED", "#B45309", "#BE185D", "#0A1029", "#15803D", "#0369A1"] as const;

export type Logo = {
  url: string;
  nombre: string;
  /** Texto bajo el nombre, ej. "512 × 512 px · 48 KB". */
  info: string;
  /** Ancho ÷ alto. Más de 1,8 se considera logo ancho. */
  proporcion: number;
};

export type MarcaAcademia = {
  nombre: string;
  frase: string;
  area: string;
  iniciales: string;
  /** Color que se usa en botones y enlaces (ya ajustado para contraste). */
  color: string;
  /** Color que eligió el creador, si se tuvo que ajustar. */
  colorOriginal?: string;
  logo: Logo | null;
  mostrar: "logo-y-nombre" | "solo-logo";
  /** Subdominio en la plataforma, ej. "contratosmineros". */
  subdominio: string;
};

export const MARCA_EJEMPLO: MarcaAcademia = {
  nombre: "Contratos Mineros",
  frase: "Contratos en minería, explicados por quien los firma",
  area: "Minería",
  iniciales: "CM",
  color: "#0F766E",
  logo: null,
  mostrar: "logo-y-nombre",
  subdominio: "contratosmineros",
};

/** "Contratos Mineros" → "CM"; "Fotografía" → "FO"; vacío → "TA". */
export function inicialesDe(nombre: string): string {
  const n = nombre.trim();
  const palabras = n.split(/\s+/).filter(Boolean);
  const ini = palabras.length > 1 ? palabras[0][0] + palabras[1][0] : n.slice(0, 2) || "TA";
  return ini.toUpperCase();
}

export const LOGO_TIPOS = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
export const LOGO_ACCEPT = LOGO_TIPOS.join(",");
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_MIN_PX = 128;

export type ResultadoLogo = { ok: true; logo: Logo; archivo: File } | { ok: false; error: string };

/**
 * Revisa formato, peso y tamaño del archivo y devuelve una vista previa (object URL).
 * Quien recibe el logo es responsable de liberar la URL con URL.revokeObjectURL.
 */
export function revisarLogo(archivo: File): Promise<ResultadoLogo> {
  if (!LOGO_TIPOS.includes(archivo.type)) {
    return Promise.resolve({ ok: false, error: "Usa un archivo PNG, JPG, SVG o WebP." });
  }
  if (archivo.size > LOGO_MAX_BYTES) {
    const mb = (archivo.size / 1048576).toFixed(1).replace(".", ",");
    return Promise.resolve({ ok: false, error: `El archivo pesa ${mb} MB. Usa uno de 2 MB o menos.` });
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      const esSvg = archivo.type === "image/svg+xml";
      if (!esSvg && Math.min(w, h) < LOGO_MIN_PX) {
        URL.revokeObjectURL(url);
        resolve({ ok: false, error: `La imagen mide ${w} × ${h} px. Usa una de al menos ${LOGO_MIN_PX} px por lado.` });
        return;
      }
      const kb = Math.max(1, Math.round(archivo.size / 1024));
      resolve({
        ok: true,
        archivo,
        logo: {
          url,
          nombre: archivo.name,
          info: `${esSvg ? "SVG" : `${w} × ${h} px`} · ${kb} KB`,
          proporcion: w && h ? w / h : 1,
        },
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "No pudimos leer la imagen. Prueba con otro archivo." });
    };
    img.src = url;
  });
}

/** Los logos más anchos que 1,8:1 se muestran solos (sin el nombre) por defecto. */
export const esLogoAncho = (logo: Logo | null) => !!logo && logo.proporcion > 1.8;

/**
 * Oscurece el color hacia la tinta de la marca hasta que el texto blanco encima
 * alcance contraste 4,5:1 (WCAG AA). Devuelve el mismo color si ya cumple.
 */
export function ajustarContraste(hex: string): string {
  const canales = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = (rgb: number[]) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const contrasteConBlanco = (rgb: number[]) => 1.05 / (lum(rgb) + 0.05);
  const tinta = [10, 16, 41];
  const base = canales(hex);
  let rgb = base;
  let paso = 0;
  while (contrasteConBlanco(rgb) < 4.5 && paso < 20) {
    paso += 1;
    rgb = base.map((v, i) => Math.round(v + (tinta[i] - v) * paso * 0.05));
  }
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export type ResultadoDominio = { ok: true; dominio: string } | { ok: false; error: string };

/** Limpia lo que escribe el creador ("https://Academia.MiSitio.cl/" → "academia.misitio.cl"). */
export const limpiarDominio = (v: string) =>
  v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

export function validarDominio(dominio: string): ResultadoDominio {
  if (!dominio) return { ok: false, error: "Escribe el dominio que quieres conectar." };
  if (!/^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/.test(dominio)) {
    return { ok: false, error: "Revisa el formato. Debe verse como academia.tudominio.cl, sin espacios." };
  }
  const plataforma = DOMINIO_PLATAFORMA.replace(/\./g, "\\.");
  if (new RegExp(`(^|\\.)${plataforma}$`).test(dominio)) {
    return { ok: false, error: "Ese dominio ya es de Avantia. Usa uno tuyo." };
  }
  return { ok: true, dominio };
}