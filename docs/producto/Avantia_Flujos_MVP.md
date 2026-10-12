# Flujos críticos del MVP — Avantia

> Objetivo de este documento: definir, para los cinco flujos que hacen que la
> app *funcione* de punta a punta, qué pasos tiene, qué datos toca, qué existe
> hoy en el código/esquema y qué falta para poder mostrar el MVP. No cubre
> nada fuera de estos cinco flujos a propósito — theming avanzado, múltiples
> academias por profesor, reportes, etc. quedan fuera de este corte.
>
> Convención de nombres: **cliente** = profesor/creador dueño de una academia.
> **tenant** = academia en la base de datos (`tenants`). **alumno** = usuario
> que se inscribe a un curso. Ver
> [Avantia_Estructura_Codigo_Arquitectura.md](../arquitectura/Avantia_Estructura_Codigo_Arquitectura.md)
> y [Supuestos_y_Pendientes.md](../arquitectura/Supuestos_y_Pendientes.md) para
> el estado técnico general.

---

## 0. Qué falta en el modelo de datos para que estos 5 flujos cierren

Hoy `db/schema.sql` tiene `tenants`, `cursos` y `membresias` (profesor↔tenant).
No hay auth real conectada (se usa un `DEMO_TENANT_SLUG` fijo) ni tabla de
inscripciones. Para que los 5 flujos de abajo sean reales, hace falta:

1. **Activar Supabase Auth** (ya es la dependencia elegida, `@supabase/ssr` ya
   está en el stack) para que `auth.users` deje de ser teórico.
2. **Tabla `inscripciones`**: `alumno_id` (→ `auth.users`), `curso_id` (→
   `cursos`), `tenant_id`, `estado` (`activa` / `cancelada`), `created_at`.
   Con RLS: un alumno solo ve sus propias inscripciones; el profesor del
   tenant ve las de su academia.
3. **No hace falta una tabla `usuarios` separada por rol.** `auth.users` es
   la única tabla de personas. Lo que distingue a un profesor de un alumno es
   si tiene una fila en `membresias` (profesor de ese tenant) o en
   `inscripciones` (alumno de un curso de ese tenant) — la misma persona
   podría en teoría tener ambas filas sin conflicto de modelo. Esto es
   consistente con el patrón que ya usa `membresias` en el schema actual.

Con esas dos piezas (auth real + `inscripciones`), los 5 flujos quedan
soportados sin más cambios de esquema.

---

## 1. Alta de cliente (profesor/creador)

**Objetivo:** que una persona nueva pueda registrarse como futuro dueño de
una academia, antes de que exista la academia en sí.

**Pasos:**
1. El cliente entra a `app.avantia.app/registro` (host de panel).
2. Completa email + contraseña (o magic link) → Supabase Auth crea el
   usuario en `auth.users`.
3. Verificación de email (flujo estándar de Supabase Auth, sin desarrollo
   custom).
4. Login exitoso → si el usuario **no** tiene ninguna fila en `membresias`,
   se lo redirige directo al flujo de creación de academia (Sección 2). No
   existe un "dashboard vacío" intermedio: sin academia no hay nada que
   mostrar todavía.

**Qué ya existe:** nada — hoy `(dashboard)` opera sobre `DEMO_TENANT_SLUG`,
no hay páginas de registro/login.

**Corte para MVP:**
- Un solo método de auth (email/password *o* magic link, no ambos — elegir
  el que tenga menos fricción para no perder tiempo en UI de recuperación de
  contraseña vs. reenvío de link).
- Sin roles/permisos dentro de una academia todavía (un solo dueño por
  tenant, que es lo que ya asume `auth_tenant_id()`).
- Sin "equipo de Avantia" vs. "dueño de academia" como paneles separados
  (pendiente ya anotado en `Supuestos_y_Pendientes.md`) — no bloquea el MVP
  porque en esta etapa el único usuario del panel admin sos vos.

---

## 2. Creación de academia (tenant)

**Objetivo:** que un cliente recién registrado (o logueado sin academia
todavía) termine con un `tenant` propio y una membresía que lo liga a él.

**Pasos:**
1. Formulario corto: nombre de la academia → se deriva `slug` y `subdomain`
   automáticamente (ej. "Academia de Juan" → `academia-de-juan`,
   `academia-de-juan.avantia.app`), con chequeo de unicidad antes de
   confirmar.
2. Al confirmar, en una sola transacción: insert en `tenants` + insert en
   `membresias` (`user_id` = usuario logueado, `tenant_id` = el nuevo
   tenant). Esto ya lo puede hacer `POST /api/tenants`, que hoy existe pero
   falta conectarlo al `user_id` de la sesión real en vez de recibir el
   tenant por env var/body.
3. Redirect al panel (`(dashboard)`), ahora resolviendo el tenant vía
   `auth_tenant_id()` en vez de `DEMO_TENANT_SLUG`.

**Qué ya existe:** tabla `tenants`, tabla `membresias`, endpoint
`POST /api/tenants` (falta conectarlo a sesión real).

**Corte para MVP:**
- Sin dominio propio todavía en este paso — eso ya es
  `configuracion/dominio`, que puede quedar como paso posterior/opcional
  (el mock actual ya cubre esa demo, no es parte del camino crítico).
- Sin logo/color en el alta — el tenant nace con defaults
  (`color_primario` ya tiene default en el schema) y se edita después en
  `configuracion/marca`.
- Un cliente = una academia. Multi-academia por cliente queda fuera (ya es
  el supuesto que asume `auth_tenant_id()` hoy).

---

## 3. Creación de curso

**Objetivo:** que el dueño de una academia publique un curso vendible.

**Pasos:**
1. Desde `(dashboard)/cursos/nuevo`, el profesor arranca el flujo con IA
   (`app/api/ai/generar-curso/route.ts`) o carga manualmente: título,
   descripción, precio.
2. El curso se guarda en `cursos` con el `tenant_id` de la sesión (no
   recibido del body — este es el mismo TODO ya anotado en
   `Supuestos_y_Pendientes.md`, y se vuelve bloqueante recién ahora que hay
   sesión real).
3. El curso aparece en `(dashboard)/cursos` y, si tiene estado publicado,
   en la página pública `curso/[slug]`.

**Qué ya existe:** tabla `cursos`, ruta de creación con IA, página pública de
venta del curso.

**Corte para MVP:**
- **Sin lecciones/módulos estructurados todavía** si no es indispensable:
  la ruta `aprender/[cursoId]/[leccionId]` ya asume contenido navegable, así
  que el mínimo real es que un curso tenga *al menos una lección* (aunque
  sea un solo video/texto). Definir "1 curso = 1 o más lecciones simples"
  como el piso, no un editor de currícula completo.
- Sin borrador/publicado como estados separados si complica el MVP: se
  puede lanzar con "todo lo que existe está publicado" y agregar el toggle
  después.
- Precio ya está en el schema (`precio_centavos`) — soporta curso pago desde
  el día uno, pero el *cobro* en sí es el flujo de inscripción (Sección 5),
  no este.

---

## 4. Alta de usuario (alumno)

**Objetivo:** que alguien que llega a la página pública de una academia
pueda crear una cuenta para inscribirse a un curso.

**Pasos:**
1. El alumno entra a `curso/[slug]` (sitio público de una academia
   específica) y toca "Inscribirme".
2. Si no tiene sesión, se le pide registro (mismo mecanismo de Supabase
   Auth que en la Sección 1 — **es el mismo sistema de auth para profesores
   y alumnos**, no uno paralelo).
3. Tras confirmar cuenta, vuelve directo al flujo de inscripción del curso
   que lo trajo (no lo mandamos a un dashboard de alumno separado que hoy no
   existe).

**Qué ya existe:** nada de auth. El `checkout/page.tsx` ya existe como
página pero sin login delante.

**Corte para MVP:**
- Sin dashboard de "mis cursos" para el alumno todavía — el mínimo viable
  es que, tras inscribirse, pueda entrar a `aprender/[cursoId]/...`
  directamente. Un listado de "mis inscripciones" es mejora post-MVP.
- Mismo mecanismo de auth que el cliente (un solo sistema de login para
  toda la plataforma) — evita construir dos flujos de registro distintos.
- Sin perfil de alumno (foto, datos adicionales) — solo lo que pide
  Supabase Auth por default.

---

## 5. Flujo de inscripción a curso

**Objetivo:** que un alumno logueado quede con acceso al contenido de un
curso, sea pago o gratuito.

**Pasos:**
1. Desde `curso/[slug]`, alumno logueado toca "Inscribirme".
2. **Si el curso es gratuito** (`precio_centavos = 0`): insert directo en
   `inscripciones` (tabla nueva, ver Sección 0) y redirect a
   `aprender/[cursoId]/[leccionId]`.
3. **Si el curso es pago**: redirect a `checkout/page.tsx` → Stripe o
   Mercado Pago Connect (según el método que el tenant tenga configurado)
   → el webhook (`api/webhooks/stripe` o `.../mercadopago`, ya existen como
   endpoints) confirma el pago y **recién ahí** hace el insert en
   `inscripciones`. La inscripción nunca se crea antes de la confirmación
   del webhook, para no dar acceso sin pago confirmado.
4. `aprender/[cursoId]/[leccionId]` valida contra `inscripciones` (RLS) que
   el alumno tenga acceso antes de mostrar contenido.

**Qué ya existe:** páginas `checkout` y `aprender`, endpoints de webhook de
Stripe/Mercado Pago (como stubs), reproductor de video.

**Qué falta y es bloqueante para el MVP:**
- Tabla `inscripciones` (Sección 0).
- Onboarding real de Stripe Connect / Mercado Pago Connect por tenant —
  hoy está marcado como "Pendiente" sin resolver en
  `Supuestos_y_Pendientes.md`. **Esto es lo más grande que falta de todo el
  documento**: sin cuenta conectada del tenant, no hay a dónde mandar el
  split payment.
- Lógica del webhook que efectivamente inserta en `inscripciones` al
  confirmar el pago (hoy los route handlers de webhook existen como
  destino pero no está documentado qué hacen al recibir el evento).

**Corte para MVP:**
- Un solo proveedor de pago activo para lanzar (Stripe *o* Mercado Pago, no
  los dos al mismo tiempo) — reduce a la mitad el trabajo de onboarding e
  integración para la demo inicial.
- Sin reembolsos/cancelación de inscripción todavía — se agrega
  `estado = 'cancelada'` a la tabla desde el diseño para no tener que migrar
  después, pero la UI para cancelar queda fuera del MVP.
- Sin períodos de acceso ni vencimiento — una inscripción activa da acceso
  indefinido al curso.

---

## Orden de implementación sugerido

Los flujos tienen dependencias entre sí — este orden evita construir algo
que no se puede probar todavía por falta de lo anterior:

1. **Auth real** (Supabase Auth conectado, reemplaza `DEMO_TENANT_SLUG`) —
   prerrequisito de todo lo demás.
2. **Flujo 1 + 2** (alta de cliente + creación de academia) — desbloquea
   probar el panel con datos reales en vez del tenant demo.
3. **Flujo 3** (creación de curso), conectando `tenant_id` a la sesión.
4. **Flujo 4** (alta de alumno) — reusa el auth de (1), bajo trabajo extra.
5. **Tabla `inscripciones` + inscripción a curso gratuito** — versión
   mínima del Flujo 5 sin pagos, para validar el camino completo
   registro → academia → curso → inscripción → contenido.
6. **Integración de pagos** (un solo proveedor) — se suma al final porque es
   la pieza más costosa y la única que depende de una cuenta externa
   (Stripe/Mercado Pago) fuera del control del equipo.
