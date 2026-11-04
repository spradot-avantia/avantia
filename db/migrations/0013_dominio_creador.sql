-- 0013_dominio_creador.sql
-- Lectura acotada para mostrar el dominio por estudiante al creador (ADR 026).
-- Funciones de SOLO lectura, `security invoker`: aplica la RLS de quien llama
-- (el creador solo ve su academia; con un p_tenant ajeno recibe 0 filas).
-- Tope: 200 alumnos por llamada. Idempotente.

create or replace function quiz_resumen_por_alumno(p_tenant uuid, p_alumnos uuid[])
returns table (alumno_id uuid, curso_id uuid, respondidas int, aciertos_primer_intento int)
language sql stable
as $$
  select r.alumno_id,
         r.curso_id,
         count(distinct r.pregunta_id)::int,
         count(distinct r.pregunta_id) filter (where r.primer_intento and r.acierto)::int
  from quiz_respuestas r
  where r.tenant_id = p_tenant
    and r.alumno_id = any (p_alumnos[1:200])
  group by r.alumno_id, r.curso_id
$$;

create or replace function quiz_respuestas_para_repaso_lote(p_tenant uuid, p_alumnos uuid[], p_ventana int default 8)
returns table (alumno_id uuid, curso_id uuid, modulo_id uuid, pregunta_id uuid, acierto boolean, created_at timestamptz)
language sql stable
as $$
  select r.alumno_id, r.curso_id, r.modulo_id, r.pregunta_id, r.acierto, r.created_at
  from (
    select distinct q.alumno_id as aid, q.pregunta_id as pid
    from quiz_respuestas q
    where q.tenant_id = p_tenant
      and q.alumno_id = any (p_alumnos[1:200])
      and not q.acierto
  ) f
  cross join lateral (
    select x.alumno_id, x.curso_id, x.modulo_id, x.pregunta_id, x.acierto, x.created_at
    from quiz_respuestas x
    where x.tenant_id = p_tenant and x.alumno_id = f.aid and x.pregunta_id = f.pid
    order by x.created_at desc
    limit least(greatest(p_ventana, 1), 20)
  ) r
$$;

revoke all on function quiz_resumen_por_alumno(uuid, uuid[]) from public, anon;
revoke all on function quiz_respuestas_para_repaso_lote(uuid, uuid[], int) from public, anon;
grant execute on function quiz_resumen_por_alumno(uuid, uuid[]) to authenticated, service_role;
grant execute on function quiz_respuestas_para_repaso_lote(uuid, uuid[], int) to authenticated, service_role;
