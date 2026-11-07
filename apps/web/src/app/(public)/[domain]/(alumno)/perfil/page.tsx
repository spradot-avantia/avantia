import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormContrasena, FormCorreo, FormNombre } from "../../../../../components/alumno/FormulariosPerfil";
import {
  IconoCalendario,
  IconoCandado,
  IconoCorreo,
  IconoEscudo,
  IconoEstrella,
  IconoRayo,
  IconoTrofeo,
  IconoUsuario,
  TituloIcono,
} from "../../../../../components/ui/Iconos";
import { getTenantPublico } from "../../../../../lib/alumno/contexto";
import { inscripcionesDe } from "../../../../../lib/alumno/inscripciones";
import { resumenDelAlumno } from "../../../../../lib/alumno/progreso";
import { getAlumnoActual } from "../../../../../lib/alumno/sesion";
import { nivelDe } from "../../../../../lib/alumno/xp";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? (p[p.length - 1][0] ?? "") : "")).toUpperCase() || "?";
}

export default async function PerfilPage() {
  const [tenant, alumno] = await Promise.all([getTenantPublico(), getAlumnoActual()]);
  if (!tenant) notFound();
  if (!alumno) redirect("/ingresar?next=%2Fperfil");

  const [inscripciones, { data: ficha }] = await Promise.all([
    inscripcionesDe(tenant.id, alumno.id),
    supabaseAdmin.from("alumnos").select("created_at").eq("tenant_id", tenant.id).eq("id", alumno.id).maybeSingle(),
  ]);
  const activas = inscripciones.filter((i) => i.estado === "activa");
  const cursos = await resumenDelAlumno(
    tenant.id,
    alumno.id,
    activas.map((i) => ({ cursoId: i.cursoId, estado: i.estado })),
  );
  const xp = cursos.reduce((n, c) => n + c.desglose.xp, 0);
  const nivel = nivelDe(xp);
  const terminados = cursos.filter((c) => c.desglose.cursoCompleto).length;
  const desde = ficha?.created_at
    ? new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(new Date(ficha.created_at))
    : null;

  return (
    <>
      <section className="al-stack">
        <TituloIcono nivel={1} icono={<IconoUsuario tam={22} />}>
          Mi perfil
        </TituloIcono>
      </section>

      <section className="al-card al-perfil" aria-labelledby="per-t">
        <h2 id="per-t" className="av-sr-only">
          Tu cuenta
        </h2>
        <div className="al-perfil__top">
          <span className="al-perfil__avatar" aria-hidden="true">
            {iniciales(alumno.nombre)}
          </span>
          <div className="al-perfil__datos">
            <p className="al-perfil__nombre">{alumno.nombre}</p>
            <p className="al-muted al-perfil__fila">
              <IconoCorreo tam={16} /> {alumno.correo}
            </p>
            <p className="al-muted al-perfil__fila">
              <IconoEscudo tam={16} /> {alumno.verificado ? "Correo confirmado" : "Correo sin confirmar"}
            </p>
            {desde && (
              <p className="al-muted al-perfil__fila">
                <IconoCalendario tam={16} /> Estudias aquí desde {desde}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="al-perfil__stats" aria-label="Tu resumen">
        <div className="al-stat">
          <IconoEstrella tam={26} />
          <strong>Nivel {nivel.nivel}</strong>
          <span className="al-muted">Tu nivel</span>
        </div>
        <div className="al-stat">
          <IconoRayo tam={26} />
          <strong>{xp} XP</strong>
          <span className="al-muted">Experiencia</span>
        </div>
        <div className="al-stat">
          <IconoTrofeo tam={26} />
          <strong>{terminados}</strong>
          <span className="al-muted">{terminados === 1 ? "Curso completado" : "Cursos completados"}</span>
        </div>
      </section>
      <p className="al-muted">
        <Link href="/progreso">Ver mi progreso e insignias</Link>
      </p>

      <section className="al-card" aria-labelledby="nom-t">
        <TituloIcono id="nom-t" icono={<IconoUsuario tam={20} />}>
          Tus datos
        </TituloIcono>
        <FormNombre nombre={alumno.nombre} />
      </section>
      <section className="al-card" aria-labelledby="mail-t">
        <TituloIcono id="mail-t" icono={<IconoCorreo tam={20} />}>
          Correo
        </TituloIcono>
        <FormCorreo correo={alumno.correo} />
      </section>


      <section className="al-card" aria-labelledby="pass-t">
        <TituloIcono id="pass-t" icono={<IconoCandado tam={20} />}>
          Contraseña
        </TituloIcono>
        <FormContrasena />
      </section>
    </>
  );
}
