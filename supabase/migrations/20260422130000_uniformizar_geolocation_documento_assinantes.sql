-- Migration: Uniformizar geolocalização em documento_assinantes
-- Data: 2026-04-22 13:00:00
-- Descrição: Substitui coluna `geolocation jsonb` por 4 colunas separadas
--            (latitude, longitude, geolocation_accuracy, geolocation_timestamp)
--            para paridade com assinatura_digital_assinaturas (Fluxo Formulário).
--            Backfill é feito a partir do jsonb antes do DROP.

-- ============================================================================
-- 1. Adicionar colunas novas
-- ============================================================================

alter table public.assinatura_digital_documento_assinantes
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geolocation_accuracy double precision,
  add column if not exists geolocation_timestamp text;

comment on column public.assinatura_digital_documento_assinantes.latitude
  is 'Latitude capturada no momento da assinatura (navigator.geolocation.coords.latitude).';
comment on column public.assinatura_digital_documento_assinantes.longitude
  is 'Longitude capturada no momento da assinatura (navigator.geolocation.coords.longitude).';
comment on column public.assinatura_digital_documento_assinantes.geolocation_accuracy
  is 'Precisão em metros da geolocalização reportada pelo device (navigator.geolocation.coords.accuracy).';
comment on column public.assinatura_digital_documento_assinantes.geolocation_timestamp
  is 'Timestamp (em ms Unix, guardado como text) reportado pelo device no momento da leitura da geolocalização. Valor forense: preserva exatamente o que o device reportou.';

-- ============================================================================
-- 2. Backfill: extrair valores do jsonb para as colunas novas
-- ============================================================================

update public.assinatura_digital_documento_assinantes
set
  latitude = case
    when geolocation ? 'latitude' and jsonb_typeof(geolocation -> 'latitude') = 'number'
      then (geolocation ->> 'latitude')::double precision
    else null
  end,
  longitude = case
    when geolocation ? 'longitude' and jsonb_typeof(geolocation -> 'longitude') = 'number'
      then (geolocation ->> 'longitude')::double precision
    else null
  end,
  geolocation_accuracy = case
    when geolocation ? 'accuracy' and jsonb_typeof(geolocation -> 'accuracy') = 'number'
      then (geolocation ->> 'accuracy')::double precision
    else null
  end,
  geolocation_timestamp = case
    when geolocation ? 'timestamp' then geolocation ->> 'timestamp'
    else null
  end
where geolocation is not null
  and (latitude is null and longitude is null);

-- ============================================================================
-- 3. Remover coluna jsonb antiga
-- ============================================================================

alter table public.assinatura_digital_documento_assinantes
  drop column if exists geolocation;
