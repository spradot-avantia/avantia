"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completarOnboardingAction, guardarMarcaAction } from "../../../lib/creador/actions";
import { comprobarSubdominioAction, crearAcademiaAction } from "../../../lib/creador/actionsAlta";
import { derivarSubdominio, errorSubdominio, normalizarSubdominio } from "../../../lib/creador/alta";
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

type EstadoSub = "idle" | "revisando" | "libre" | "no_disponible";

/** tenant = null: la academia aún no existe y el paso 2 la crea (RQ-02). */
export function OnboardingFlow({ tenant, dominioRaiz }: { tenant: TenantCreador | null; dominioRaiz: string }) {
  const router = useRouter();
  const [paso, setPaso] = useState("1");
  const [nombre, setNombre] = useState(tenant?.nombre ?? "");
  const [frase, setFrase] = useState(tenant?.frase ?? "");
  const [area, setArea] = useState(tenant?.area ?? "");
  const [color, setColor] = useState(tenant?.colorPrimario ?? "#2563eb");
  const [modo, setModo] = useState<LogoModo>(tenant?.logoModo ?? "logo_y_nombre");
  const { logo, seleccionar, quitar } = useLogo(tenant?.logoUrl ?? null);
  // Subdominio: se deriva del nombre hasta que la persona lo edita a mano.
  const creada = tenant?.subdomain ?? null;
  const [subCreado, setSubCreado] = useState<string | null>(creada);
  const [sub, setSub] = useState(creada ?? "");
  const [subEditado, setSubEditado] = useState(false);
  const [estadoSub, setEstadoSub] = useState<EstadoSub>("idle");
  const [motivoSub, setMotivoSub] = useState<string | null>(null);
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

  const subActual = subCreado ?? (subEditado ? normalizarSubdominio(sub) : derivarSubdominio(nombre));

  // Validación en vivo con debounce. Solo se pregunta "¿libre?" (sin sugerencias).
  useEffect(() => {
    if (subCreado || paso !== "2") return;
    const formato = errorSubdominio(subActual);
    if (!subActual || formato) {
      setEstadoSub(subActual ? "no_disponible" : "idle");
      setMotivoSub(subActual ? formato : null);
      return;
    }
    setEstadoSub("revisando");
    setMotivoSub(null);
    let vigente = true;
    const t = setTimeout(async () => {
      const r = await comprobarSubdominioAction(subActual);
      if (!vigente) return;
      if (!r.ok) {
        setEstadoSub("idle");
        setMotivoSub(r.error);
      } else if (r.data.disponible) {
        setEstadoSub("libre");
      } else {
        setEstadoSub("no_disponible");
        setMotivoSub(r.data.motivo ?? "Ese nombre ya está tomado, elige otro.");
      }
    }, 450);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [subActual, subCreado, paso]);

  function siguienteDesde2() {
    if (nombre.trim().length < 2) {
      setErrorNombre("El nombre necesita al menos 2 caracteres. Escribe cómo se llama tu academia.");
      return;
    }
    setErrorNombre(null);
    setError(null);
    if (!subCreado) {
      const formato = errorSubdominio(subActual);
      if (formato || estadoSub === "no_disponible") {
        setMotivoSub(formato ?? motivoSub ?? "Ese nombre ya está tomado, elige otro.");
        setEstadoSub("no_disponible");
        return;
      }
    }
    iniciar(async () => {
      if (subCreado) {
        // Ya existe (volvió desde el paso 3 o retomó el onboarding): solo se actualizan los datos.
        const r = await guardarMarcaAction({ nombre, frase, area });
        if (!r.ok) {
          if (r.campos?.nombre) setErrorNombre(r.campos.nombre);
          setError(r.error);
          return;
        }
      } else {
        const r = await crearAcademiaAction({ nombre, subdomain: subActual, frase, area });
        if (!r.ok) {
          if (r.campos?.subdomain) {
            setEstadoSub("no_disponible");
            setMotivoSub(r.campos.subdomain);
          } else if (r.campos?.nombre) {
            setErrorNombre(r.campos.nombre);
          } else {
            setError(r.error);
          }
          return;
        }
        setSubCreado(r.data.subdomain);
        setSub(r.data.subdomain);
      }
      setPaso("3");
    });
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
      router.push("/inicio");
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
          <Field
            id="ob-sub"
            label="Dirección de tu academia"
            ayuda={subCreado ? "Es la dirección donde tus estudiantes entran a tus cursos." : "Es donde tus estudiantes entrarán a tus cursos. Puedes cambiarla ahora; después queda fija."}
            error={estadoSub === "no_disponible" && !subCreado ? motivoSub : null}
          >
            {subCreado ? (
              <p className="mk-ob__dir">
                <strong>{tenant?.customDomain ?? `${subCreado}.${dominioRaiz}`}</strong>
              </p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Input
                    id="ob-sub"
                    value={subEditado ? sub : subActual}
                    maxLength={40}
                    invalido={estadoSub === "no_disponible"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{ flex: "1 1 160px", minWidth: 0 }}
                    onChange={(e) => {
                      setSubEditado(true);
                      setSub(e.target.value);
                    }}
                  />
                  <span className="mk-ayuda">.{dominioRaiz}</span>
                </div>
                <span className="cr-field__hint" role="status" aria-live="polite">
                  {estadoSub === "revisando" && "Revisando disponibilidad…"}
                  {estadoSub === "libre" && `Disponible: ${subActual}.${dominioRaiz}`}
                </span>
              </>
            )}
          </Field>
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
        <Callout tono="danger" titulo="No pudimos continuar">
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
        {paso === "2" && (
          <Button onClick={siguienteDesde2} disabled={pendiente || (!subCreado && estadoSub === "revisando")}>
            {pendiente ? "Creando tu academia…" : "Continuar"}
          </Button>
        )}
        {paso === "3" && (
          <Button onClick={entrar} disabled={pendiente}>
            {pendiente ? "Guardando…" : "Entrar a mi espacio"}
          </Button>
        )}
      </div>
    </div>
  );
}
