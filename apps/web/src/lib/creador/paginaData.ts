// Datos para las pantallas de la página de la academia (Mi academia, encuesta,
// editor y "Ver template"). Lee con el cliente de sesión (RLS) y filtra por tenant.
import { formatearPrecio, type AcademiaSitio, type CursoSitio } from "../sitio/tipos";
import { listarCursos } from "./cursos";
import { getPagina } from "./pagina";
import type { PaginaAcademia } from "./paginaReglas";
import { getCreadorContext } from "./tenantActual";
import type { TenantCreador } from "./types";

export interface CursoEditorPagina extends CursoSitio {
  estado: "borrador" | "publicado";
}

export interface DatosPaginaCreador {
  tenant: TenantCreador;
  pagina: PaginaAcademia;
  academia: AcademiaSitio;
  /** Todos los cursos (publicados y borradores) para "Cursos que se muestran". */
  cursos: CursoEditorPagina[];
  /** Dirección del sitio: dominio propio conectado o <subdominio>.<raíz>. */
  direccion: string;
  /** Dirección incluida en la plataforma (<subdominio>.<raíz>). */
  direccionBase: string;
  dominioRaiz: string;
}

export type CargaPagina = { estado: "ok"; datos: DatosPaginaCreador } | { estado: "sin_academia" } | { estado: "error" };

export async function cargarPaginaCreador(): Promise<CargaPagina> {
  const ctx = await getCreadorContext();
  if (!ctx) return { estado: "sin_academia" };
  const { tenant, db } = ctx;
  try {
    const [pagina, cursos, precios] = await Promise.all([
      getPagina(),
      listarCursos(),
      db.from("cursos").select("id, precio_centavos").eq("tenant_id", tenant.id),
    ]);
    const precio = new Map((precios.data ?? []).map((p) => [p.id as string, p.precio_centavos as number]));
    const dominioRaiz = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "avantia.app";
    const direccionBase = `${tenant.subdomain}.${dominioRaiz}`;
    return {
      estado: "ok",
      datos: {
        tenant,
        pagina,
        academia: {
          nombre: tenant.nombre,
          frase: tenant.frase,
          colorPrimario: tenant.colorPrimario,
          logoUrl: tenant.logoUrl,
          logoModo: tenant.logoModo,
          tipografia: tenant.tipografia,
          forma: tenant.forma,
        },
        cursos: cursos.map((c) => ({
          id: c.id,
          slug: c.slug,
          titulo: c.titulo,
          descripcion: c.descripcion,
          modalidad: c.modalidad,
          fechaInicio: c.fechaInicio,
          precio: formatearPrecio(precio.get(c.id), tenant.moneda),
          totalModulos: c.totalModulos,
          totalLecciones: c.totalLecciones,
          estado: c.estado,
        })),
        direccion: tenant.customDomain ?? direccionBase,
        direccionBase,
        dominioRaiz,
      },
    };
  } catch (e) {
    console.error("[pagina] no se pudo cargar", e);
    return { estado: "error" };
  }
}

/** Cursos que el sitio público puede mostrar (solo publicados). */
export const cursosPublicados = (cursos: CursoEditorPagina[]): CursoSitio[] => cursos.filter((c) => c.estado === "publicado");