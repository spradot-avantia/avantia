// Landing pública de Avantia (Server Component). Diseño: mockup "programa fundador".
// Client Components solo donde hay estado: BrandStage, DemoTabs, CTAs (Ctas) y el sheet.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { BrandStage } from "./BrandStage";
import { DemoTabs } from "./DemoTabs";
import { ApplyButton, EmailCapture, StickyBar } from "./Ctas";
import { SignupProvider } from "./SignupContext";
import { FAQS } from "./content";
import "./landing.css";

function Logo({ mark, word }: { mark: number; word: number }) {
  return (
    <>
      <Image src="/brand/avantia-mark.png" alt="" width={581} height={364} style={{ height: mark, width: "auto" }} priority />
      <Image src="/brand/avantia-wordmark.png" alt="avantia" width={739} height={159} style={{ height: word, width: "auto" }} priority />
    </>
  );
}

function Trust({ size }: { size: number }) {
  return (
    <ul className="lp-trust" aria-label="Condiciones">
      {["30 días gratis", "Sin tarjeta", "5 cupos"].map((t) => (
        <li key={t}><Icon name="check" size={size} />{t}</li>
      ))}
    </ul>
  );
}

function Todo({ children }: { children: ReactNode }) {
  return <span className="av-todo">{children}</span>;
}

function BulletList({ items, icon, color }: { items: ReactNode[]; icon: IconName; color: string }) {
  return (
    <ul>
      {items.map((t, i) => (
        <li key={i}><Icon name={icon} color={color} /><span>{t}</span></li>
      ))}
    </ul>
  );
}

const SCATTER: { icon: IconName; style: React.CSSProperties }[] = [
  { icon: "folder", style: { left: "2%", top: 4, transform: "rotate(-8deg)" } },
  { icon: "chat", style: { left: "26%", top: 50, transform: "rotate(6deg)" } },
  { icon: "bank", style: { left: "50%", top: 0, transform: "rotate(-4deg)" } },
  { icon: "table", style: { left: "72%", top: 44, transform: "rotate(9deg)" } },
];

const TESTIMONIALS = [1, 2, 3];

export default function Landing() {
  return (
    <SignupProvider>
      <div className="av-scope lp">
        <div className="lp-draft" role="note">
          <b>Borrador.</b> Los textos con línea punteada están pendientes o por verificar. Las pantallas son vistas de ejemplo, no capturas reales.
        </div>

        <header className="lp-top">
          <div className="lp-wrap lp-top__in">
            <Link className="lp-logo" href="#top" aria-label="avantia, inicio"><Logo mark={36} word={18} /></Link>
            <nav className="lp-top__nav" aria-label="Cuenta">
              <Link className="lp-top__login" href="/registro#ingresar">Ingresar</Link>
              <ApplyButton size="sm">Postular</ApplyButton>
            </nav>
          </div>
        </header>

        <main id="top">
          {/* Hero + CTA */}
          <section className="lp-hero" aria-labelledby="hero-title">
            <div className="lp-wrap lp-hero__grid">
              <div className="lp-hero__copy">
                <span className="av-overline">Para expertos que ya enseñan online</span>
                <h1 id="hero-title">Tu academia online, <span style={{ color: "var(--av-blue-600)" }}>con tu marca</span></h1>
                <p className="lp-sub">Sube tus cursos, recibe los pagos de tus alumnos y entrégales una experiencia con tu marca, a tu manera.</p>
                <EmailCapture id="email-hero" />
                <Trust size={20} />
                <a className="av-link" href="#agenda">¿Prefieres conversar antes? Agenda 20 minutos <Icon name="arrow" size={16} /></a>
              </div>
              <BrandStage />
            </div>
          </section>

          {/* ¿Qué hace? */}
          <section className="lp-sec" id="que-hace" style={{ background: "var(--av-surface)" }}>
            <div className="lp-wrap">
              <div className="lp-head">
                <span className="av-overline">Qué hace Avantia</span>
                <h2 className="av-h2">Deja de armar tu academia con piezas sueltas</h2>
              </div>
              <div className="lp-compare">
                <div className="lp-cmp lp-cmp--before">
                  <span className="av-overline" style={{ color: "var(--av-muted)" }}>Hoy</span>
                  <div className="lp-scatter" aria-hidden="true">
                    {SCATTER.map((s) => <span key={s.icon} style={s.style}><Icon name={s.icon} size={30} /></span>)}
                  </div>
                  <BulletList
                    icon="x"
                    color="var(--av-subtle)"
                    items={["Materiales repartidos en carpetas compartidas", "Cobros por transferencia y seguimiento a mano", "Una experiencia con el logo de otras plataformas"]}
                  />
                </div>
                <div className="lp-arrow" aria-hidden="true"><Icon name="arrow" size={26} /></div>
                <div className="lp-cmp lp-cmp--after">
                  <span className="av-overline">Con Avantia</span>
                  <div className="lp-unified" aria-hidden="true">
                    <div className="lp-u-head">
                      <span className="lp-u-star"><Icon name="star" /></span>
                      <div><b>Tu academia</b><small>www.tudominio.cl</small></div>
                    </div>
                    <div className="lp-ico">
                      {(["folder", "card", "users", "bot", "video"] as IconName[]).map((n) => <span key={n}><Icon name={n} /></span>)}
                    </div>
                  </div>
                  <BulletList
                    icon="check"
                    color="var(--av-blue-600)"
                    items={["Tus contenidos organizados en tu propia academia", "Tus alumnos se inscriben y pagan ahí mismo", "Tu logo, tus colores y tu dominio en cada paso"]}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ¿Cómo funciona? */}
          <section className="lp-sec" id="como-funciona">
            <div className="lp-wrap">
              <div className="lp-head">
                <span className="av-overline">Cómo funciona</span>
                <h2 className="av-h2">Así se ve tu academia</h2>
              </div>
              <DemoTabs />
            </div>
          </section>

          {/* Programa fundador */}
          <section className="lp-sec lp-founder" id="fundador">
            <div className="lp-wrap">
              <div className="lp-head">
                <span className="av-overline">Programa fundador</span>
                <h2 className="av-h2">5 cupos para el primer grupo de fundadores</h2>
                <p className="av-lede">Buscamos a 5 expertos que ya enseñan online para construir Avantia junto a ellos.</p>
              </div>
              <div className="lp-fgrid">
                <div className="lp-fbox">
                  <h3>Lo que recibes</h3>
                  <BulletList icon="check" color="var(--av-blue-600)" items={[
                    "30 días gratis, sin tarjeta de crédito.",
                    "Acompañamiento directo de nuestro equipo para configurar tu academia.",
                    <>Precio preferente durante <Todo>[período pendiente]</Todo> si decides continuar con un plan.</>,
                  ]} />
                </div>
                <div className="lp-fbox">
                  <h3>Lo que te pedimos</h3>
                  <BulletList icon="minus" color="var(--av-blue-600)" items={[
                    "Usar Avantia con tus contenidos reales.",
                    "Invitar a tus alumnos, si puedes.",
                    "Contarnos tu experiencia en dos conversaciones breves.",
                  ]} />
                </div>
                <div className="lp-fbox">
                  <h3>Es para ti si</h3>
                  <BulletList icon="minus" color="var(--av-blue-600)" items={[
                    "Ya enseñas online y tienes alumnos.",
                    "Tienes una marca personal o quieres construirla.",
                  ]} />
                </div>
              </div>
              <div className="lp-ffoot">
                <p>Si el grupo ya está completo, quedas en la lista de espera para el siguiente. Inicio estimado: <Todo>[fecha pendiente]</Todo>.</p>
                <div className="lp-fcta"><ApplyButton>Postula al programa fundador</ApplyButton></div>
              </div>
            </div>
            <div className="lp-onda" aria-hidden="true">
              <svg viewBox="0 0 1440 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ondaA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1D4ED8" /><stop offset=".7" stopColor="#2563EB" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient>
                  <linearGradient id="ondaB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2563EB" /><stop offset=".55" stopColor="#4C7DF0" /><stop offset=".85" stopColor="#A9C2F9" /><stop offset="1" stopColor="#CDB9FC" /></linearGradient>
                  <linearGradient id="ondaC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E4EDFD" /><stop offset=".5" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E4EDFD" /></linearGradient>
                </defs>
                <path d="M0 78 C 220 18, 470 8, 720 48 S 1190 104, 1440 34 L 1440 150 L 0 150 Z" fill="url(#ondaA)" opacity=".34" />
                <path d="M0 104 C 260 54, 540 58, 800 92 S 1240 122, 1440 70 L 1440 150 L 0 150 Z" fill="url(#ondaB)" opacity=".48" />
                <path d="M0 128 C 280 100, 560 98, 820 118 S 1260 140, 1440 108 L 1440 150 L 0 150 Z" fill="url(#ondaC)" opacity=".85" />
              </svg>
            </div>
          </section>

          {/* Equipo */}
          <section className="lp-sec" id="equipo" style={{ background: "var(--av-surface)" }}>
            <div className="lp-wrap">
              <div className="lp-head">
                <span className="av-overline">Quiénes somos</span>
                <h2 className="av-h2">Estamos empezando, y lo decimos con claridad</h2>
                <p className="av-lede">Trabajamos con grupos pequeños y acompañamos a cada experto de forma directa. Lo que aprendamos con ustedes define lo que construimos después.</p>
              </div>
              <ul className="lp-team">
                {[1, 2, 3].map((n) => (
                  <li className="lp-member" key={n}>
                    <span className="lp-av" style={{ width: 68, height: 68, fontSize: 11 }}>Foto<br />pendiente</span>
                    <div><Todo>[Nombre]</Todo><Todo>[Rol]</Todo><Todo>[LinkedIn]</Todo></div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Testimonios (placeholders: no hay testimonios reales todavía) */}
          <section className="lp-sec" id="testimonios" aria-labelledby="testimonios-title">
            <div className="lp-wrap">
              <div className="lp-head">
                <span className="av-overline">Testimonios</span>
                <h2 className="av-h2" id="testimonios-title">Lo que dicen los primeros fundadores</h2>
                <p className="av-lede"><Todo>[Sección pendiente]</Todo> Se completa con testimonios reales y autorizados del primer grupo; no se publican citas inventadas.</p>
              </div>
              <ul className="lp-team">
                {TESTIMONIALS.map((n) => (
                  <li key={n} className="lp-quote">
                    <span className="av-badge av-badge--verify">Testimonio pendiente</span>
                    <blockquote><Todo>[Cita del fundador {n}: qué problema tenía y qué cambió con Avantia]</Todo></blockquote>
                    <div className="lp-quote__by">
                      <span className="lp-av" style={{ width: 44, height: 44, fontSize: 9 }}>Foto<br />pend.</span>
                      <div><Todo>[Nombre]</Todo><Todo>[Rol · Academia]</Todo></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="lp-sec" id="faq" style={{ background: "var(--av-surface)" }}>
            <div className="lp-wrap lp-faq-grid">
              <div className="lp-faq-title"><h2 className="av-h2">Preguntas frecuentes</h2></div>
              <div className="lp-faq">
                {FAQS.map((f) => (
                  <details key={f.q}>
                    <summary>
                      {f.q}
                      <Icon name="plus" size={20} />
                      <Icon name="minus" size={20} />
                    </summary>
                    <p className={`lp-ans${f.pend ? " is-pend" : ""}`}>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Cierre: CTA + Signup/Signin con Google */}
          <section className="lp-sec lp-final" id="final" aria-labelledby="final-title">
            <div className="lp-wrap">
              <h2 id="final-title">Tu conocimiento ya tiene alumnos, dale una academia con tu nombre</h2>
              <EmailCapture id="email-final" />
              <Trust size={22} />
              <p className="av-legal">
                ¿Ya tienes cuenta? <Link href="/registro#ingresar">Ingresa con Google</Link>
              </p>
            </div>
          </section>
        </main>

        <footer className="lp-foot">
          <div className="lp-wrap">
            <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}><Logo mark={32} word={16} /></span>
              <span>© Avantia</span>
            </span>
            <nav aria-label="Legal">
              <a id="terminos" href="#terminos">Términos y condiciones <Todo>(pendiente)</Todo></a>
              <a id="privacidad" href="#privacidad">Política de privacidad <Todo>(pendiente)</Todo></a>
              <span id="agenda">Agenda 20 minutos: <Todo>[enlace pendiente]</Todo></span>
              <span>Contacto: <Todo>[correo pendiente]</Todo></span>
            </nav>
          </div>
        </footer>

        <StickyBar />
      </div>
    </SignupProvider>
  );
}
