-- 0016_materiales.sql
-- Materiales de módulo y de lección (ADR 029, F2): enlaces o documentos (siempre https,
-- ADR 008; la subida de archivos propios sigue fuera de alcance, ADR 005). Idempotente.
--
-- Aislamiento por tenant: tenant_id, RLS en las 4 operaciones, índice compuesto que empieza
-- por tenant_id y claves foráneas compuestas (módulo/lección + tenant) para que un material
-- no pueda apuntar a un módulo de otra academia. leccion_id es opcional: null = material del
-- módulo; con valor = material de esa lección (que debe pertenecer al mismo módulo, lo
-- verifica la aplicación al crear).

create table if not exists materiales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  modulo_id uuid not null,
  leccion_id uuid,
  titulo text not null check (char_length(titulo) between 1 and 120),
  -- Nulo mientras el creador aún no pega el enlace (el material queda "incompleto").
  url text check (url is null or (url ~ '^https://' and char_length(url) <= 2000)),
  tipo text not null default 'enlace' check (tipo in ('documento', 'enlace')),
  nota text check (nota is null or char_length(nota) <= 200),
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade,
  foreign key (modulo_id, tenant_id) references modulos (id, tenant_id) on delete cascade,
  foreign key (leccion_id, tenant_id) references lecciones (id, tenant_id) on delete cascade
);
create index if not exists materiales_tenant_modulo_orden_idx on materiales (tenant_id, modulo_id, orden);
create index if not exists materiales_tenant_curso_idx on materiales (tenant_id, curso_id);
create index if not exists materiales_tenant_leccion_idx on materiales (tenant_id, leccion_id) where leccion_id is not null;

drop trigger if exists materiales_set_updated_at on materiales;
create trigger materiales_set_updated_at before update on materiales
  for each row execute function set_updated_at();

alter table materiales enable row level security;
drop policy if exists materiales_select_por_tenant on materiales;
create policy materiales_select_por_tenant on materiales for select using (tenant_id = auth_tenant_id());
drop policy if exists materiales_insert_por_tenant on materiales;
create policy materiales_insert_por_tenant on materiales for insert with check (tenant_id = auth_tenant_id());
drop policy if exists materiales_update_por_tenant on materiales;
create policy materiales_update_por_tenant on materiales
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists materiales_delete_por_tenant on materiales;
create policy materiales_delete_por_tenant on materiales for delete using (tenant_id = auth_tenant_id());

grant select, insert, update, delete on materiales to service_role;
grant select, insert, update, delete on materiales to authenticated;
