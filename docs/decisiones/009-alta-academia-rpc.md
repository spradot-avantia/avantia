# 009 — Alta de academia como RPC SQL con la sesión del usuario

- **Fecha:** 2026-10-12
- **Estado:** Propuesta (pendiente de aprobación de Samuel; implementada en `db/migrations/0002_crear_academia.sql`)

## Contexto
RQ-02. `POST /api/tenants` creaba tenants con service role, sin sesión, sin membresía y sin transacción.

## Decisión
- Función `crear_academia(p_nombre, p_subdomain, p_frase, p_area)` `SECURITY DEFINER` con `search_path` fijo, que usa `auth.uid()` y crea tenant + membresía (rol `dueno`) + tema base en una transacción. Se invoca con el cliente de sesión desde la Server Action `crearAcademiaAction`.
- Una academia por usuario (índice único `membresias(user_id)`); esto hace determinista `auth_tenant_id()`.
- `membresias` pasa a tener RLS (el usuario lee solo las suyas) y sin escritura directa; `tenants` sin insert/delete para clientes.
- Validación en vivo con `subdominio_disponible()` (solo booleano, exige sesión).
- La lista de reservados vive duplicada en SQL y en `lib/tenant/reservados.ts`; deben mantenerse en sincronía.
- `POST /api/tenants` responde 410.

## Alternativas descartadas
Insertar con service role desde el backend (salta RLS, sin transacción); trigger sobre `auth.users` (crea academias a quien no la pidió).

## Consecuencias
Pendiente (Etapa 2): límite de tasa en `subdominio_disponible`, multi-academia por usuario y roles adicionales. Regla de CI `scripts/check-admin-imports.mjs` limita dónde se importa `lib/supabase/admin`.
