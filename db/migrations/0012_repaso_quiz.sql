-- 0012_repaso_quiz.sql
-- Soporte del repaso espaciado (ADR 024): lectura ACOTADA de las respuestas de un
-- alumno. Idempotente.
--
-- Escala: la consulta nunca recorre las respuestas de otros alumnos ni otras
-- academias (parte de tenant_id + alumno_id), solo mira preguntas que el alumno
-- alguna vez falló y, de cada una, las últimas N respuestas (N <= 20, por defecto 8).
-- El calendario se calcula en la aplicación con reglas puras sobre esa ventana.

create index if not exists quiz_respuestas_tenant_alumno_pregunta_fecha_idx
  on quiz_respuestas (tenant_id, alumno_id, pregunta_id, created_at desc);

-- Parcial: encuentra rápido las preguntas falladas de un alumno.
create index if not exists quiz_respuestas_tenant_alumno_falladas_idx
  on quiz_respuestas (tenant_id, alumno_id, pregunta_id) where not acierto;

create or replace function quiz_respuestas_para_repaso(p_tenant uuid, p_alumno uuid, p_ventana int default 8)
returns table (curso_id uuid, modulo_id uuid, pregunta_id uuid, acierto boolean, created_at timestamptz)
language sql stable
as $$
  select r.curso_id, r.modulo_id, r.pregunta_id, r.acierto, r.created_at
  from (
    select distinct q.pregunta_id as pid
    from quiz_respuestas q
    where q.tenant_id = p_tenant and q.alumno_id = p_alumno and not q.acierto
  ) f
  cross join lateral (
    select x.curso_id, x.modulo_id, x.pregunta_id, x.acierto, x.created_at
    from quiz_respuestas x
    where x.tenant_id = p_tenant and x.alumno_id = p_alumno and x.pregunta_id = f.pid
    order by x.created_at desc
    limit least(greatest(p_ventana, 1), 20)
  ) r
$$;

-- Solo el servidor (que ya filtra por el tenant del host y el alumno de la sesión).
revoke all on function quiz_respuestas_para_repaso(uuid, uuid, int) from public, anon, authenticated;
grant execute on function quiz_respuestas_para_repaso(uuid, uuid, int) to service_role;
