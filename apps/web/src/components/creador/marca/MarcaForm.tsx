"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { guardarMarcaAction } from "../../../lib/creador/actions";
import { iniciales } from "../../../lib/creador/color";
import type { LogoModo, TenantCreador } from "../../../lib/creador/types";
import { modoLogoSugerido } from "../../../lib/creador/validacion";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input } from "../Field";
import { ColorPicker } from "./ColorPicker";
import { cumpleAASobreBlanco } from "./contraste";
import { IndicadorGuardado } from "./IndicadorGuardado";
import { LogoUploader } from "./LogoUploader";
import { ModoLogo } from "./ModoLogo";
import { PreviewMarca } from "./PreviewMarca";
import { aplicarLogo, useLogo } from "./useLogo";
import "../creador.css";
import "./marca.css";

interface Valores {
  nombre: string;
  frase: string;
  area: string;
  color: string;
  modo: LogoModo;
}

function desde(t: TenantCreador): Valores {
  return { nombre: t.nombre, frase: t.frase ?? "", area: t.area ?? "", color: t.colorPrimario, modo: t.logoModo };
}

/** Mi academia > Marca: nombre, logo, cómo se muestra, color. Guardar/descartar. */
export function MarcaForm({ tenant }: { tenant: TenantCreador }) {
  const router = useRouter();
  const [base, setBase] = useState<TenantCreador>(tenant);
  const [v, setV] = useState<Valores>(() => desde(tenant));
  const { logo, seleccionar, quitar, reiniciar } = useLogo(tenant.logoUrl);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const b = desde(base);
  const sucio =
    v.nombre !== b.nombre ||
    v.frase !== b.frase ||
    v.area !== b.area ||
    v.color.toLowerCase() !== b.color.toLowerCase() ||
    v.modo !== b.modo ||
    !!logo.file ||
    logo.quitado;

  function cambiar<K extends keyof Valores>(k: K, valor: Valores[K]) {
    setV((p) => ({ ...p, [k]: valor }));
    setGuardadoOk(false);
  }

  function descartar() {
    setV(desde(base));
    reiniciar(base.logoUrl);
    setErrores({});
    setErrorGeneral(null);
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    const nuevos: Record<string, string> = {};
    if (v.nombre.trim().length < 2) nuevos.nombre = "El nombre necesita al menos 2 caracteres. Escribe cómo se llama tu academia.";
    if (!cumpleAASobreBlanco(v.color)) nuevos.color = "Este color es muy claro para leerse sobre blanco. Usa el ajuste automático o elige uno más oscuro.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    iniciar(async () => {
      const rl = await aplicarLogo(logo);
      if (rl && !rl.ok) {
        setErrorGeneral(rl.error);
        return;
      }
      const hayLogo = !!(logo.file || (logo.url && !logo.quitado));
      const modo: LogoModo = hayLogo ? v.modo : "logo_y_nombre";
      const r = await guardarMarcaAction({
        nombre: v.nombre,
        frase: v.frase,
        area: v.area,
        colorPrimario: v.color,
        logoModo: modo,
      });
      if (!r.ok) {
        setErrores(r.campos ?? {});
        setErrorGeneral(r.error);
        return;
      }
      setBase(r.data);
      setV(desde(r.data));
      reiniciar(r.data.logoUrl);
      setGuardadoOk(true);
      router.refresh();
    });
  }

  const hayLogo = !!logo.url;
  const logoParaVista = logo.url;

  return (
    <form className="mk-card" onSubmit={guardar} noValidate aria-labelledby="mk-marca-h">
      <div className="mk-card__head">
        <h2 className="mk-h2" id="mk-marca-h">
          Marca
        </h2>
        <IndicadorGuardado sucio={sucio} guardando={pendiente} />
      </div>

      <Field id="mk-nombre" label="Nombre de la academia" error={errores.nombre}>
        <Input
          id="mk-nombre"
          value={v.nombre}
          maxLength={60}
          invalido={!!errores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          autoComplete="organization"
        />
      </Field>

      <Field id="mk-frase" label="Frase" opcional error={errores.frase} ayuda="Una línea que explique qué enseñas. Se muestra bajo tu nombre.">
        <Input id="mk-frase" value={v.frase} maxLength={100} conAyuda invalido={!!errores.frase} onChange={(e) => cambiar("frase", e.target.value)} />
      </Field>

      <Field id="mk-area" label="Área" opcional error={errores.area}>
        <Input id="mk-area" value={v.area} maxLength={60} invalido={!!errores.area} onChange={(e) => cambiar("area", e.target.value)} />
      </Field>

      <div className="cr-field">
        <span className="cr-field__label">
          Logo de la academia <span className="cr-field__opt">(opcional)</span>
        </span>
        <LogoUploader
          logo={logo}
          onSeleccion={(file, url, info, ratio) => {
            seleccionar(file, url, info, ratio);
            cambiar("modo", modoLogoSugerido(ratio, 1));
          }}
          onQuitar={() => {
            quitar();
            cambiar("modo", "logo_y_nombre");
          }}
        />
        {!hayLogo && (
          <span className="cr-field__hint">
            Sin logo usamos las iniciales “{iniciales(v.nombre)}” sobre tu color. Puedes subirlo cuando quieras.
          </span>
        )}
      </div>

      {hayLogo && <ModoLogo value={v.modo} onChange={(m) => cambiar("modo", m)} />}

      <div className="cr-field">
        <span className="cr-field__label">Color de tu academia</span>
        <ColorPicker value={v.color} onChange={(c) => cambiar("color", c)} />
        {errores.color && (
          <span className="cr-field__error" role="alert">
            {errores.color}
          </span>
        )}
        <span className="cr-field__hint">Se usa en botones, enlaces y la página que verán tus estudiantes.</span>
      </div>

      <PreviewMarca nombre={v.nombre} frase={v.frase} logoUrl={logoParaVista} logoModo={v.modo} color={v.color} />

      {errorGeneral && (
        <Callout tono="danger" titulo="No pudimos guardar los cambios">
          {errorGeneral} Revisa los datos e inténtalo de nuevo; tus cambios siguen aquí.
        </Callout>
      )}
      {guardadoOk && !sucio && <Callout tono="success" titulo="Cambios guardados" />}

      <div className="mk-acciones">
        <Button type="submit" disabled={!sucio || pendiente}>
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </Button>
        {sucio && (
          <Button variante="ghost" onClick={descartar} disabled={pendiente}>
            Descartar cambios
          </Button>
        )}
      </div>
    </form>
  );
}
