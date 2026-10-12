# Plan de ejecución — mañana (2026-10-13) y arranque de H1

Basado en: `docs/producto/Requerimientos_MVP.md`, `Investigacion_Retencion.md`, `Investigacion_Mercado_Verificacion.md`, `Impacto_Movil_UX.md`, `docs/Revision_Flujos_Creador_Alumno_2026-10-12.md`.

## Qué dicen las investigaciones (lo que cambia el plan)

- **Retención:** el calendario fijo (45% vs 13%) está sobrestimado: en cursos pagos la brecha cohorte vs autoguiado ronda 10 puntos. La presencia del creador pasa a hipótesis. Palancas sólidas: cadencia configurable, onboarding con intención, práctica espaciada, normas sociales. → Mantener cohorte simple y **medir** (RQ-26 no se corta).
- **Mercado:** "marca propia + Mercado Pago + español" ya lo ofrece Sabionet (desde US$49/mes, 0% comisión). El diferencial a probar es retención medida, multi-tenant para agencias y app de marca (PWA) incluida. → Instrumentación y PWA suben de valor.
- **Móvil:** alumno 100% móvil; creador edita en escritorio. PWA mínima en MVP; web push y offline después.
- **Requerimientos:** 31 RQ ≈ 83 días-persona = 12–16 semanas para el equipo actual → 3 hitos (H1 academia gratis en vivo, H2 retención medible, H3 cobro).

## Decisiones que necesito de Samuel antes/durante mañana

| # | Decisión | Bloquea | Recomendación |
|---|---|---|---|
| Q1 | "Credenciales por tenant" vs Supabase Auth (un solo `auth.users`) | RQ-05 (alumno) | Identidad compartida, **datos y sesión aislados por host**; escribir ADR 003 |
| Q3 | MFA propio para creador | RQ-01 | No: con Google ya lo cubre la cuenta Google |
| Q4 | Registro creador abierto o por aplicación (design partner) | RQ-28 | Por aplicación en H1 |
| Q7 | Modelo de ingresos (cuota fija vs comisión) | RQ-20 | Cuota fija; no hace falta split en MVP |
| Q6 | Quiz obligatorio para completar | RQ-17/18 | Opcional, intentos ilimitados |

## Meta realista para mañana (1 día, equipo pequeño)

**"Cimientos seguros y navegables":** al final del día, creador entra con Google, crea su academia, y el aislamiento está probado. No se promete cobro, quiz ni cohortes.

### Bloques (orden y dueños sugeridos)

| Orden | Tarea | RQ | Esf. | Quién |
|---|---|---|---|---|
| 1 | Cerrar agujeros: panel interno protegido (rol staff) y fix `endsWith("app.avantia.app")` con tests | RQ-06, RQ-03 | S+S | Dev |
| 2 | ADR 003 (identidad compartida, sesión por host) y ADR 004 (cohorte simple: `modalidad` + `dia_liberacion`) | Q1 | S | Samuel + Claude |
| 3 | Migraciones en `db/migrations`: `tenants` (pais, moneda), `cursos` (estado, modalidad, fecha_inicio), `lecciones`, `inscripciones`, `progreso`, `eventos`, todas con RLS 4 operaciones + índice `tenant_id` | RQ-04, 09, 10, 14, 16, 21, 26 | M | Dev + Claude |
| 4 | Suite de pruebas RLS con 2 tenants + seed + regla CI contra import de `admin.ts` | RQ-04, 31 | M | Dev |
| 5 | Auth Google (Supabase) + redirect según tenga o no academia; quitar `DEMO_TENANT_SLUG` | RQ-01 | M | Dev |
| 6 | Alta de academia transaccional (RPC) | RQ-02 | M | Aprendiz con revisión |
| 7 | Móvil base: `viewport`, inputs ≥16 px, `Button` ≥44 px, sidebar colapsable, manifest PWA por tenant | Impacto_Movil | S | Aprendiz |
| 8 | Aplicar tokens de la landing al dashboard (mapeo de `docs/design/Sistema_Diseno_Avantia.md`) | diseño | S | Claude |

Si solo alcanza para la mitad: bloques 1–5.

## Secuencia posterior (resumen de hitos)

- **H1 (≈ semanas 1–8):** RQ-02…16, 18 (sin quiz), 26, 31 → academia gratis cursable desde celular.
- **H2:** quiz (RQ-17), cohorte (RQ-22), norma social (RQ-24), presencia barata (RQ-25), dashboard CR-11 (RQ-27), correo (RQ-23 si hay tiempo).
- **H3:** cobro Mercado Pago (RQ-19/20/21), landing conectada (RQ-28), legales (RQ-29), dominio concierge (RQ-30).
- Corte si hay retraso: RQ-23, RQ-24, "ver como alumno", RQ-19 → cobro externo con inscripción asistida. No se cortan RQ-04, 06, 26, 29.

## Paralelo (no bloquea): validación

- Entrevistas: se agendan según se consigan. Guías ya ajustadas con 9 cambios (rivales por nombre y barrera "gratis al entrar").
- Hipótesis críticas que condicionan alcance: dominio propio indispensable (H dominio), contenido en YouTube/Vimeo suficiente (riesgo de enlace compartible), cuota fija aceptada frente a "gratis al entrar".
- Pendientes de verificar: tarifa fija de Hotmart por país, Flow/Webpay, Stripe en Chile y Perú, push iOS 2026, "60% mujeres" (quitar del doc de mercado).

## Riesgos

1. Alcance: 83 días-persona no caben en 8 semanas con el equipo actual → H1 solo con partner gratuito.
2. Mercado Pago: doc ambigua sobre medios de pago en split; probar en sandbox antes de prometer.
3. Video de YouTube/Vimeo no protege contenido de pago.
4. Documentos de mercado citan cifras de Hotmart (parte interesada).
