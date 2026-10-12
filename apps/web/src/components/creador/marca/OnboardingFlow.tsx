"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completarOnboardingAction } from "../../../lib/creador/actions";
import { iniciales, textoSobre } from "../../../lib/creador/color";
import type { LogoModo, TenantCreador } from "../../../lib/creador/types";
import { modoLogoSugerido } from "../../../lib/creador/validacion";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input } from "../Field";
import { Stepper } from "../Stepper";
import { ColorPicker } from "./ColorPicker";
import { cumpleAASobreBlanco } from "./contraste";
import { LogoUploader } from "./LogoUploader";
import { ModoLogo } from "./ModoLogo";
import { PreviewMarca } from "./PreviewMarca";
import { aplicarLogo, useLogo } from "./useLogo";
import "../creador.css";
import "./marca.css";

const PASOS = [
  { id: "1", titulo: "Bienvenida" },
  { id: "2", titulo: "Tu academia" },
  { id: "3", titulo: "Color y logo" },
];

const TITULOS: Record<string, { h: string; p: string }> = {
  "1": { h: "Te damos la bienvenida", p: "En tres pasos dejas lista tu academia. Tarda unos minutos y puedes cambiarlo todo después." },
  "2": { h: "Tu academia", p: "Cuéntanos cómo se llama y a qué se dedica. Así la reconocerán tus estudiantes." },
  "3": { h: "Color y logo", p: "Así reconocerán tus estudiantes tu academia. Puedes cambiarlo cuando quieras en Mi academia." },
};

export function OnboardingFlow({ tenant, dominioRaiz }: { tenant: TenantCreador; dominioRaiz: string }) {
  const router = useRouter();
  const [paso, setPaso] = useState("1");
  const [nombre, setNombre] = useState(tenant.nombre);
  const [frase, setFrase] = useState(tenant.frase ?? "");
  const [area, setArea] = useState(tenant.area ?? "");
  const [color, setColor] = useState(tenant.colorPrimario);
  const [modo, setModo] = useState<LogoModo>(tenant.logoModo);
  const { logo, seleccionar, quitar } = useLogo(tenant.logoUrl);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorColor, setErrorColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);
  const primero = useRef(true);

  // Al cambiar de paso, el foco va al título (lectores de pantalla y teclado).
  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    titulo.current?.focus();
    window.scrollTo({ top: 0 });
  }, [paso]);

  function siguienteDesde2() {
    if (nombre.trim().length < 2) {
      setErrorNombre("El nombre necesita al menos 2 caracteres. Escribe cómo se llama tu academia.");
      return;
    }
    setErrorNombre(null);
    setPaso("3");
  }

  function entrar() {
    setError(null);
    if (!cumpleAASobreBlanco(color)) {
      setErrorColor("Este color es muy claro para leerse sobre blanco. Usa el ajuste automático o elige uno más oscuro.");
      return;
    }
    setErrorColor(null);
    iniciar(async () => {
      const rl = await aplicarLogo(logo);
      if (rl && !rl.ok) {
        setError(rl.error);
        return;
      }
      const hayLogo = !!(logo.file || (logo.url && !logo.quitado));
      const r = await completarOnboardingAction({
        nombre,
        frase,
        area,
        colorPrimario: color,
        logoModo: hayLogo ? modo : "logo_y_nombre",
      });
      if (!r.ok) {
        if (r.campos?.nombre) {
          setErrorNombre(r.campos.nombre);
          setPaso("2");
        }
        setError(r.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  const t = TITULOS[paso];
  const estiloMarca = { ["--cr-brand" as string]: color, ["--cr-on-brand" as string]: textoSobre(color) };

  return (
    <div className="mk-ob" style={estiloMarca}>
      <div className="mk-ob__marca">Avantia</div>
      <Stepper pasos={PASOS} actual={paso} etiqueta="Pasos de configuración" />

      <div>
        <h1 className="mk-ob__titulo" ref={titulo} tabIndex={-1}>
          {t.h}
        </h1>
        <p className="mk-ayuda" style={{ marginTop: 6 }}>
          {t.p}
        </p>
      </div>

      {paso === "1" && (
        <div className="mk-card">
          <section aria-labelledby="ob-hoy">
            <h2 className="mk-h2" id="ob-hoy">
              Qué puedes hacer hoy
            </h2>
            <ul className="mk-lista" style={{ marginTop: 10 }}>
              <li>Crear cursos con módulos y lecciones (video por enlace y texto).</li>
              <li>Registrar a tus estudiantes y dar acceso por invitación o por enlace.</li>
              <li>Publicar un curso y compartir su enlace.</li>
              <li>Poner tu logo y tu color para que se vea como tu academia.</li>
            </ul>
          </section>
          <section aria-labelledby="ob-pronto">
            <h2 className="mk-h2" id="ob-pronto">
              Aún no disponible
            </h2>
            <ul className="mk-lista mk-lista--no" style={{ marginTop: 10 }}>
              <li>Sesiones en vivo (próximamente).</li>
              <li>Cobros, comunidad y estructurar cursos con IA.</li>
            </ul>
          </section>
        </div>
      )}

      {paso === "2" && (
        <div className="mk-card">
          <Field id="ob-nombre" label="Nombre de tu academia" error={errorNombre}>
            <Input
              id="ob-nombre"
              value={nombre}
              maxLength={60}
              invalido={!!errorNombre}
              autoComplete="organization"
              onChange={(e) => {
                setNombre(e.target.value);
                setErrorNombre(null);
              }}
            />
          </Field>
          <Field id="ob-frase" label="Frase" opcional ayuda="Una línea que explique qué enseñas." contador={`${frase.length}/100`}>
            <Input id="ob-frase" value={frase} maxLength={100} conAyuda onChange={(e) => setFrase(e.target.value)} />
          </Field>
          <Field id="ob-area" label="Área o tema" opcional>
            <Input id="ob-area" value={area} maxLength={60} onChange={(e) => setArea(e.target.value)} />
          </Field>
          <div className="cr-field">
            <span className="cr-field__label">Dirección de tu academia</span>
            <p className="mk-ob__dir">
              <strong>
                {tenant.customDomain ?? `${tenant.subdomain}.${dominioRaiz}`}
              </strong>
            </p>
            <span className="cr-field__hint">Es la dirección donde tus estudiantes entran a tus cursos.</span>
          </div>
        </div>
      )}

      {paso === "3" && (
        <div className="mk-card">
          <div className="cr-field">
            <span className="cr-field__label">
              Logo de la academia <span className="cr-field__opt">(opcional)</span>
            </span>
            <LogoUploader
              logo={logo}
              onSeleccion={(file, url, info, ratio) => {
                seleccionar(file, url, info, ratio);
                setModo(modoLogoSugerido(ratio, 1));
              }}
              onQuitar={() => {
                quitar();
                setModo("logo_y_nombre");
              }}
            />
            {!logo.url && (
              <span className="cr-field__hint">
                ¿Aún no tienes logo? Sigue sin él: usamos tus iniciales (“{iniciales(nombre)}”) y lo subes después.
              </span>
            )}
          </div>
          {logo.url && <ModoLogo value={modo} onChange={setModo} />}
          <div className="cr-field">
            <span className="cr-field__label">Color de tu academia</span>
            <ColorPicker value={color} onChange={setColor} />
            {errorColor && (
              <span className="cr-field__error" role="alert">
                {errorColor}
              </span>
            )}
          </div>
          <PreviewMarca nombre={nombre} frase={frase} logoUrl={logo.url} logoModo={modo} color={color} />
        </div>
      )}

      {error && (
        <Callout tono="danger" titulo="No pudimos terminar la configuración">
          {error} Tus datos siguen aquí: inténtalo de nuevo.
        </Callout>
      )}

      <div className="mk-ob__nav">
        {paso === "1" ? (
          <span />
        ) : (
          <Button variante="ghost" onClick={() => setPaso(paso === "3" ? "2" : "1")} disabled={pendiente}>
            Volver
          </Button>
        )}
        {paso === "1" && <Button onClick={() => setPaso("2")}>Empezar</Button>}
        {paso === "2" && <Button onClick={siguienteDesde2}>Continuar</Button>}
        {paso === "3" && (
          <Button onClick={entrar} disabled={pendiente}>
            {pendiente ? "Guardando…" : "Entrar a mi espacio"}
          </Button>
        )}
      </div>
    </div>
  );
}
