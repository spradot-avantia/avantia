# 003 — Identidad y sesión del creador

- **Fecha:** 2026-10-12
- **Estado:** Propuesta (pendiente de aprobación de Samuel)

## Contexto

Supabase Auth tiene un único `auth.users` por proyecto, pero el producto exige credenciales de alumno por academia y sesión aislada por host (NF-04, Requerimientos §4.1). RQ-01 pedía solo Google; Samuel pidió entregar primero el login directo con correo y contraseña, dejando Google como "próximamente". Hasta ahora el panel funcionaba sin sesión con `DEMO_TENANT_SLUG`.

## Decisión

- **Identidad compartida en Supabase Auth** (un `auth.users` por proyecto) solo para quienes operan el panel: creadores y equipo de Avantia. La academia se deriva de la membresía (`auth_tenant_id()` + RLS), nunca del body.
- **Sesión del creador solo en el host del panel** (`app.avantia.app`, `localhost` en dev). Las cookies de Supabase se emiten ahí y el refresco corre en `middleware.ts` únicamente para `classifyHost() == "panel"`, sin consultar tablas. Las rutas `/login`, `/signup`, `/auth/confirm`… redirigen al panel si se piden desde otro host. Los sitios de academia (otros hosts) no leen ni escriben esa sesión.
- Acceso: correo + contraseña (≥10 caracteres) con confirmación de correo por enlace (`/auth/confirm`, `verifyOtp` con `token_hash`) y recuperación de contraseña. Google se agrega después sin cambiar este modelo.
- Sin sesión, el panel redirige a `/login?next=…`. Con sesión y sin academia, a `/onboarding`. `/admin` sigue protegido por `esStaff()` (`STAFF_EMAILS`).
- `DEMO_TENANT_SLUG` solo funciona con `ALLOW_DEMO_TENANT=true` (desarrollo local).
- **Alumnos por tenant: se resuelven aparte.** Opciones a evaluar en otro ADR: (a) tabla propia de cuentas de alumno por tenant con su sesión firmada por host; (b) `auth.users` compartido con alias de correo por tenant. No se mezclan con la sesión del creador.
- Abuso (NF-23): se confía en los límites de Supabase Auth; hay un limitador mínimo en memoria por instancia (TODO: compartido).

## Alternativas descartadas

- Un proyecto Supabase por academia: costo operativo desproporcionado para el MVP.
- Sesión compartida entre panel y sitios de academia (cookie en dominio raíz): rompe NF-04 y expone el panel a XSS de un tenant.
- Middleware que consulta tablas para decidir acceso: prohibido por ADR 002.

## Consecuencias

- Un correo de creador no puede reutilizarse como alumno con la misma credencial; requiere la decisión de alumnos.
- `auth_tenant_id()` sigue asumiendo un tenant por usuario (ver Supuestos_y_Pendientes).
- Costo: una llamada a Supabase Auth por request del panel que traiga cookie de sesión (las anónimas no pagan).
- Requiere configurar Supabase Auth (ver `docs/producto/Configuracion_Auth_Supabase.md`).
