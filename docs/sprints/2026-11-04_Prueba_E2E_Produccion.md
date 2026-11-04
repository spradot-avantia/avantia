# Prueba E2E en producción — 2026-11-04

Recorrido con Playwright (Chrome real) en `goavantia.com`: creador (Google) crea y publica un curso; alumno de prueba se registra, es invitado, cursa y completa. Alumno a 390 px.

Curso creado: «Claude para analítica de datos» (3 módulos, 6 lecciones de texto, 3 quizzes de 3 preguntas). Alumno: `samuelpradoet+alumno1@gmail.com`.

## Resultado

Flujo completo OK: crear → publicar → registrar alumno → ingreso → lecciones → «Curso completado» (170 XP, nivel 2, insignia) → el creador ve 100 % (6/6).
**No cubierto:** el alumno nunca ve los quizzes (B-17), no hay correo de invitación (B-18), no hay lecciones de video (sin enlaces reales), no hay pago (B-22).

## Fallas funcionales

| # | Hallazgo | Severidad |
|---|---|---|
| F1 | Autoguardado del editor pierde títulos de lección al escribir rápido (5 de 6 quedaron «Nueva lección»; el texto sí se guardó) | Alta |
| F2 | El slug del curso no sigue al título (`curso-sin-titulo-2`); se comparte en el enlace público | Alta |
| F3 | Editor de quiz: al abrir/cerrar mientras guarda quedaron una pregunta vacía y una duplicada | Media |
| F4 | Pasos 4 (Modalidad) y 5 (Acceso) salen con ✓ sin haberlos tocado | Baja |
| F5 | Inicio del creador dice «Avance de estudiantes: Sin datos todavía… cuando conectemos la experiencia del estudiante» con un alumno al 100 % | Media |
| F6 | Alumno registrado por el creador aparece como «Registrado, aún sin entrar» aunque ya tenía cuenta; no hay aviso de que alguien intentó entrar a un curso solo-invitados | Media |
| F7 | Un alumno sin invitación puede crear cuenta y solo ve «pídele a la academia que te invite»; sin botón «Solicitar acceso» | Media |
| F8 | El saludo y el encabezado usan «Alumno» en vez del nombre registrado | Baja |
| F9 | Sin correo de confirmación/invitación verificable por el equipo: no se puede probar sin acceso a un buzón (usar buzón de pruebas) | Proceso |

## Correcciones posteriores

- **F3 y F8 no eran fallas:** la pregunta duplicada la dejó una corrida interrumpida de la prueba automatizada, y «Alumno» era el primer nombre de la cuenta de prueba («Alumno Prueba E2E»).
- **Panel creador sin ancho completo (auditoría 1):** era un artefacto de la captura (la ventana de Chrome tiene un ancho mínimo), no un fallo de maquetación. Verificar en móvil real.
- **Causa de F1:** al cambiar el formato de una lección se cancelaban todos los guardados pendientes de esa lección, incluido el título.

## Estado de la corrección (en `dev`, sin commit)

F1 título perdido ✔ · F2 enlace sigue al título hasta la primera publicación ✔ (el curso ya publicado conserva `curso-sin-titulo-2`) · F4 ✓ solo en pasos visitados ✔ · F5 avance promedio real en el inicio ✔ · F6 invitación con cuenta activa figura «Ya entró» ✔ · F7 «Solicitar acceso» ✔ (en cursos por invitación, el alumno sin invitación pide acceso desde la ficha; queda pendiente en la bandeja del creador) · quiz del estudiante ✔ (ADR 023 Aceptada, migración `0011` aplicada, 9 pruebas RLS nuevas) · auditoría: 2–10 ✔ (8: tamaños con tokens y título de módulo en peso medio; 10: pasos en una fila desde 1100 px y texto del quiz sin promesas no implementadas). Falta verificar en dispositivo real (contraste AA, targets, foco, reduced-motion).

## Auditoría UX/UI (alumno 390 px y panel creador 390 px)

1. **Panel creador en móvil no ocupa el ancho:** el contenido mide ~329 px de 390 (franja vacía a la derecha). Revisar contenedor/overflow del layout `(dashboard)`.
2. **Encabezado del alumno gasta ~130 px:** «Mis cursos · Mi progreso · Alumno» y «Salir» en una segunda fila. Pasar a barra compacta o menú; «Alumno» no es un enlace pero se ve como uno.
3. **Título repetido en la lección:** h1 de la página y h1 del texto (si el creador pega un `#`, se duplica). Degradar `#` del contenido a h2 o quitar el título repetido.
4. **Etiqueta de módulo redundante:** «MÓDULO 1 · MÓDULO 1: PENSAR…». Mostrar solo «Módulo 1» + nombre, o quitar el prefijo si el nombre ya lo trae.
5. **Pastilla «+10 XP» ambigua:** aparece en negro sobre el título tras completar la lección anterior; parece un botón. Convertirla en toast/chip con texto («+10 XP ganados») y retirarla al rato.
6. **Botón principal inconsistente:** «Marcar como completada» queda a la derecha en la lección 1 y a la izquierda en la 2; en móvil debería ser ancho completo y fijo al pie.
7. **Falta guía al terminar:** tras marcar, salta a la siguiente lección sin confirmación visible de avance; la barra «Tu avance» queda al final, bajo el scroll. Subir un indicador de progreso al encabezado.
8. **Jerarquía tipográfica:** cuerpo bien (16 px, buena interlínea), pero títulos de módulo en la ficha y la lección compiten (negrita grande en ambos). Revisar escala con `Sistema_Diseno_Avantia.md`.
9. **Inicio del creador:** el bloque «Sube el logo» (azul) y «Siguiente paso» compiten; los 4 pasos «Hecho» repiten «Hecho» dos veces por fila; «Próximas sesiones en vivo» ocupa espacio sin función. Ordenar por prioridad y ocultar lo completado.
10. **Editor de curso:** los 6 pasos envuelven en dos filas; el editor de quiz es largo (explicación de XP antes que las preguntas en móvil). Priorizar preguntas.

Pendiente de verificar con un dispositivo real: contraste AA, targets ≥ 44 px, foco visible y `prefers-reduced-motion`.
