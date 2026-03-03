-- =============================================================================
-- migration: criar tabela credenciais_email
-- descricao: credenciais IMAP/SMTP individuais por usuario (Cloudron)
-- =============================================================================

create table if not exists public.credenciais_email (
  id bigint generated always as identity primary key,
  usuario_id integer not null references public.usuarios(id) on delete cascade,

  -- IMAP
  imap_host text not null default 'my.zattaradvogados.com',
  imap_port integer not null default 993,
  imap_user text not null,
  imap_pass text not null,

  -- SMTP
  smtp_host text not null default 'my.zattaradvogados.com',
  smtp_port integer not null default 587,
  smtp_user text not null,
  smtp_pass text not null,

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint credenciais_email_usuario_id_unique unique (usuario_id)
);

create index if not exists idx_credenciais_email_usuario_id
  on public.credenciais_email(usuario_id);

-- RLS
alter table public.credenciais_email enable row level security;

create policy "Users can view own email credentials"
  on public.credenciais_email for select
  using (
    usuario_id in (
      select id from public.usuarios where auth_user_id = auth.uid()
    )
  );

create policy "Users can insert own email credentials"
  on public.credenciais_email for insert
  with check (
    usuario_id in (
      select id from public.usuarios where auth_user_id = auth.uid()
    )
  );

create policy "Users can update own email credentials"
  on public.credenciais_email for update
  using (
    usuario_id in (
      select id from public.usuarios where auth_user_id = auth.uid()
    )
  );

create policy "Users can delete own email credentials"
  on public.credenciais_email for delete
  using (
    usuario_id in (
      select id from public.usuarios where auth_user_id = auth.uid()
    )
  );

create policy "Service role full access to email credentials"
  on public.credenciais_email for all
  using (auth.role() = 'service_role');
