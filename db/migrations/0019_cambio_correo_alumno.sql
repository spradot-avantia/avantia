-- 0019_cambio_correo_alumno.sql
-- Cambio de correo del alumno con confirmación del correo nuevo (ADR 036). Idempotente y aditiva.
--
-- alumno_tokens: tipo nuevo `cambio_correo` y columna `dato` con el correo nuevo (solo para ese tipo).
-- `alumnos.correo` no cambia hasta que el alumno confirma el enlace enviado al correo nuevo.
-- La tabla ya tiene tenant_id, RLS sin acceso para clientes (solo service role) e índice que
-- empieza por tenant_id; no se agregan políticas.
-- eventos: tipo nuevo `correo_cambiado`.

alter table alumno_tokens add column if not exists dato text;

alter table alumno_tokens drop constraint if exists alumno_tokens_tipo_check;
alter table alumno_tokens add constraint alumno_tokens_tipo_check
  check (tipo in ('sesion', 'confirmar', 'recuperar', 'cambio_correo'));

alter table alumno_tokens drop constraint if exists alumno_tokens_dato_check;
alter table alumno_tokens add constraint alumno_tokens_dato_check check (
  (tipo = 'cambio_correo' and dato is not null and dato = lower(dato) and char_length(dato) <= 254)
  or (tipo <> 'cambio_correo' and dato is null)
);

alter table eventos drop constraint if exists eventos_tipo_check;
alter table eventos add constraint eventos_tipo_check check (tipo in (
  'inscripcion', 'leccion_abierta', 'leccion_completada',
  'intento_quiz', 'curso_completado', 'correo_abierto', 'correo_clic',
  'cuenta_creada', 'inscripcion_creada', 'inscripcion_activada',
  'pago_registrado', 'inscripcion_rechazada', 'correo_cambiado'
));
