-- 0018_lecciones_archivo.sql
-- Archivo propio en lecciones de tipo Documento (ADR 030): además del enlace https, una lección
-- de tipo documento puede apuntar a un archivo subido al bucket PRIVADO `materiales` (el mismo
-- de la migración 0017, con las mismas políticas por carpeta de tenant). Idempotente y aditiva.
--
-- Reutiliza `lecciones.storage_path` (ruta {tenant_id}/{curso_id}/{uuid}.{ext}) y
-- `lecciones.contenido_tipo` (tipo MIME). Suma el nombre original y el tamaño, necesario para
-- contar el archivo en la cuota de la academia junto con los materiales. El alumno nunca lee el
-- bucket directo: la aplicación emite URLs firmadas de corta duración tras comprobar sesión,
-- inscripción activa y lección liberada.

alter table lecciones add column if not exists archivo_nombre text;
alter table lecciones add column if not exists bytes integer;

alter table lecciones drop constraint if exists lecciones_bytes_check;
alter table lecciones add constraint lecciones_bytes_check check (bytes is null or bytes between 1 and 26214400);
alter table lecciones drop constraint if exists lecciones_archivo_coherente;
alter table lecciones add constraint lecciones_archivo_coherente check (
  (storage_path is null and archivo_nombre is null and bytes is null)
  or (
    storage_path is not null and archivo_nombre is not null and bytes is not null
    and tipo = 'documento' and contenido_url is null
  )
);
