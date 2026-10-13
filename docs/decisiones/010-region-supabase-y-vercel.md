# 010 — Región de Supabase y de las funciones de Vercel

- **Fecha:** 2026-10-12
- **Estado:** Aceptada (2026-10-12): Supabase movido a sa-east-1 (São Paulo)

## Contexto

El proyecto Supabase está en **us-east-2 (Ohio)**. Desde la máquina de desarrollo en Chile se midieron ~200 ms por llamada a Supabase (Auth `getUser` ~213 ms, REST ~179 ms; mediana de 6 muestras). Una navegación autenticada del panel encadena varias llamadas (sesión, tenant, datos de la página), por lo que la latencia entre las funciones de Vercel y la base de datos domina el tiempo de respuesta, no el peso del frontend (JS compartido ~87 KB).

Hoy no hay región de funciones configurada: Vercel usa su valor por defecto (iad1, N. Virginia). La audiencia objetivo es Chile y LatAm hispanohablante.

## Decisión (propuesta)

1. **Ahora, sin costo:** fijar la región de funciones de Vercel en la más cercana a Supabase, **cle1 (Cleveland)**, con iad1 como alternativa. Se configura en Vercel → Settings → Functions → Function Region (o `regions` en `vercel.json` si el Root Directory lo permite). Cada llamada servidor→base baja de ~200 ms (desde Chile) a un dígito o decenas de ms.
2. **Antes del primer partner con datos reales:** evaluar mover Supabase a **sa-east-1 (São Paulo)** junto con funciones en **gru1**. Un proyecto Supabase no cambia de región: implica crear un proyecto nuevo, reaplicar `schema.sql` y migraciones, el seed, la configuración de Auth y actualizar variables de entorno. Hoy casi no hay datos, así que el costo es mínimo y crece con cada tenant.

## Alternativas

| Opción | Ping usuario→función (Chile) | Función→DB | Costo de cambio |
|---|---|---|---|
| A. Ohio + funciones en cle1/iad1 | ~150–200 ms (estimado) | ~5–15 ms | Ninguno |
| B. São Paulo + gru1 | ~30–60 ms (estimado) | ~5–10 ms | Un proyecto nuevo, hoy barato |
| C. Estado actual (sin región fijada) | ~150–200 ms | puede ser distinta de Ohio | Ninguno, pero impredecible |

Las cifras de A y B son estimaciones, no mediciones. Ahorro esperado de B sobre A: ~100–150 ms por navegación del panel.

## Consecuencias

- Con A se elimina el sobrecosto de las ~4 llamadas encadenadas a Supabase; con B además se acorta el trayecto del usuario.
- Los assets estáticos salen del CDN de Vercel en ambos casos.
- Medir con usuarios reales antes de decidir B: Web Vitals por tenant (TTFB, LCP) y tiempo de respuesta de Server Actions.
- La caché en memoria de `lib/tenant/resolve.ts` no se comparte entre instancias serverless; con la base cerca deja de ser crítica.

## Resultado

Samuel migró el proyecto Supabase a sa-east-1. Falta fijar las funciones de Vercel en gru1 y volver a medir latencia (misma prueba: Auth getUser y REST, mediana de 6 muestras).

## Pendiente

- Confirmar si el proyecto ya está desplegado en Vercel y cuál es su Root Directory.
- Verificar disponibilidad y precio de sa-east-1 en el plan de Supabase contratado.
