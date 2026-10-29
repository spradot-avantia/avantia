import type { Metadata } from "next";
import Link from "next/link";
import { BotonGoogle, FormSignup } from "../../../components/creador/auth/FormulariosAuth";
import { FormPostulacion } from "../../../components/creador/auth/FormPostulacion";
import { agendaHref } from "../../../components/marketing/content";
import { getUsuarioActual } from "../../../lib/auth/usuario";
import { cambiarCuentaAction } from "../../../lib/postulacion/actions";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const metadata: Metadata = { title: "Postula al programa fundador | Avantia" };

type Params = { searchParams: { editar?: string } };

// Paso 1: crear cuenta (correo y contraseña, o Google). Paso 2: formulario corto. Luego: confirmación con
// enlace a la agenda de 20 minutos (Google Calendar). ADR 011.
export default async function PostularPage({ searchParams }: Params) {
  const usuario = await getUsuarioActual();

  if (!usuario) {
    return (
      <>
        <p className="au-stepper">Paso 1 de 2</p>
        <h1 className="au-title">Postula al programa fundador</h1>
        <p className="au-lede">Crea tu cuenta con tu correo o con Google. Después completas un formulario corto, en menos de un minuto.</p>
        <FormSignup next="/postular" />
        <p className="au-sep" aria-hidden="true">o</p>
        <BotonGoogle next="/postular" />
        <p className="av-legal au-google-legal">
          Al continuar con Google aceptas los <a href="/terminos">términos y condiciones</a> y la <a href="/privacidad">política de privacidad</a>.
        </p>
        <p className="au-alt">
          ¿Ya tienes cuenta? <Link href="/login?next=%2Fpostular">Ingresar</Link>
        </p>
      </>
    );
  }

  const { data: postulacion } = await createSupabaseServerClient()
    .from("postulaciones")
    .select("nombre, url, alumnos, estado")
    .eq("user_id", usuario.id)
    .maybeSingle();

  const editable = !postulacion || postulacion.estado === "nueva";
  if (postulacion && !(editable && searchParams.editar === "1")) {
    return <Enviada editable={editable} />;
  }

  return (
    <>
      <p className="au-stepper">Paso 2 de 2</p>
      <h1 className="au-title">Cuéntanos de ti</h1>
      <FormPostulacion
        email={usuario.email ?? ""}
        inicial={{
          nombre: postulacion?.nombre ?? usuario.nombre ?? "",
          url: postulacion?.url ?? "",
          alumnos: postulacion?.alumnos ?? "",
        }}
      />
      <form action={cambiarCuentaAction}>
        <button type="submit" className="au-inline-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
          ¿No eres tú? Usar otra cuenta
        </button>
      </form>
    </>
  );
}

function Enviada({ editable }: { editable: boolean }) {
  const agenda = agendaHref();
  const externo = agenda.startsWith("http");
  return (
    <>
      <h1 className="au-title">Recibimos tu postulación</h1>
      <p className="au-lede">
        Revisaremos tu perfil y te escribiremos. Si el primer grupo ya está completo, quedarás en la lista de espera para el siguiente.
      </p>
      <div className="au-box">
        <b>¿Prefieres conversar antes?</b>
        <a className="av-btn av-btn--primary av-btn--lg" href={agenda} {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          Agenda 20 minutos
        </a>
      </div>
      {editable && (
        <a className="au-inline-link" href="/postular?editar=1">Corregir mis datos</a>
      )}
    </>
  );
}
