// Landing pública de Avantia (Server Component). Diseño: mockup "programa fundador".
// Client Components solo donde hay estado: BrandStage y DemoTabs. Los CTA son
// enlaces a /postular (formulario sin cuenta; ADR 014) y /login.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { BrandStage } from "./BrandStage";
import { DemoTabs } from "./DemoTabs";
import { ApplyButton, PostularCta, StickyBar, loginHref } from "./Ctas";
import { CONTACTO, FAQS, agendaHref } from "./content";
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
      {["Programa gratis", "Sin tarjeta", "5 cupos"].map((t) => (
        <li key={t}><Icon name="check" size={size} />{t}</li>
      ))}
    </ul>
  );
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

/** Enlace a la página de reservas de Google Calendar (abre en otra pestaña). */
function AgendaLink({ children }: { children: ReactNode }) {
  const href = agendaHref();
  const externo = href.startsWith("http");
  return (
    <a className="av-link" href={href} {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children} <Icon name="arrow" size={16} />
    </a>
  );
}

export default function Landing() {
  return (
    <div className="av-scope lp">
      <header className="lp-top">
        <div className="lp-wrap lp-top__in">
          <Link className="lp-logo" href="#top" aria-label="avantia, inicio"><Logo mark={36} word={18} /></Link>
          <div className="lp-top__act">
            <a className="av-btn av-btn--secondary av-btn--sm" href={loginHref()}>Ingresar</a>
            <ApplyButton size="sm">Postular</ApplyButton>
          </div>
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
              <PostularCta />
              <Trust size={20} />
              <AgendaLink>¿Prefieres conversar antes? Agenda 20 minutos</AgendaLink>
            </div>
            <BrandStage />
          </div>
        </section>

        {/* ¿Qué hace? */}
        <section className="lp-sec" id="que-hace" style={{ background: "var(--av-surface)" }}>
          <div className="lp-wrap">
            <div className="lp-head">
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
              <span className="av-overline">Míralo funcionar</span>
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
                  "Programa gratis, sin tarjeta de crédito.",
                  "Acompañamiento directo de nuestro equipo para configurar tu academia.",
                  "Precio preferente durante los dos meses siguientes al término del programa, si decides continuar con un plan.",
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
              <p>Si el grupo ya está completo, quedas en la lista de espera para el siguiente. Inicio estimado: noviembre 2026.</p>
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
                  <p className="lp-ans">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className="lp-sec lp-final" id="final" aria-labelledby="final-title">
          <div className="lp-wrap">
            <h2 id="final-title">Tu conocimiento ya tiene alumnos, dale una academia con tu nombre</h2>
            <PostularCta />
            <Trust size={22} />
            <AgendaLink>¿Prefieres conversar antes? Agenda 20 minutos</AgendaLink>
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
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/privacidad">Política de privacidad</Link>
            <AgendaLink>Agenda 20 minutos</AgendaLink>
            <span><a href={`mailto:${CONTACTO}`}>{CONTACTO}</a></span>
          </nav>
        </div>
      </footer>

      <StickyBar />
    </div>
  );
}
