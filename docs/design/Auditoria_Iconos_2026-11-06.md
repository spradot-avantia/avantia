# Auditoría de íconos — plataforma Avantia (2026-11-06)

Alcance: lectura del código de `apps/web/src` (alumno, creador, sitio público). No se revisó en navegador; las prioridades son criterio de diseño, no medición con usuarios.

## Estado actual

- **Alumno:** set nuevo duotono en `components/alumno/Iconos.tsx` (cohete, medalla, trofeo, rayo, estrella, libros, diana, usuario, correo, candado, escudo, calendario, llama), ya en Mi progreso, Insignias, Mi perfil, el aviso de XP y la insignia del quiz. La barra inferior tiene íconos de trazo propios (`TabsAlumno`).
- **Creador:** íconos de trazo solo en la navegación (`NavLinks`), vacíos (`EmptyState`), marca y auth.
- **Landing:** set propio (`marketing/icons.tsx`); no se toca (no es tenant).
- **Sitio de la academia (`components/sitio`):** sin íconos.
- **Duplicación:** hay cuatro sets sueltos (alumno, academia, marketing, SVG en línea). Falta una fuente única para alumno + creador.

## Hallazgos y prioridad

**Alta — texto-glifo que debería ser ícono (se ven distinto en cada dispositivo y fallan con lectores de pantalla):**

| Dónde | Hoy | Propuesta |
|---|---|---|
| `SyllabusCurso` (estado de lección y quiz) | `✓`, `≡` | check en círculo, candado (lección sin liberar), punto de «en curso», diana para el quiz |
| `QuizPlayer` (acierto/error) | `✓` `✕` | check y equis en círculo; el color no debe ser la única señal |
| `ShellCurso` (ocultar syllabus) | `▶` `◀` | chevrones o ícono de panel lateral |
| `PanelPlegable` | `▴` `▾` | chevron que rota |
| `AccionesFila` del editor | `↑` `↓` `✕` | flechas, papelera con `aria-label` |
| `EditorCurso`, `EditorLecciones` | `←`, `→` en botones | flecha en ícono, mismo tamaño |

**Alta — información que hoy es solo texto y mejora con ícono:**

- **Tipo de lección** (video, texto, documento) en el syllabus, el índice y el editor: hoy hay que leer. Un ícono por tipo permite escanear el curso de un vistazo (móvil).
- **Materiales** (`MaterialesLeccion`, `EditorMateriales`): archivo vs enlace, y tipo de archivo (PDF, imagen).
- **Mis cursos:** repaso de hoy (ícono de repetir, ya existe en la barra), curso completado (trofeo) y estados de inscripción (`EstadoBadge`: reloj para pendiente, check para activa).
- **Completado:** «Lo que ahora puedes hacer» y «Tu insignia» sin ícono; es el momento emocional del producto.

**Media:**

- **Creador, Kpis** (`Kpis.tsx`): cuatro cifras sin ícono; ícono pequeño por KPI (publicados, borradores, estudiantes, avance).
- **Creador, Callout:** el tono (info, éxito, aviso, peligro) se distingue solo por color; agregar ícono por tono (accesibilidad AA, no depender del color).
- **Estudiantes del creador:** estado de avance, riesgo de abandono y dominio.
- **Insignias futuras:** cada nueva insignia necesita ícono propio; conviene definirlas con el ADR de gamificación del MVP.

**Baja:**

- **Sitio público de la academia:** beneficios, «qué aprenderás», duración y modalidad en la ficha del curso; cuidar que sean neutros (nunca marca Avantia).
- **Formularios de auth:** ojo para mostrar/ocultar contraseña, y íconos en los campos.

## Recomendación

1. **Unificar** `alumno/Iconos.tsx` en `components/ui/Iconos.tsx` (alumno + creador) con las mismas reglas: `currentColor`, `aria-hidden` cuando acompaña texto, `aria-label` cuando el ícono es el único contenido.
2. **Primero lo de prioridad alta** (reemplazar glifos y agregar tipos de lección): es accesibilidad y consistencia, cambio acotado y sin migración.
3. Mantener **un solo estilo** (duotono 1.7 px) y no sumar librerías: el set propio es chico y evita una dependencia.
4. Verificar en 360–390 px, con `prefers-reduced-motion` y en alto contraste.

No se registró ADR: es una decisión de diseño de implementación, no de arquitectura. Si se unifica el set en `components/ui`, conviene anotarlo en `Sistema_Diseno_Avantia.md`.
