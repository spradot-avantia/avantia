# Revisión de flujos (Inkodo, 2026-10-12)

Fuente: `Inkodo-10122026_70639_PM.pdf` (3 págs: Viaje del Creador, Curso, Viaje del Alumno). Anotaciones manuscritas en rojo (cambios/preguntas), verde (aprobado/decisión técnica) y negro (checks).

## 1. Comentarios anotados

### Viaje del creador
| Pantalla | Comentario | Tipo |
|---|---|---|
| Entrada (design partner) | Aprobado | ✔ |
| CR-01 Crear cuenta | Solo con Google (tachado "correo/contraseña"); "usuario pass" como alternativa. Aprobado | Cambio |
| Landing Avantia (nueva) | Agregar landing: ¿Qué hace? ¿Cómo? CTA, testimonios, Signup/Signin | Nuevo |
| CR-02 Revisa correo | MFA y validar correo (marcado "CR02'") | Cambio |
| CR-03 Nombra academia | Validar ruteo de middleware | Técnico |
| Subdominio disponible = No | "?" sobre "alternativas sugeridas": decisión pendiente. Nota "Etapa 2: Escalabilidad" y "Elige otro" | Pregunta |
| Sistema: crear tenant_id + rol Dueño + tema base | Aprobado | ✔ |
| CR-04 Identidad visual | Genérico: iniciales de la academia (en lugar de logo/favicon subido). Marcado como pendiente de revisión | Cambio |
| CR-05 Vista previa | Marcado. Contenido definido: Landing, Login, Cursos/Inicio, Contenido (syllabus + video) | Definición |
| Ajuste sugerido de contraste | Aprobado | ✔ |
| CR-06 Panel del creador | Aprobado (flecha a "Fuera MVP" y a Flujo 2) | ✔ |
| CR-07/08/09 Dominio propio | ¿Qué pasa cuando ya existe un dominio registrado? ¿Cómo migrarlo a nuestro IP? Proveedores citados: NIC (Chile), GoDaddy, Spaceship (dominio); Wix, WP, AWS (páginas web). Verificación DNS automática aprobada | Pregunta |
| CR-10 Publicar | Marcado | – |
| **CR-11 (nuevo)** | Dashboard del creador / admin (con asterisco = prioridad) | Nuevo |

### Curso
| Pantalla | Comentario |
|---|---|
| CU-01 Datos del curso, CU-02 Editor de temario | Aprobados |
| CU-03 Nueva lección, tipo de contenido | Video por enlace YouTube/Vimeo (encerrado); PDF/archivo tachado (X) → "Video + texto" solamente |
| CU-05 Acceso al curso | Aprobado; eliminar "por invitación" (tachado) |
| CU-06 Vista previa, CU-07 Editar publicado | Aprobados |
| "¿Academia ya publicada?" + "Flujo 1 volver al checklist" | Tachados (eliminar) |

### Viaje del alumno
| Pantalla | Comentario |
|---|---|
| N-01 ¿Dominio de academia activa? | Aprobado. Middleware: ruteo del dominio |
| AL-01 | Tachado/revisar (catálogo) |
| AL-02 Ficha del curso | Aprobado |
| ¿Sesión activa en esta academia? | Aprobado |
| AL-03 Crear cuenta/ingresar | Aprobado |
| N-03 ¿Credenciales válidas en esta academia? | **Por tenant** (sesión/credenciales aisladas por academia) |
| Flujo "por invitación" | Sin comentario de eliminación explícito, pero consistente con CU-05 |
| AL-04, AL-05, Marcar completada (automático video) | Aprobados |
| Estado Completado | **Quiz de término** (nuevo) |
| AL-07 Curso completado | Aprobado |

## 2. Síntesis

### Decisiones tomadas (alcance MVP)
1. **Registro del creador solo con Google** (+ MFA/validación de correo).
2. **Lecciones solo video (enlace YouTube/Vimeo) + texto**; sin archivos/PDF.
3. **Sin cursos por invitación**; acceso abierto. Se elimina la rama "por invitación" y la lista de correos del creador.
4. **Eliminar** la decisión "¿Academia ya publicada?" y el retorno al checklist.
5. **Identidad visual genérica** con iniciales de la academia.
6. **Multi-tenant estricto**: credenciales y sesión **por tenant**; middleware de ruteo por dominio/subdominio es pieza crítica.

### Nuevos elementos a diseñar
- **Landing de Avantia** (qué hace, cómo, CTA, testimonios, signup/signin).
- **CR-11 Dashboard del creador/admin** (prioridad alta).
- **Quiz de término** de curso (alumno).
- Vista previa de academia con 4 vistas: Landing, Login, Cursos/Inicio, Contenido (syllabus + video).

### Preguntas abiertas
- Subdominio no disponible: ¿se ofrecen alternativas sugeridas o solo "elige otro"? (se anota "Etapa 2: escalabilidad").
- **Dominio propio ya registrado**: ¿cómo lo apuntamos a nuestra IP? Hay que documentar guía por proveedor: registradores (NIC Chile, GoDaddy, Spaceship) y hosting web (Wix, WordPress, AWS). ¿Dominio propio entra en MVP o Etapa 2? El diagrama lo dibuja "HITO DEL MVP".
- ¿Usuario + password queda como alternativa a Google o se descarta? (anotación ambigua: "Iniciar sesión con Google / o usuario pass").
- Quiz de término: ¿obligatorio para marcar completado? ¿tipo de preguntas? ¿nota mínima?

### Riesgos técnicos señalados
- Middleware de ruteo (CR-03, N-01): resolución de tenant por host, 404 neutro marca Avantia.
- Aislamiento de cuentas de alumno por tenant (mismo correo, distintas academias).
- Verificación DNS/CNAME + emisión SSL para dominios propios.

### Siguientes pasos sugeridos
1. Actualizar los diagramas y tablas CR/CU/AL con las decisiones (CR-01, CR-04, CU-03, CU-05, quitar nodos tachados).
2. Especificar CR-11, landing y quiz (nuevos códigos de pantalla).
3. Resolver las 4 preguntas abiertas antes del sprint.
4. Documentar spike técnico: middleware multi-tenant + dominio propio.
