# Plan: Repositorio de Documentación y Código para Avantia

## Objetivo
Centralizar código, documentación de arquitectura y decisiones técnicas en un único
repositorio privado de GitHub, con Claude Code integrado para mantenerlo actualizado,
y Vercel conectado para despliegue automático desde el mismo flujo de trabajo.

---

## 1. Estructura del repositorio

Un solo repositorio privado en GitHub, con dos carpetas principales en la raíz:

- /app          -> código de la aplicación (Next.js)
- /docs         -> documentación del proyecto en markdown (funciona también como
                    vault de Obsidian abierto localmente)

Dentro de /docs, sub-carpetas sugeridas:

- /docs/arquitectura       -> el documento de arquitectura ya creado, más futuros
                               documentos técnicos
- /docs/decisiones         -> un registro de decisiones (ADRs): cada decisión
                               importante en su propio archivo corto, con fecha,
                               contexto, alternativas descartadas y razón elegida
                               (ej: 001-eleccion-vercel-vs-cloudflare.md)
- /docs/sprints            -> notas de cada sprint, hitos, tareas completadas
- /docs/skills             -> definiciones de Skills de Claude Code para este
                               proyecto (ver sección 4)

## 2. Acceso y permisos

- Repositorio privado de GitHub (gratis, sin límite de colaboradores en cuentas
  personales para repos privados).
- Agregar como colaboradores: Samuel, la CEO (amiga), el hermano developer.
- Los tres clonan el repositorio localmente. Quien quiera usar Obsidian, abre la
  carpeta /docs como vault local de Obsidian -- GitHub sigue siendo la fuente de
  verdad y el mecanismo de sincronización entre los tres, no Obsidian Sync ni
  Google Drive.

## 3. Integración con Vercel

- Conectar el repositorio de GitHub directamente al proyecto de Vercel (integración
  nativa de la app de GitHub de Vercel, no requiere escribir un workflow de GitHub
  Actions para el despliegue en sí).
- Comportamiento resultante:
  - Cada Pull Request genera automáticamente un despliegue de vista previa con URL
    única (para revisar cambios antes de aprobarlos).
  - Cada push a la rama principal (main) despliega automáticamente a producción.
- Variables de entorno del proyecto (conexión a base de datos, llaves de API) se
  configuran una sola vez en el panel de Vercel, no se suben al repositorio.

## 4. GitHub Actions + Claude Code

GitHub Actions se usa para lo que Vercel no cubre de forma nativa: automatizaciones
alrededor del código antes o después de cada cambio.

Flujos sugeridos para configurar:

a) Revisión automática de Pull Requests con Claude Code
   - Se dispara cada vez que se abre o actualiza un Pull Request.
   - Claude Code revisa el código nuevo y comenta directamente en el PR.
   - Regla especial a validar en cada revisión: ninguna tabla nueva en la base de
     datos debe crearse sin su política de aislamiento por tenant (Row-Level
     Security), como quedó definido en el documento de arquitectura.

b) Actualización asistida de documentación
   - Cuando un cambio de código es significativo (ej: se agrega un módulo nuevo,
     se cambia el modelo de datos), Claude Code puede ayudar a reflejar ese cambio
     en /docs/arquitectura, para que la documentación no quede desactualizada
     respecto al código real.

c) Registro de decisiones
   - Cuando en una conversación con Claude se toma una decisión de arquitectura
     (como Vercel sobre Cloudflare, o el modelo de multi-tenancy), esa decisión se
     redacta como un nuevo archivo corto en /docs/decisiones dentro del mismo
     repositorio, para que quede trazada sin tener que salir a buscarla en otro
     lugar.

Nota sobre costos: GitHub Actions incluye minutos gratuitos mensuales para
repositorios privados, con límite pero suficiente para el volumen de un equipo de
dos a tres personas en esta etapa.

## 5. Skills de Claude Code dentro del repositorio

Se definen instrucciones reutilizables (Skills) guardadas en /docs/skills, para que
Claude Code siga el mismo criterio cada vez que trabaja en este proyecto específico,
sin tener que repetir el contexto en cada sesión. Ejemplos de Skills a definir:

- Cómo actualizar el documento de arquitectura siguiendo el formato ya establecido.
- Cómo aplicar el patrón de aislamiento por tenant (tenant_id + RLS + índice
  compuesto) cada vez que se crea una tabla nueva.
- Cómo redactar una entrada nueva en el registro de decisiones.

## 6. Orden de implementación sugerido

1. Crear el repositorio privado en GitHub y agregar a los tres colaboradores.
2. Subir la estructura de carpetas /app y /docs (mover ahí el documento de
   arquitectura ya creado, dentro de /docs/arquitectura).
3. Conectar el repositorio al proyecto de Vercel (despliegue automático).
4. Clonar el repositorio localmente cada uno; quien use Obsidian, abre /docs como
   vault.
5. Configurar el primer flujo de GitHub Actions: revisión de Pull Requests con
   Claude Code.
6. Redactar las primeras Skills en /docs/skills (empezando por la de aislamiento
   por tenant, que es la más crítica dado que el aprendiz va a estar creando
   tablas nuevas seguido).
7. Crear el primer archivo en /docs/decisiones, documentando la elección de
   Vercel sobre Cloudflare como decisión ya tomada.
