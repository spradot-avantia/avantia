# 037 — Dos proyectos de Supabase: dev y producción

- **Fecha:** 2026-11-07
- **Estado:** Aceptada (Samuel pidió separar los entornos y documentarlo el 2026-11-07)

## Contexto

Hasta ahora existía un solo proyecto de Supabase, el de producción. El deploy de `dev` en Vercel usaba sus credenciales, así que cualquier prueba (logins sembrados, academias de prueba, auditorías de interfaz) escribía en la base real. Además, la sesión de trabajo con Claude Code tenía conectado solo el MCP de producción.

## Decisión

Hay **dos proyectos de Supabase**, y no se mezclan nunca:

| | Producción | Dev |
|---|---|---|
| Ref del proyecto | `owjhakhkdqmcykvtmbox` | `kdvquarwgawaozyzllmd` |
| URL | `https://owjhakhkdqmcykvtmbox.supabase.co` | `https://kdvquarwgawaozyzllmd.supabase.co` |
| Lo usa | Vercel **Production** (rama `master`, `www.goavantia.com`) | Vercel **Preview** (rama `dev`, `www.dev.goavantia.com`) |
| Datos | Reales | De prueba; se pueden borrar |
| MCP en Claude Code | `supabase` | `supabase-dev` |
| Token (variable de sistema) | `AVANTIA_SUPABASE_TOKEN` | `SUPABASE_ACCESS_TOKEN_DEV` |

Reglas:

1. **Por defecto se trabaja contra `supabase-dev`.** Una migración se aplica primero en dev, se prueba, y solo después se aplica en producción, cuando Samuel lo pide.
2. **Nada se escribe en producción por el MCP `supabase` sin una instrucción explícita** de Samuel para ese cambio. Aprobar un cambio en dev no autoriza aplicarlo en producción.
3. **Antes de cualquier escritura** (migración, `execute_sql` que modifique datos), confirmar con `get_project_url` del servidor elegido que el ref es el esperado.
4. Los datos de prueba (logins sembrados, tenants de auditoría) viven solo en dev. Si por una razón excepcional hay que sembrar en producción, se borra el seed al terminar y se verifica con SQL.
5. Las variables de entorno de Vercel se cargan por entorno: Production con las claves del proyecto de producción, Preview con las de dev. La plantilla es `apps/web/.env.dev.example`.
6. Los dos tokens son Personal Access Tokens de la cuenta de Samuel, así que **alcanzan ambos proyectos**; lo que limita cada MCP es el `--project-ref` de `.mcp.json`. Nunca se escriben en el repo: van como variables de sistema.

## Estado del proyecto dev (2026-11-07)

Se aplicó `db/schema.sql` completo en 4 migraciones (`esquema_base_01` a `esquema_base_04`). Incluye los buckets `logos` (público) y `materiales` (privado). Se comparó contra producción: columnas, índices, políticas RLS, funciones, triggers, tablas con RLS y buckets son idénticos. La única diferencia es el nombre de dos restricciones `check` (`lecciones_duracion_min_check` y `modulos_duracion_min_check` en dev; `..._duracion_check` en producción), con definición igual.

Hallazgo: `schema.sql` no se podía aplicar sobre una base vacía, porque `materiales` referenciaba `lecciones (id, tenant_id)` antes de que existiera esa clave única (se creaba más abajo, en la sección de 0003). En producción funcionó porque las migraciones se aplicaron una a una. Se corrigió declarando la clave dentro de `create table lecciones`.

Pendiente en dev: registrar un usuario y agregarlo a `staff` (o definir `STAFF_EMAILS`), y configurar en Supabase Auth la Site URL y las Redirect URLs de `https://www.dev.goavantia.com`.

## Alternativas descartadas

- **Ramas de base de datos de Supabase (branching):** cuestan por hora de cómputo y parten sin datos ni usuarios; un proyecto aparte es más simple para un equipo de este tamaño.
- **Un solo proyecto con un tenant "de pruebas":** no separa las credenciales ni protege los datos reales de un error en dev.
- **Supabase local con Docker:** no sirve para el deploy de Vercel en `dev`.

## Consecuencias

- Hay dos esquemas que mantener alineados: cada migración nueva en `db/migrations/` se aplica en ambos (dev primero) y se refleja en `schema.sql`.
- Cada vez que se crea un recurso fuera del esquema (bucket, función, extensión), debe quedar en `schema.sql` para que dev no se desfase.
- Un error de proyecto al usar los MCP ahora es posible; por eso la regla 3.
- **Los despliegues de Preview no se indexan** (2026-11-07). Si se quita la protección de despliegues de Vercel para poder probar dev, el sitio sería público. Por eso, cuando `VERCEL_ENV=preview`, `robots.txt` cierra todo (`Disallow: /`, sin sitemap) y `next.config.mjs` agrega `X-Robots-Tag: noindex, nofollow, noarchive` a todas las respuestas, incluido el sitio público de cada academia. En producción y en local no cambia nada. Verificado con un build de Preview y uno de producción; pruebas en `src/lib/seoPreview.test.ts`.
