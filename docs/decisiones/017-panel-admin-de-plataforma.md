# 017 — Zona de administración de plataforma (`/admin`)

- **Fecha:** 2026-10-29
- **Estado:** Propuesta (implementada en `dev`, espera la aprobación de Samuel)

## Contexto

`/admin` vivía dentro del layout del creador (`(dashboard)`), con su menú y marca de academia, y solo listaba academias y postulaciones. El equipo necesita gestionar postulaciones, creadores y academias desde un lugar propio, claramente distinto del panel que ve el creador.

## Decisión

- **Grupo de rutas `app/(admin)`** con layout propio (`AdminShell`, CSS `.ad-`, tokens `--av-*`, mobile-first): sin sesión → `/login?next=...`; sin ser staff → "Acceso restringido". La URL sigue siendo `/admin`.
- **Secciones:** Resumen (contadores), **Postulaciones** (filtros por estado; aceptar e invitar, reenviar invitación, marcar contactada, lista de espera, rechazar y revocar acceso), **Creadores** (cuentas de Auth con academia, estado de postulación, último ingreso; suspender/reactivar con `ban_duration`), **Academias** (todas, con dueño y cursos) y **Equipo** (ADR 016).
- Todas las acciones (`lib/admin/actions.ts`, `lib/postulacion/actions.ts`) re-verifican `esStaff()` en el servidor; no reciben `tenant_id`. Lecturas con service role, solo desde esta zona (excepción documentada a "filtrar por tenant").
- El staff sin academia propia entra directo a `/admin` en vez de al onboarding.

## Alternativas descartadas

- Seguir dentro del layout del creador: mezcla marcas y menús, y obliga a excepciones en el layout (`/admin` sin academia).
- Proyecto o subdominio aparte: contradice el ADR 002 (un solo proyecto Next.js).

## Consecuencias

- Suspender un creador bloquea el ingreso pero no oculta su sitio público; suspender/ocultar una academia (columna en `tenants` + resolución del host) queda pendiente.
- Rechazar a alguien ya aceptado le quita el acceso en su siguiente carga (ADR 015).
- Listados de Auth limitados a 200 cuentas (sin paginar) mientras haya pocos creadores.
