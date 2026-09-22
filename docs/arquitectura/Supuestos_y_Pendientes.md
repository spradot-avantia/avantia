# Supuestos y Pendientes — síntesis de ADRs y TODOs

> Este documento no es un ADR nuevo: recopila en un solo lugar decisiones que
> ya están tomadas pero dispersas como comentarios/TODOs en el código, y las
> clasifica según qué tan firmes son. Se actualiza cada vez que se resuelve un
> pendiente o aparece uno nuevo — no queda congelado en la fecha de creación.

## Cómo leer los estados

- **Asegurado** — esto debe ser así por el modelo de negocio o de datos, no es
  una preferencia de implementación. Cambiarlo implica repensar el diseño, no
  solo reemplazar una pieza.
- **Provisional** — funciona y se adoptó a propósito, pero solo hasta
  encontrar algo mejor. Cambiarlo no debería requerir tocar el modelo, solo la
  pieza puntual.
- **Pendiente** — no está resuelto todavía; hoy es un hueco, no una decisión.

---

## Asegurado

| Tema | Por qué | Fuente |
|---|---|---|
| Aislamiento multi-tenant vía `tenant_id` + RLS en toda tabla de negocio | Es la garantía de que un tenant no puede ver datos de otro aunque haya un bug en el código de la app — la base de datos lo bloquea, no la aplicación | [Arquitectura §1](Avantia_Estructura_Codigo_Arquitectura.md), [schema.sql](../../db/schema.sql) |
| Un solo proyecto Next.js para panel + sitio público + API | Decisión revertida una vez ya (ADR 001 → ADR 002) tras medir el costo real de SEO/SSR de tenerlo separado; no se vuelve a abrir sin un motivo nuevo | [ADR 002](../decisiones/002-vuelta-a-nextjs.md) |
| Dos clientes de Supabase separados (`server.ts` con RLS vía sesión, `admin.ts` con service role) | Existen separados a propósito para que sea imposible usar `admin.ts` por error donde no corresponde | [Arquitectura §1](Avantia_Estructura_Codigo_Arquitectura.md#por-qué-esta-forma-y-no-otra) |
| `middleware.ts` no consulta la base de datos | Corre en el edge en cada request; consultar ahí sería costoso a escala | [ADR 002](../decisiones/002-vuelta-a-nextjs.md), [Arquitectura §5](Avantia_Estructura_Codigo_Arquitectura.md) |
| Un único endpoint centralizado para llamadas al LLM | Facilita controlar costos y cambiar de proveedor sin tocar el resto de la app | [ADR 001](../decisiones/001-migracion-nextjs-a-node-react.md) |

## Provisional (asegurado hasta encontrar algo mejor)

| Tema | Por qué está así ahora | Qué lo reemplazaría |
|---|---|---|
| Cache en memoria de `lib/tenant/resolve.ts` con TTL de 60s | Evita pegarle a Supabase en cada render sin agregar infraestructura nueva | Invalidación activa cuando el tenant cambia su config (logo, dominio), si 60s de desfase deja de ser aceptable |
| Filtrado explícito por `tenant_id` a nivel de aplicación además de RLS | RLS es la última línea de defensa, pero repetir el filtro en cada query es manual y depende de que nadie lo olvide | Un helper/repositorio central que fuerce el filtro por `tenant_id` en cada acceso, en vez de confiar en que cada desarrollador lo escriba a mano |
| Dashboard y admin de dominio operan sobre un tenant fijo (`DEMO_TENANT_SLUG`) | Permite tener las páginas funcionando para la demo sin esperar a construir login | Sesión real (Supabase Auth) + tabla de membresías profesor↔tenant, que derive el tenant del usuario logueado en vez de una env var |
| Admin de dominio guarda el dominio en Supabase pero no lo verifica ni provisiona de verdad (mock: estado y registros DNS son fijos) | Alcanza para demostrar el flujo de UI sin depender de tener ya una cuenta de Vercel con dominio propio configurado | Llamada real a la Vercel Domains API (`POST /v10/projects/{id}/domains`), ya marcada como comentario en `app/api/tenants/domain/route.ts`, una vez exista el proyecto de Vercel |
| `auth_tenant_id()` asume un usuario por tenant (toma la primera fila de `membresias`, sin orden garantizado) | Todavía no hay UI ni flujo para que un profesor pertenezca a varios tenants | Si un usuario necesita pertenecer a más de un tenant, `auth_tenant_id()` deja de alcanzar y hace falta resolver el tenant activo por sesión/selección explícita, no por lookup directo |

## Pendiente (todavía no definido)

| Tema | Estado actual | Fuente |
|---|---|---|
| Resolución del tenant por sesión en `generar-curso` | Hoy se recibe el `tenant_id` en el body del request en vez de derivarlo de la sesión del usuario logueado | TODO en `app/api/ai/generar-curso/route.ts`, señalado también en [ADR 002](../decisiones/002-vuelta-a-nextjs.md#consecuencias) |
| Onboarding de Stripe Connect / Mercado Pago Connect | No hay documentado cómo un tenant conecta su cuenta para recibir el split payment, ni qué pasa si no lo hace | — |
| Separación de rol "equipo de Avantia" vs. "dueño de una academia" | Sin auth, ambos paneles (el interno de Avantia y el de cada tenant) conviven en el mismo host de panel sin ninguna distinción de acceso | `app/(dashboard)/page.tsx` |

---

## Cómo se actualiza este documento

- Un pendiente que se resuelve con una decisión de arquitectura se documenta
  primero como ADR nuevo en `docs/decisiones/`, y después se borra de este
  archivo (no se marca "resuelto" acá, la fuente de verdad pasa a ser el ADR).
- Un TODO nuevo que aparezca en el código y afecte el modelo de datos o
  multi-tenancy debería sumarse aquí, no quedar solo como comentario suelto.
