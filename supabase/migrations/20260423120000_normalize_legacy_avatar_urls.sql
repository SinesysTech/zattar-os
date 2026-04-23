-- Migration: normalizar avatar_url legacy
-- Data: 2026-04-23 12:00:00
-- Descrição: Registros legacy em usuarios.avatar_url contêm apenas o filename
--            (ex: "25.jpg"). Esta migration prefixa esses valores com a URL
--            pública do bucket "avatar" do Supabase Storage, alinhando-os
--            ao formato canônico que o upload atual já produz
--            (https://<projeto>.supabase.co/storage/v1/object/public/avatar/<file>).
--
-- Motivação: o resolver `resolveAvatarUrl` (src/lib/avatar-url.ts) cobria essa
--            normalização em runtime, mas o valor cru escapava por mappers
--            banco→domain que esqueceram de invocar o resolver, gerando
--            requests relativas tipo `GET /app/25.jpg 404`. Normalizar no
--            banco elimina o legacy de vez.
--
-- Critério: avatar_url IS NOT NULL AND NOT LIKE 'http%'
-- Idempotente: linhas já com URL absoluta são ignoradas pelo predicate.

update public.usuarios
set avatar_url = 'https://cxxdivtgeslrujpfpivs.supabase.co/storage/v1/object/public/avatar/' || avatar_url
where avatar_url is not null
  and avatar_url not like 'http%';
