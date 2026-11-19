# Glosario de Avantia

**Fecha:** 2026-11-19 · **Estado:** "Avanter" es una propuesta del equipo y se valida en las entrevistas antes de usarlo en la UI.
Este glosario absorbe la tabla "Lo que dejamos de decir" de `docs/presentaciones/v3/copy/Pitch_estructura.md`, que sigue vigente para el pitch.

## Avanter

**Definición:** experto en su área que ya enseña online (en vivo, en grupo o acompañando a sus alumnos) y usa Avantia para tener su propia academia, con su marca, y saber cuánto aprende cada alumno.

**En una frase (para el pitch):** *"Un Avanter es un experto que ya hace clases online: un coach, una consultora, un especialista. Avantia le da su academia y le muestra quién entendió y quién necesita ayuda."*

**Qué lo distingue:**

| No es… | Porque… |
|---|---|
| Un creador de contenido o influencer | Su activo es lo que sabe y cómo enseña, no la audiencia. Puede tener pocos seguidores (el 74 % de los productores que crecen tiene menos de 50 mil, según Hotmart; parcial) |
| Un infoproductor de marketplace | No compite en una vitrina con cientos de cursos iguales: vende a su comunidad, con su nombre |
| Un profesor de colegio o universidad | Enseña por cuenta propia y cobra directamente (por ahora no apuntamos a instituciones) |

**Ejemplos:** una coach de liderazgo con programas de 8 semanas, un contador que enseña tributación a pymes, una fotógrafa con talleres en grupo, un consultor de datos que capacita equipos.

**Por qué un nombre propio:** "experto" o "creador" no cuentan lo que hace ni lo diferencian del infoproductor. Un término propio ayuda a que la persona se identifique y a construir comunidad (como los *Keepers* de otras marcas). Inspiración: la nota del deck V6, slide 5.

## Dónde se usa y dónde no

| Contexto | Término |
|---|---|
| Pitch, deck, video, redes, landing (marketing) | **Avanter**, explicado la primera vez: "Avanters: expertos que ya enseñan online" |
| Panel del Avanter (UI) | Se mantiene "tu academia" / "tú"; no se nombra al usuario. Cambiar la UI requiere validar primero |
| Términos y privacidad | "Creador" (definido en `terminos`); no se cambia sin revisión legal |
| Lo que ve el alumno | "Tu profesor" / el nombre de la academia. **Nunca** "Avanter" dentro de una academia (es marca de Avantia, y las academias no muestran la marca Avantia) |
| Código y base de datos | `creador`, `tenants` (sin cambios) |

## Otros términos

| Término | Uso |
|---|---|
| Academia | El sitio del Avanter, con su marca y dominio (un tenant) |
| Alumno / estudiante | Quien toma cursos en una academia. En la UI del alumno, "tú" |
| Dominio | Cuánto sabe el alumno: preguntas dominadas ÷ preguntas totales (ADR 025). **No confundir con avance** |
| Avance | Lecciones completadas ÷ totales. No mide aprendizaje |
| Necesita ayuda | Alumno con dominio bajo, preguntas falladas sin recuperar o 7+ días sin entrar (panel de Inicio) |
| Repaso | Preguntas que vuelven días después (repaso espaciado, ADR 024) |

## Validación pendiente
En las entrevistas (`Mercado_Segmento_Expertos_Entrevistas.md`), mostrar la frase de definición y preguntar: "¿Te sentirías identificado? ¿Cómo le explicarías a otro lo que haces?". Si menos de la mitad se identifica, se vuelve a "expertos que ya enseñan online" y este glosario se actualiza con la fecha y el motivo.

## Cambios
- 2026-11-19: se crea el glosario y se propone "Avanter" (pedido de Samuel). Se usa en el deck y en la landing: overline y llamado del programa fundador.
