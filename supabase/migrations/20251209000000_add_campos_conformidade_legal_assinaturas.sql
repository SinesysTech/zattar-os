-- Migration: Campos conformidade MP 2.200-2/2001 (hashes, termos, fingerprint)
-- Date: 2025-12-09
-- Description: Adiciona campos obrigatórios para conformidade legal de assinatura eletrônica
--   - hash_original_sha256: Hash SHA-256 do PDF pré-assinatura
--   - hash_final_sha256: Hash SHA-256 do PDF final com manifesto
--   - termos_aceite_versao: Versão dos termos aceitos
--   - termos_aceite_data: Timestamp do aceite dos termos
--   - dispositivo_fingerprint_raw: Fingerprint do dispositivo (JSONB)

alter table public.assinatura_digital_assinaturas
  add column if not exists hash_original_sha256 text,
  add column if not exists hash_final_sha256 text,
  add column if not exists termos_aceite_versao text,
  add column if not exists termos_aceite_data timestamp with time zone,
  add column if not exists dispositivo_fingerprint_raw jsonb;

-- Retrocompatibilidade: preencher legacy para registros existentes
-- Marcamos registros antigos com prefixo LEGACY para identificação
-- Usa coalesce para garantir valor mesmo se created_at for nulo
update public.assinatura_digital_assinaturas
set
  hash_original_sha256 = 'LEGACY-' || id::text,
  termos_aceite_versao = 'v0.0-legacy',
  termos_aceite_data = coalesce(created_at, now())
where hash_original_sha256 is null;

-- Tornar colunas obrigatórias após preencher dados legacy
alter table public.assinatura_digital_assinaturas
  alter column hash_original_sha256 set not null,
  alter column termos_aceite_versao set not null,
  alter column termos_aceite_data set not null;

-- Comentários descritivos para documentação
comment on column public.assinatura_digital_assinaturas.hash_original_sha256 is 'Hash SHA-256 PDF pré-assinatura (MP 2.200-2/2001)';
comment on column public.assinatura_digital_assinaturas.hash_final_sha256 is 'Hash SHA-256 PDF final com manifesto de assinatura';
comment on column public.assinatura_digital_assinaturas.termos_aceite_versao is 'Versão dos termos aceitos (ex: v1.0-MP2200-2)';
comment on column public.assinatura_digital_assinaturas.termos_aceite_data is 'Timestamp UTC do aceite dos termos';
comment on column public.assinatura_digital_assinaturas.dispositivo_fingerprint_raw is 'Fingerprint do dispositivo (JSONB: tela, bateria, etc.)';

-- Índice para busca por hash (auditoria/verificação de integridade)
create index if not exists idx_assinatura_digital_assinaturas_hash_original on public.assinatura_digital_assinaturas(hash_original_sha256);
