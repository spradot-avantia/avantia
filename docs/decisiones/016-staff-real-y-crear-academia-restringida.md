# 016 — Staff real y `crear_academia` restringida

- **Fecha:** 2026-10-29
- **Estado:** Propuesta (implementada en `dev`, espera la aprobación de Samuel)

## Contexto

El rol staff era un stub: la lista `STAFF_EMAILS` (RQ-06), sin forma de sumar o quitar gente sin redeploy. Además, `crear_academia()` solo exigía sesión: cualquier cuenta (p. ej. creada con `signUp` directo a Supabase) podía crear una academia aunque el panel la bloqueara (ADR 015, Q4 parcial).

## Decisión

- **Tabla `staff`** (migración `0006`): `email` (PK, minúsculas), `rol` (`admin`), `created_at`, `created_by`. Tabla de plataforma **sin `tenant_id`** (misma excepción que `postulaciones`, ADR 011): RLS habilitada **sin políticas** y `revoke all` a `anon`/`authenticated`; solo el backend con service role la toca.
- **Arranque:** `STAFF_EMAILS` siembra la tabla la primera vez que esos correos se consultan (`lib/staff.ts`); después el equipo se gestiona en `/admin/equipo` (agregar/quitar; no puedes quitarte a ti ni dejar el equipo vacío). Los de `STAFF_EMAILS` no se quitan desde la UI porque se resembrarían.
- **`tiene_acceso_plataforma(email)`** (SQL, `security definer`, sin `execute` para clientes): staff o postulación `aceptada`. `crear_academia()` la usa con el correo de `auth.uid()` y falla con `sin_invitacion`.
- La app usa la misma regla (`puedeRegistrarse`/`tieneAcceso` → `correoEsStaff` + postulación aceptada).

## Alternativas descartadas

- Claim de rol en el JWT: requiere hook de Auth y refresco de sesión; excesivo para un rol de un solo nivel.
- Columna `es_staff` en `auth.users` / `app_metadata`: se edita solo con service role igual, pero no se puede listar y gestionar con facilidad ni sembrar antes de que la persona tenga cuenta.
- Trigger `before insert` en `auth.users` para cerrar también el `signUp` directo: queda como mejora; hoy esas cuentas existen pero no pueden usar nada (ADR 015).

## Consecuencias

- Aplicar `0006_staff_y_acceso_crear_academia.sql` en Supabase **antes** de desplegar (la app consulta `staff`). El staff necesita ingresar una vez para sembrarse antes de poder crear una academia propia.
- `REGISTRO_ABIERTO=true` abre la app pero **no** la base: en desarrollo, `crear_academia` exige igualmente staff o postulación aceptada.
- La suite `db/tests/rls_aislamiento.sql` cubre la restricción (usuario D sin invitación).
