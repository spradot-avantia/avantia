# 011 — Postulación al programa fundador con Google y tabla `postulaciones`

- **Fecha:** 2026-10-20
- **Estado:** Propuesta (implementada en `dev`, espera la aprobación de Samuel)

## Contexto

En la reunión del 2026-10-13 se pidió desplegar pronto la landing V3 con tres cosas: (1) entrar con la cuenta de Google **antes** de llenar la postulación, sin agregar campos al formulario; (2) guardar los datos del postulante (el formulario anterior no guardaba nada); (3) que "Agenda 20 minutos" lleve directo a Google Calendar. El ADR 003 dejaba Google para "después", aunque `signInWithGoogleAction` y `/auth/callback` ya existían. Un postulante todavía no tiene academia, así que no tiene `tenant_id`.

## Decisión

- **Flujo:** todos los CTA de la landing llevan a `/postular`, en el **host del panel**, porque la sesión solo vive ahí (ADR 003). Paso 1: "Continuar con Google" (Supabase OAuth, `next=/postular`). Paso 2: el formulario de la V3 (nombre, LinkedIn/web y alumnos al año). El correo se muestra en solo lectura y es el de Google. Después aparece una confirmación con el enlace a la agenda. Mientras la postulación siga en estado `nueva`, el postulante puede corregir sus datos.
- **Datos:** tabla de plataforma `postulaciones` (migración `0004`): una fila por `user_id`. El trigger copia `email` desde `auth.users`, nunca desde el cliente. El `estado` (`nueva/contactada/aceptada/lista_espera/descartada`) solo lo cambia el equipo, con service role.
- **Excepción a la regla de `tenant_id`:** la tabla no tiene `tenant_id` porque no pertenece a ninguna academia. El aislamiento es **por usuario**: RLS con `user_id = auth.uid()` y grants por columna (el cliente no puede escribir `email` ni `estado`). Lo cubre la suite `test:rls`. El equipo la lee en `/admin/postulaciones` (con `esStaff()` y service role).
- **Agenda:** se configura `NEXT_PUBLIC_AGENDA_URL` con la página de reservas de Google Calendar ("Agenda de citas"). Si no está configurada, el enlace abre un correo a `contacto@goavantia.com`. No se integra la API de Calendar.
- `/registro` queda como redirección a `/postular`.

## Alternativas descartadas

- Sesión en el host de marketing para mantener el modal de la landing: viola ADR 003 (sesión solo en el panel).
- Guardar la postulación sin cuenta (formulario anónimo): no cumple "primero registro" y abre la puerta al spam sin identidad verificada.
- Guardar en `user_metadata` de Auth: el equipo no puede consultarla ni filtrarla, y no tiene estado.
- Integrar la API de Google Calendar: más costo (OAuth de la cuenta del equipo, cuotas) para lo mismo que hace una página de reservas.

## Consecuencias

- Hay que activar el proveedor Google en Supabase Auth (Client ID/Secret de Google Cloud) y agregar `https://app.avantia.app/auth/callback` a las Redirect URLs. Sin esto, el paso 1 falla con `/login?error=google`.
- Hay que aplicar `0004_postulaciones.sql` en Supabase y definir `NEXT_PUBLIC_AGENDA_URL` en Vercel (ambos hechos el 2026-10-20).
- Una cuenta de Google que postula también puede entrar a `/` y crear una academia en `/onboarding`: el registro **no** queda cerrado por aplicación (Q4 sigue abierta). Para cerrarlo, `crear_academia()` tendría que exigir una postulación `aceptada`.
- No hay aviso automático al equipo cuando llega una postulación (se revisa `/admin/postulaciones`). Un correo a `contacto@goavantia.com` sería el siguiente paso.
