-- 0007_pagina_academia.sql
-- Pagina publica de la academia (ADR 018): template elegido, contenido en
-- borrador, foto de portada, testimonios reales y la version publicada que ve
-- el sitio publico. Ademas, la solicitud de dominio propio (concierge, RQ-30).
-- Una fila por academia (tenant_id es la clave primaria).
-- Idempotente (if not exists / drop ... if exists).

create table if not exists paginas_academia (
  tenant_id uuid primary key references tenants(id) on delete cascade,

  -- Borrador (lo que edita el creador; el sitio publico NO lo lee).
  template text check (template in ('programa', 'maestro', 'consultor')),
  titulo text check (titulo is null or char_length(titulo) between 1 and 90),
  bajada text check (bajada is null or char_length(bajada) between 1 and 240),
  foto_url text check (foto_url is null or foto_url ~ '^https://'),
  accion text not null default 'inscribirme' check (accion in ('inscribirme', 'conversacion')),
  -- Cursos publicados que el creador decidio NO mostrar (los nuevos se muestran por defecto).
  cursos_ocultos uuid[] not null default '{}',
  bio_nombre text check (bio_nombre is null or char_length(bio_nombre) between 1 and 80),
  bio_texto text check (bio_texto is null or char_length(bio_texto) between 1 and 400),
  -- [{ "nombre": "Nombre y cargo", "texto": "...", "autorizado_at": "..." }], maximo 6.
  testimonios jsonb not null default '[]'::jsonb
    check (jsonb_typeof(testimonios) = 'array' and jsonb_array_length(testimonios) <= 6),
  -- true cuando el creador quito los testimonios y cifras de ejemplo del template.
  ejemplo_testimonios_quitado boolean not null default false,

  -- Version publicada: copia del borrador al presionar "Publicar" (el sitio publico lee esto).
  publicado jsonb check (publicado is null or jsonb_typeof(publicado) = 'object'),
  publicada_at timestamptz,

  -- Dominio propio pedido por el creador; el equipo lo conecta a mano (RQ-30) y
  -- recien ahi llena tenants.custom_domain.
  dominio_solicitado text check (
    dominio_solicitado is null
    or (dominio_solicitado = lower(dominio_solicitado) and char_length(dominio_solicitado) <= 253)
  ),
  dominio_token text check (dominio_token is null or dominio_token ~ '^[a-f0-9]{24}$'),
  dominio_solicitado_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists paginas_academia_set_updated_at on paginas_academia;
create trigger paginas_academia_set_updated_at before update on paginas_academia
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: solo el creador de la academia lee y escribe su pagina. El sitio
-- publico lee la columna `publicado` desde el servidor (lib/sitio/paginaPublica.ts,
-- lista blanca de admin.ts), siempre filtrando por tenant_id.
-- ---------------------------------------------------------------------------
alter table paginas_academia enable row level security;

drop policy if exists paginas_academia_select_por_tenant on paginas_academia;
create policy paginas_academia_select_por_tenant on paginas_academia
  for select using (tenant_id = auth_tenant_id());
drop policy if exists paginas_academia_insert_por_tenant on paginas_academia;
create policy paginas_academia_insert_por_tenant on paginas_academia
  for insert with check (tenant_id = auth_tenant_id());
drop policy if exists paginas_academia_update_por_tenant on paginas_academia;
create policy paginas_academia_update_por_tenant on paginas_academia
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists paginas_academia_delete_por_tenant on paginas_academia;
create policy paginas_academia_delete_por_tenant on paginas_academia
  for delete using (tenant_id = auth_tenant_id());

-- El rol anon (visitantes del sitio) no tiene acceso directo.
revoke all on paginas_academia from anon, authenticated;
grant select, insert, update, delete on paginas_academia to authenticated;
grant select, insert, update, delete on paginas_academia to service_role;